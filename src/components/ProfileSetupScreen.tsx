import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Sparkles, 
  ExternalLink, User, Lock, Check, RefreshCw, LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserSession, PlatformLinks } from '../types';
import SmartPollLogo from './SmartPollLogo';

interface ProfileSetupScreenProps {
  session: UserSession;
  onProfileCompleted: (updatedSession: UserSession) => void;
  onLogout: () => void;
}

interface PlatformValidation {
  isValid: boolean;
  username: string;
  cleanUrl: string;
  error?: string;
}

export default function ProfileSetupScreen({ session, onProfileCompleted, onLogout }: ProfileSetupScreenProps) {
  const student = session.studentDetails;
  const registerNo = session.username || student?.registerNumber || '';
  const studentName = student?.studentName || session.name || registerNo;

  // Form State
  const [links, setLinks] = useState<{
    leetcode: string;
    codeforces: string;
    codechef: string;
    atcoder: string;
    github: string;
    hackerrank: string;
    codolio: string;
    geeksforgeeks: string;
  }>({
    leetcode: session.profileLinks?.leetcode || '',
    codeforces: session.profileLinks?.codeforces || '',
    codechef: session.profileLinks?.codechef || '',
    atcoder: session.profileLinks?.atcoder || '',
    github: session.profileLinks?.github || '',
    hackerrank: session.profileLinks?.hackerrank || '',
    codolio: session.profileLinks?.codolio || '',
    geeksforgeeks: session.profileLinks?.geeksforgeeks || ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper validation & username extraction
  const validateAndExtract = (platform: string, input: string, isRequired: boolean): PlatformValidation => {
    const raw = input.trim();
    if (!raw) {
      if (isRequired) {
        return { isValid: false, username: '', cleanUrl: '', error: 'Please enter a valid profile URL.' };
      }
      return { isValid: true, username: '', cleanUrl: '' };
    }

    let handle = '';

    // Standardized domains per platform
    const domainRules: Record<string, { domain: string; buildUrl: (h: string) => string; extractHandle: (u: string) => string }> = {
      leetcode: {
        domain: 'leetcode.com',
        buildUrl: (h) => `https://leetcode.com/u/${h}/`,
        extractHandle: (u) => {
          const m = u.match(/leetcode\.com\/(?:u\/)?([^\/?#]+)/i);
          return m ? m[1] : u.split('/').filter(Boolean).pop() || '';
        }
      },
      codeforces: {
        domain: 'codeforces.com',
        buildUrl: (h) => `https://codeforces.com/profile/${h}`,
        extractHandle: (u) => {
          const m = u.match(/codeforces\.com\/(?:profile\/)?([^\/?#]+)/i);
          return m ? m[1] : u.split('/').filter(Boolean).pop() || '';
        }
      },
      codechef: {
        domain: 'codechef.com',
        buildUrl: (h) => `https://www.codechef.com/users/${h}`,
        extractHandle: (u) => {
          const m = u.match(/codechef\.com\/(?:users\/)?([^\/?#]+)/i);
          return m ? m[1] : u.split('/').filter(Boolean).pop() || '';
        }
      },
      atcoder: {
        domain: 'atcoder.jp',
        buildUrl: (h) => `https://atcoder.jp/users/${h}`,
        extractHandle: (u) => {
          const m = u.match(/atcoder\.jp\/(?:users\/)?([^\/?#]+)/i);
          return m ? m[1] : u.split('/').filter(Boolean).pop() || '';
        }
      },
      github: {
        domain: 'github.com',
        buildUrl: (h) => `https://github.com/${h}`,
        extractHandle: (u) => {
          const m = u.match(/github\.com\/([^\/?#]+)/i);
          return m ? m[1] : u.split('/').filter(Boolean).pop() || '';
        }
      },
      hackerrank: {
        domain: 'hackerrank.com',
        buildUrl: (h) => `https://hackerrank.com/${h}`,
        extractHandle: (u) => {
          const m = u.match(/hackerrank\.com\/(?:profile\/)?([^\/?#]+)/i);
          return m ? m[1] : u.split('/').filter(Boolean).pop() || '';
        }
      },
      codolio: {
        domain: 'codolio.com',
        buildUrl: (h) => `https://codolio.com/profile/${h}`,
        extractHandle: (u) => {
          const m = u.match(/codolio\.com\/(?:profile\/)?([^\/?#]+)/i);
          return m ? m[1] : u.split('/').filter(Boolean).pop() || '';
        }
      },
      geeksforgeeks: {
        domain: 'geeksforgeeks.org',
        buildUrl: (h) => `https://geeksforgeeks.org/user/${h}`,
        extractHandle: (u) => {
          const m = u.match(/geeksforgeeks\.org\/(?:user\/)?([^\/?#]+)/i);
          return m ? m[1] : u.split('/').filter(Boolean).pop() || '';
        }
      }
    };

    const rule = domainRules[platform];

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      if (!raw.toLowerCase().includes(rule.domain)) {
        return { 
          isValid: false, 
          username: '', 
          cleanUrl: raw, 
          error: 'Please enter a valid profile URL.' 
        };
      }
      handle = rule.extractHandle(raw);
      if (!handle) {
        return { isValid: false, username: '', cleanUrl: raw, error: 'Please enter a valid profile URL.' };
      }
      return { isValid: true, username: handle, cleanUrl: raw };
    } else {
      // Raw handle entered
      handle = raw;
      const constructed = rule.buildUrl(handle);
      return { isValid: true, username: handle, cleanUrl: constructed };
    }
  };

  const lcVal = validateAndExtract('leetcode', links.leetcode, true);
  const cfVal = validateAndExtract('codeforces', links.codeforces, true);
  const ccVal = validateAndExtract('codechef', links.codechef, true);

  const mandatoryValidCount = (lcVal.isValid ? 1 : 0) + (cfVal.isValid ? 1 : 0) + (ccVal.isValid ? 1 : 0);
  const isAllMandatoryValid = mandatoryValidCount === 3;

  const triggerConfettiEffect = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    } catch (e) {
      console.log('Confetti effect fallback', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAllMandatoryValid) {
      setError('Please provide valid profile links for LeetCode, Codeforces, and CodeChef.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanLinks = {
        leetcode: lcVal.cleanUrl,
        codeforces: cfVal.cleanUrl,
        codechef: ccVal.cleanUrl,
        atcoder: validateAndExtract('atcoder', links.atcoder, false).cleanUrl,
        github: validateAndExtract('github', links.github, false).cleanUrl,
        hackerrank: validateAndExtract('hackerrank', links.hackerrank, false).cleanUrl,
        codolio: validateAndExtract('codolio', links.codolio, false).cleanUrl,
        geeksforgeeks: validateAndExtract('geeksforgeeks', links.geeksforgeeks, false).cleanUrl
      };

      const response = await fetch('/api/code-analytics/save-student-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registerNumber: registerNo,
          profileLinks: cleanLinks
        })
      });

      let data: any = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          console.error("JSON parse error:", e);
        }
      }

      if (!response.ok) {
        setError(data.error || 'Failed to save coding profile links.');
        setIsLoading(false);
        return;
      }

      setSaveSuccess(true);
      triggerConfettiEffect();
      setTimeout(() => {
        onProfileCompleted(data.user);
      }, 1200);

    } catch (err) {
      console.error(err);
      setError('Connection error while saving profiles. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between px-3 py-4 sm:p-6 md:p-8 font-sans relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Container */}
      <div className="max-w-4xl mx-auto w-full flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <SmartPollLogo size="md" showText={true} />
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-mono font-bold">
            MANDATORY SETUP
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-200">{studentName}</div>
            <div className="text-[11px] text-slate-400 font-mono">Reg: {registerNo}</div>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Card */}
      <main className="max-w-3xl mx-auto w-full relative z-10 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl"
        >
          {/* Header Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-3">
              <Code className="w-4 h-4" />
              <span>COMPETITIVE PROGRAMMING PROFILE SETUP</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
              Complete Your Coding Profiles
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              To enable automatic coding analytics, contest tracking, and live leaderboards, please provide your official coding platform links.
            </p>
          </div>

          {/* Progress Tracker Bar */}
          <div className="mb-8 bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="flex justify-between items-center text-xs font-bold mb-2">
              <span className="text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Mandatory Profiles Setup Progress
              </span>
              <span className={`font-mono ${isAllMandatoryValid ? 'text-emerald-400' : 'text-blue-400'}`}>
                {mandatoryValidCount}/3 Mandatory Completed ({Math.round((mandatoryValidCount / 3) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <motion.div
                className={`h-full rounded-full transition-all duration-500 ${
                  isAllMandatoryValid 
                    ? 'bg-linear-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/20' 
                    : 'bg-linear-to-r from-blue-600 to-indigo-500'
                }`}
                style={{ width: `${(mandatoryValidCount / 3) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-3 shadow-lg shadow-emerald-950/50"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-extrabold uppercase tracking-wide text-emerald-200">Profiles Saved Successfully</div>
                  <div className="text-[11px] font-normal text-emerald-300">Linking coding profiles to your register number and redirecting to Student Dashboard...</div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-medium flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* MANDATORY PLATFORMS SECTION */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Mandatory Required Platforms (3/3)
                </h2>
                <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  Required for Dashboard Access
                </span>
              </div>

              <div className="space-y-4">
                {/* 1. LeetCode */}
                <div className={`p-4 rounded-2xl transition-all border ${
                  lcVal.isValid 
                    ? 'bg-slate-950/60 border-emerald-500/30' 
                    : links.leetcode 
                      ? 'bg-slate-950/60 border-red-500/30' 
                      : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className="text-amber-400 font-black">🟡 LeetCode</span>
                      <span className="text-red-400 font-bold text-[10px]">* REQUIRED</span>
                    </label>
                    {lcVal.isValid ? (
                      <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Username: {lcVal.username}</span>
                      </span>
                    ) : links.leetcode ? (
                      <span className="text-[10px] font-medium text-red-400">{lcVal.error}</span>
                    ) : (
                      <span className="text-[10px] text-slate-500">e.g. https://leetcode.com/u/username/</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={links.leetcode}
                    onChange={(e) => setLinks({ ...links, leetcode: e.target.value })}
                    placeholder="https://leetcode.com/u/your_username/"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                  />
                </div>

                {/* 2. Codeforces */}
                <div className={`p-4 rounded-2xl transition-all border ${
                  cfVal.isValid 
                    ? 'bg-slate-950/60 border-emerald-500/30' 
                    : links.codeforces 
                      ? 'bg-slate-950/60 border-red-500/30' 
                      : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className="text-red-400 font-black">🔴 Codeforces</span>
                      <span className="text-red-400 font-bold text-[10px]">* REQUIRED</span>
                    </label>
                    {cfVal.isValid ? (
                      <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Username: {cfVal.username}</span>
                      </span>
                    ) : links.codeforces ? (
                      <span className="text-[10px] font-medium text-red-400">{cfVal.error}</span>
                    ) : (
                      <span className="text-[10px] text-slate-500">e.g. https://codeforces.com/profile/your_username</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={links.codeforces}
                    onChange={(e) => setLinks({ ...links, codeforces: e.target.value })}
                    placeholder="https://codeforces.com/profile/your_username"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                  />
                </div>

                {/* 3. CodeChef */}
                <div className={`p-4 rounded-2xl transition-all border ${
                  ccVal.isValid 
                    ? 'bg-slate-950/60 border-emerald-500/30' 
                    : links.codechef 
                      ? 'bg-slate-950/60 border-red-500/30' 
                      : 'bg-slate-950/60 border-slate-800'
                }`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span className="text-amber-600 font-black">🟤 CodeChef</span>
                      <span className="text-red-400 font-bold text-[10px]">* REQUIRED</span>
                    </label>
                    {ccVal.isValid ? (
                      <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Username: {ccVal.username}</span>
                      </span>
                    ) : links.codechef ? (
                      <span className="text-[10px] font-medium text-red-400">{ccVal.error}</span>
                    ) : (
                      <span className="text-[10px] text-slate-500">e.g. https://www.codechef.com/users/your_username</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={links.codechef}
                    onChange={(e) => setLinks({ ...links, codechef: e.target.value })}
                    placeholder="https://www.codechef.com/users/your_username"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* OPTIONAL PLATFORMS SECTION */}
            <div className="pt-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <span>Optional Platforms (Recommended)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'codolio', name: 'Codolio', icon: '🟣', ph: 'https://codolio.com/profile/username' },
                  { key: 'atcoder', name: 'AtCoder', icon: '⚫', ph: 'https://atcoder.jp/users/username' },
                  { key: 'github', name: 'GitHub', icon: '🐙', ph: 'https://github.com/username' },
                  { key: 'hackerrank', name: 'HackerRank', icon: '🟢', ph: 'https://hackerrank.com/username' },
                  { key: 'geeksforgeeks', name: 'GeeksforGeeks', icon: '🌿', ph: 'https://geeksforgeeks.org/user/username' }
                ].map(({ key, name, icon, ph }) => {
                  const val = links[key as keyof typeof links];
                  const res = validateAndExtract(key, val, false);

                  return (
                    <div key={key} className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <span>{icon}</span>
                          <span>{name}</span>
                        </label>
                        {res.username && (
                          <span className="text-[10px] font-mono text-emerald-400 font-medium">
                            @{res.username}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
                        placeholder={ph}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 font-mono"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !isAllMandatoryValid}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  isLoading
                    ? 'bg-blue-600/50 text-white/70 cursor-not-allowed'
                    : isAllMandatoryValid
                      ? 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/20 hover:scale-[1.01]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving Profiles & Fetching Live Analytics...</span>
                  </>
                ) : (
                  <>
                    <span>Save Profiles & Access Student Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </main>

      {/* Subtle Security Badge Note */}
      <div className="text-center text-slate-500 text-xs py-2 mt-4 font-mono flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
        <span>SC CODE ANALYTICS • Secure Profile Mapping Engine © 2026</span>
      </div>
    </div>
  );
}
