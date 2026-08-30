import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ExternalLink, Flame, Trophy, Award, CheckCircle2, 
  BarChart3, Code2, Globe, Calendar, Zap, Shield, Save, RefreshCw, Layers,
  XCircle, Check, AlertCircle, TrendingUp, Sparkles
} from 'lucide-react';
import { 
  CodeAnalyticsStudentMetrics, 
  PlatformLinks 
} from '../../types';

interface StudentAnalyticsProfileModalProps {
  student: CodeAnalyticsStudentMetrics | null;
  onClose: () => void;
  onUpdateLinks?: (regNo: string, links: PlatformLinks) => Promise<void>;
  onSyncStudent?: (regNo: string) => Promise<void>;
}

const getPlatformUrl = (plat: string, rawVal?: string) => {
  if (!rawVal) return null;
  const val = rawVal.trim();
  if (!val) return null;
  if (val.startsWith('http://') || val.startsWith('https://')) return val;
  const handle = val;
  switch (plat.toLowerCase()) {
    case 'leetcode': return `https://leetcode.com/u/${handle}/`;
    case 'codechef': return `https://www.codechef.com/users/${handle}`;
    case 'codeforces': return `https://codeforces.com/profile/${handle}`;
    case 'atcoder': return `https://atcoder.jp/users/${handle}`;
    case 'codolio': return `https://codolio.com/profile/${handle}`;
    case 'github': return `https://github.com/${handle}`;
    case 'hackerrank': return `https://hackerrank.com/${handle}`;
    case 'geeksforgeeks': return `https://geeksforgeeks.org/user/${handle}`;
    default: return `https://${plat}.com/${handle}`;
  }
};

export default function StudentAnalyticsProfileModal({
  student,
  onClose,
  onUpdateLinks,
  onSyncStudent
}: StudentAnalyticsProfileModalProps) {
  if (!student) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'ai_insights' | 'leetcode' | 'codechef' | 'codeforces' | 'submissions' | 'contests' | 'links'>('overview');
  const [linksForm, setLinksForm] = useState<PlatformLinks>({ ...student.profileLinks });
  const [savingLinks, setSavingLinks] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  React.useEffect(() => {
    if (student) {
      setLinksForm({ ...student.profileLinks });
    }
  }, [student?.registerNumber, JSON.stringify(student?.profileLinks || {})]);

  const lcLink = student.profileLinks?.leetcode?.trim();
  const ccLink = student.profileLinks?.codechef?.trim();
  const cfLink = student.profileLinks?.codeforces?.trim();
  const atcoderLink = student.profileLinks?.atcoder?.trim();
  const codolioLink = student.profileLinks?.codolio?.trim();
  const githubLink = student.profileLinks?.github?.trim();
  const hackerrankLink = student.profileLinks?.hackerrank?.trim();
  const gfgLink = student.profileLinks?.geeksforgeeks?.trim();
  const isAnyLinked = !!(lcLink || ccLink || cfLink || atcoderLink || codolioLink || githubLink || hackerrankLink || gfgLink);

  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateLinks) return;
    try {
      setSavingLinks(true);
      await onUpdateLinks(student.registerNumber, linksForm);
      setSaveSuccess('Platform profile links updated & saved successfully!');
      setTimeout(() => setSaveSuccess(''), 3500);
    } catch (err) {
      alert('Failed to save links.');
    } finally {
      setSavingLinks(false);
    }
  };

  const handleTriggerSync = async () => {
    if (!onSyncStudent) return;
    try {
      setSyncing(true);
      await onSyncStudent(student.registerNumber);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const platformIcons: Record<string, string> = {
    LeetCode: '🟡',
    CodeChef: '🟤',
    Codeforces: '🔴',
    AtCoder: '⚫',
    Codolio: '🟣',
    HackerRank: '🟢',
    GitHub: '🐙',
    GeeksforGeeks: '💚'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-5xl bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 rounded-3xl border border-blue-500/30 shadow-2xl text-white overflow-hidden my-8"
        >
          {/* Header Banner */}
          <div className="relative h-36 bg-gradient-to-r from-blue-800 via-indigo-900 to-slate-950 p-6 flex justify-between items-start">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/40 backdrop-blur-md">
                {student.department} • Year {student.year} • Sec {student.section}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/30 text-amber-200 border border-amber-400/40 backdrop-blur-md flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {student.streakDays || 0} Day Streak
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-mono text-slate-300 bg-slate-900/60 border border-slate-700/80">
                Last Sync: {student.lastSyncTime ? new Date(student.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : 'Never'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="relative z-10 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student Profile Info Bar */}
          <div className="relative px-6 pb-6 -mt-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 to-amber-500 blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
                <img
                  src={student.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${student.registerNumber}`}
                  alt={student.studentName}
                  className="relative w-20 h-20 rounded-2xl bg-slate-800 border-2 border-slate-700 object-cover shadow-xl"
                />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  {student.studentName}
                </h2>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Reg: <span className="text-blue-400 font-bold">{student.registerNumber}</span> • Mentor: <span className="text-slate-300 font-medium">{student.mentorName || 'Faculty Mentor'}</span>
                </div>

                {/* Linked Platforms Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border ${
                    lcLink ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-800/80 text-slate-500 border-slate-700'
                  }`}>
                    🟡 LeetCode: {lcLink ? <Check className="w-3 h-3 text-amber-400" /> : <span className="text-[10px]">Not Linked</span>}
                  </span>

                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border ${
                    ccLink ? 'bg-amber-600/10 text-amber-500 border-amber-600/30' : 'bg-slate-800/80 text-slate-500 border-slate-700'
                  }`}>
                    🟤 CodeChef: {ccLink ? <Check className="w-3 h-3 text-amber-500" /> : <span className="text-[10px]">Not Linked</span>}
                  </span>

                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border ${
                    cfLink ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-slate-800/80 text-slate-500 border-slate-700'
                  }`}>
                    🔴 Codeforces: {cfLink ? <Check className="w-3 h-3 text-red-400" /> : <span className="text-[10px]">Not Linked</span>}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                onClick={handleTriggerSync}
                disabled={syncing}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing Live Platform Data...' : 'Sync Live Data'}</span>
              </button>
            </div>
          </div>

          {/* Modal Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-4 bg-slate-900/60 border-b border-slate-800 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_insights')}
              className={`pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'ai_insights'
                  ? 'border-purple-500 text-purple-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>AI Insights</span>
              {student.aiAnalysis ? <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" /> : null}
            </button>

            <button
              onClick={() => setActiveTab('leetcode')}
              className={`pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'leetcode'
                  ? 'border-amber-400 text-amber-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🟡 LeetCode</span>
              {lcLink ? <span className="w-2 h-2 rounded-full bg-emerald-400" /> : <span className="text-[10px] text-slate-500">(Not Linked)</span>}
            </button>

            <button
              onClick={() => setActiveTab('codechef')}
              className={`pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'codechef'
                  ? 'border-amber-600 text-amber-500 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🟤 CodeChef</span>
              {ccLink ? <span className="w-2 h-2 rounded-full bg-emerald-400" /> : <span className="text-[10px] text-slate-500">(Not Linked)</span>}
            </button>

            <button
              onClick={() => setActiveTab('codeforces')}
              className={`pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'codeforces'
                  ? 'border-red-500 text-red-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🔴 Codeforces</span>
              {cfLink ? <span className="w-2 h-2 rounded-full bg-emerald-400" /> : <span className="text-[10px] text-slate-500">(Not Linked)</span>}
            </button>

            <button
              onClick={() => setActiveTab('submissions')}
              className={`pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Submissions ({student.recentSubmissions?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('contests')}
              className={`pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'contests'
                  ? 'border-blue-500 text-blue-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Contest History ({student.contestHistory?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('links')}
              className={`pb-3 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'links'
                  ? 'border-blue-500 text-blue-400 font-extrabold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Profile Links</span>
            </button>
          </div>

          {/* Modal Tab Content Area */}
          <div className="p-6 max-h-[62vh] overflow-y-auto space-y-6">
            {!isAnyLinked && activeTab !== 'links' && (
              <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
                <h3 className="text-lg font-extrabold text-white">No coding profile linked.</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  This student has not submitted any profile links yet. Click "Profile Links" tab to map LeetCode, CodeChef or Codeforces accounts.
                </p>
                <button
                  onClick={() => setActiveTab('links')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                >
                  Configure Profile Links
                </button>
              </div>
            )}

            {/* AI INSIGHTS TAB */}
            {activeTab === 'ai_insights' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3 text-purple-200 text-xs">
                  <Sparkles className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Authentic AI Analysis Engine</span>
                    <p className="text-[11px] text-purple-300 mt-0.5 leading-snug">
                      Gemini AI analyzes ONLY the real, verified profile metrics fetched from coding platforms. Gemini never invents or estimates problem counts, ratings, or badges.
                    </p>
                  </div>
                </div>

                {student.aiAnalysis ? (
                  <div className="space-y-4">
                    {/* Executive Summary */}
                    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span>📊 Executive Performance Evaluation</span>
                      </h4>
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">
                        {student.aiAnalysis.performanceSummary}
                      </p>
                    </div>

                    {/* Strengths & Actionable Areas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Coding Strengths
                        </h4>
                        <ul className="space-y-2">
                          {student.aiAnalysis.strengths?.map((str: string, i: number) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-amber-400" /> Target Areas to Grow
                        </h4>
                        <ul className="space-y-2">
                          {student.aiAnalysis.improvements?.map((imp: string, i: number) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Predicted Trend & Recommended Topics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-400" /> 4-Week Trajectory Prediction
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">
                          {student.aiAnalysis.predictedTrend}
                        </p>
                      </div>

                      <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-indigo-400" /> Recommended DSA Topics
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {student.aiAnalysis.recommendedTopics?.map((topic: string, i: number) => (
                            <span key={i} className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold font-mono">
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
                    <Sparkles className="w-10 h-10 text-purple-400 mx-auto animate-pulse" />
                    <h4 className="text-sm font-bold text-white">AI Insights Ready to Generate</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Click below to sync your live platform profile. Gemini will analyze your real problem solved count and generate personal insights.
                    </p>
                    <button
                      onClick={handleTriggerSync}
                      disabled={syncing}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all"
                    >
                      Generate AI Insights Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && isAnyLinked && (
              <>
                {(student.syncStatus === 'Unable to Fetch' || student.syncError) && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex-1">
                      <span className="font-bold text-amber-300">Sync Notice:</span> Unable to fetch latest coding activity.
                      {student.syncError && <span className="block text-[11px] text-amber-300/80 mt-0.5">{student.syncError}</span>}
                    </div>
                  </div>
                )}
                {/* 3 Real Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
                    <div className="text-xs text-slate-400 font-medium">Problems Solved Today</div>
                    <div className="text-3xl font-black text-amber-400 mt-1 flex items-center gap-2 font-mono">
                      {student.problemsSolvedToday || 0}
                      {(student.problemsSolvedToday || 0) > 0 && <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">🔥 Active Today</span>}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
                    <div className="text-xs text-slate-400 font-medium">Total Solved (Real Synced)</div>
                    <div className="text-3xl font-black text-blue-400 mt-1 font-mono">
                      {student.totalSolved || 0}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
                    <div className="text-xs text-slate-400 font-medium font-mono">Highest Contest Rating</div>
                    <div className="text-3xl font-black text-indigo-400 mt-1 font-mono">
                      {student.contestRating || 0} <span className="text-xs text-slate-500 font-normal">/ max {student.maxRating || student.contestRating || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Difficulty Distribution */}
                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-400" /> Real Difficulty Breakdown
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span className="text-emerald-400">Easy ({student.difficultyDistribution?.easy || 0})</span>
                        <span>{student.totalSolved > 0 ? Math.round(((student.difficultyDistribution?.easy || 0)/student.totalSolved)*100) : 0}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-700 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                          style={{ width: `${student.totalSolved > 0 ? ((student.difficultyDistribution?.easy || 0)/student.totalSolved)*100 : 0}%` }} 
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span className="text-amber-400">Medium ({student.difficultyDistribution?.medium || 0})</span>
                        <span>{student.totalSolved > 0 ? Math.round(((student.difficultyDistribution?.medium || 0)/student.totalSolved)*100) : 0}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-700 overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                          style={{ width: `${student.totalSolved > 0 ? ((student.difficultyDistribution?.medium || 0)/student.totalSolved)*100 : 0}%` }} 
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span className="text-rose-400">Hard ({student.difficultyDistribution?.hard || 0})</span>
                        <span>{student.totalSolved > 0 ? Math.round(((student.difficultyDistribution?.hard || 0)/student.totalSolved)*100) : 0}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-700 overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                          style={{ width: `${student.totalSolved > 0 ? ((student.difficultyDistribution?.hard || 0)/student.totalSolved)*100 : 0}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Breakdown Grid */}
                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-indigo-400" /> Tracked Platform Breakdown (Verified Data)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['LeetCode', 'CodeChef', 'Codeforces'] as const).map((platform) => {
                      const verified = student.platformVerification?.[platform] !== false &&
                                       typeof student.platformBreakdown?.[platform] === 'number' &&
                                       student.platformBreakdown[platform] !== null &&
                                       !!(student.profileLinks?.[platform.toLowerCase() as keyof typeof student.profileLinks]?.trim());
                      const val = verified ? `${student.platformBreakdown[platform]} solved` : 'Not Verified';
                      return (
                        <div key={platform} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                            <span>{platformIcons[platform] || '💻'}</span> {platform}
                          </span>
                          <span className={`text-xs font-extrabold font-mono ${verified ? 'text-blue-400' : 'text-amber-400/80'}`}>
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* LEETCODE DETAILED TAB */}
            {activeTab === 'leetcode' && (
              <div className="space-y-4">
                {lcLink ? (
                  <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <div className="text-xs font-extrabold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                          <span>🟡 LeetCode Real Analytics</span>
                        </div>
                        <h3 className="text-lg font-black text-white mt-1">
                          Handle: {lcLink.startsWith('http') ? lcLink.split('/').filter(Boolean).pop() : lcLink}
                        </h3>
                      </div>
                      <a
                        href={lcLink.startsWith('http') ? lcLink : `https://leetcode.com/u/${lcLink}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-black font-bold text-xs flex items-center gap-1.5 transition-all w-fit"
                      >
                        <span>Open LeetCode Profile</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                        <div className="text-[11px] text-slate-400 font-medium">Total Solved</div>
                        <div className="text-2xl font-black text-white mt-1 font-mono">
                          {student.platformVerification?.LeetCode !== false && typeof student.platformBreakdown?.LeetCode === 'number' && student.platformBreakdown.LeetCode !== null && lcLink
                            ? student.platformBreakdown.LeetCode
                            : 'Not Verified'}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                        <div className="text-[11px] text-emerald-400 font-medium">Easy Solved</div>
                        <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{student.difficultyDistribution?.easy || 0}</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                        <div className="text-[11px] text-amber-400 font-medium">Medium Solved</div>
                        <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{student.difficultyDistribution?.medium || 0}</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                        <div className="text-[11px] text-rose-400 font-medium">Hard Solved</div>
                        <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{student.difficultyDistribution?.hard || 0}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80">
                        <div className="text-xs text-slate-400">Contest Rating</div>
                        <div className="text-xl font-bold text-indigo-400 mt-0.5 font-mono">
                          {student.contestRating ? student.contestRating : 'Not Available'}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80">
                        <div className="text-xs text-slate-400">Current Streak</div>
                        <div className="text-xl font-bold text-amber-400 mt-0.5 font-mono">
                          {student.streakDays ? `${student.streakDays} Days` : 'Not Available'}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80">
                        <div className="text-xs text-slate-400">Acceptance Rate</div>
                        <div className="text-xl font-bold text-slate-300 mt-0.5 font-mono">
                          Not Available
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 px-6 bg-slate-900/80 rounded-3xl border border-slate-800 space-y-2">
                    <XCircle className="w-10 h-10 text-slate-600 mx-auto" />
                    <h4 className="text-sm font-extrabold text-white">Profile Not Linked</h4>
                    <p className="text-xs text-slate-400">LeetCode URL has not been submitted for this student.</p>
                  </div>
                )}
              </div>
            )}

            {/* CODECHEF DETAILED TAB */}
            {activeTab === 'codechef' && (
              <div className="space-y-4">
                {ccLink ? (
                  <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-600/30 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <div className="text-xs font-extrabold text-amber-500 uppercase tracking-wide flex items-center gap-1.5">
                          <span>🟤 CodeChef Real Analytics</span>
                        </div>
                        <h3 className="text-lg font-black text-white mt-1">
                          Handle: {ccLink.startsWith('http') ? ccLink.split('/').filter(Boolean).pop() : ccLink}
                        </h3>
                      </div>
                      <a
                        href={ccLink.startsWith('http') ? ccLink : `https://www.codechef.com/users/${ccLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-600/30 hover:bg-amber-600 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all w-fit"
                      >
                        <span>Open CodeChef Profile</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                        <div className="text-[11px] text-slate-400 font-medium">Problems Solved</div>
                        <div className="text-2xl font-black text-white mt-1 font-mono">
                          {student.platformVerification?.CodeChef !== false && typeof student.platformBreakdown?.CodeChef === 'number' && student.platformBreakdown.CodeChef !== null && ccLink
                            ? student.platformBreakdown.CodeChef
                            : 'Not Verified'}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                        <div className="text-[11px] text-amber-400 font-medium">Current Rating</div>
                        <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{student.contestRating || 'Not Available'}</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                        <div className="text-[11px] text-indigo-400 font-medium">Highest Rating</div>
                        <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">{student.maxRating || student.contestRating || 'Not Available'}</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                        <div className="text-[11px] text-slate-400 font-medium">Stars Rating</div>
                        <div className="text-2xl font-black text-amber-300 mt-1 font-mono">
                          {student.contestRating >= 2200 ? '6★' : student.contestRating >= 2000 ? '5★' : student.contestRating >= 1800 ? '4★' : student.contestRating >= 1600 ? '3★' : student.contestRating >= 1400 ? '2★' : '1★'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 px-6 bg-slate-900/80 rounded-3xl border border-slate-800 space-y-2">
                    <XCircle className="w-10 h-10 text-slate-600 mx-auto" />
                    <h4 className="text-sm font-extrabold text-white">Profile Not Linked</h4>
                    <p className="text-xs text-slate-400">CodeChef URL has not been submitted for this student.</p>
                  </div>
                )}
              </div>
            )}

            {/* CODEFORCES DETAILED TAB */}
            {activeTab === 'codeforces' && (
              <div className="space-y-4">
                {cfLink ? (
                  <div className="p-6 rounded-3xl bg-slate-900/90 border border-red-500/30 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <div className="text-xs font-extrabold text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                          <span>🔴 Codeforces Real Analytics</span>
                        </div>
                        <h3 className="text-lg font-black text-white mt-1">
                          Handle: {cfLink.startsWith('http') ? cfLink.split('/').filter(Boolean).pop() : cfLink}
                        </h3>
                      </div>
                      <a
                        href={cfLink.startsWith('http') ? cfLink : `https://codeforces.com/profile/${cfLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all w-fit"
                      >
                        <span>Open Codeforces Profile</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                        <div className="text-[11px] text-slate-400 font-medium">Problems Solved</div>
                        <div className="text-2xl font-black text-white mt-1 font-mono">
                          {student.platformVerification?.Codeforces !== false && typeof student.platformBreakdown?.Codeforces === 'number' && student.platformBreakdown.Codeforces !== null && cfLink
                            ? student.platformBreakdown.Codeforces
                            : 'Not Verified'}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                        <div className="text-[11px] text-red-400 font-medium">Current Rating</div>
                        <div className="text-2xl font-black text-red-400 mt-1 font-mono">{student.contestRating || 'Not Available'}</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                        <div className="text-[11px] text-indigo-400 font-medium">Max Rating</div>
                        <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">{student.maxRating || student.contestRating || 'Not Available'}</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                        <div className="text-[11px] text-slate-400 font-medium">Rank Title</div>
                        <div className="text-sm font-extrabold text-amber-300 mt-2 font-mono">
                          {student.contestRating >= 2400 ? 'Grandmaster' : student.contestRating >= 1900 ? 'Candidate Master' : student.contestRating >= 1600 ? 'Expert' : student.contestRating >= 1400 ? 'Specialist' : student.contestRating >= 1200 ? 'Pupil' : 'Newbie'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 px-6 bg-slate-900/80 rounded-3xl border border-slate-800 space-y-2">
                    <XCircle className="w-10 h-10 text-slate-600 mx-auto" />
                    <h4 className="text-sm font-extrabold text-white">Profile Not Linked</h4>
                    <p className="text-xs text-slate-400">Codeforces URL has not been submitted for this student.</p>
                  </div>
                )}
              </div>
            )}

            {/* SUBMISSIONS TAB */}
            {activeTab === 'submissions' && (
              <div className="space-y-3">
                {student.recentSubmissions && student.recentSubmissions.length > 0 ? (
                  student.recentSubmissions.map((sub, i) => (
                    <div key={sub.id ? `${sub.id}-${i}` : `sub-${i}`} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                            {sub.platform}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            sub.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            sub.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {sub.difficulty}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                            sub.status === 'Accepted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            {sub.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white mt-1.5">{sub.problemTitle}</h4>
                        <div className="text-xs text-slate-400 mt-1 font-mono">
                          Submitted {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 px-6 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                    <Code2 className="w-8 h-8 text-slate-500 mx-auto" />
                    <div className="text-sm font-extrabold text-white">No live submissions detected yet.</div>
                    <p className="text-xs text-slate-400">Click "Sync Live Data" above to fetch recent problem submissions.</p>
                  </div>
                )}
              </div>
            )}

            {/* CONTESTS TAB */}
            {activeTab === 'contests' && (
              <div className="space-y-3">
                {student.contestHistory && student.contestHistory.length > 0 ? (
                  student.contestHistory.map((c, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-indigo-400 mb-0.5 font-mono">{c.platform} • {c.date}</div>
                        <h4 className="text-sm font-bold text-white">{c.contestName}</h4>
                        <div className="text-xs text-slate-400 mt-1 font-mono">Rank: <span className="text-white font-bold">#{c.rank}</span></div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm font-black font-mono ${c.ratingChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {c.ratingChange >= 0 ? `+${c.ratingChange}` : c.ratingChange} Rating
                        </div>
                        <div className="text-xs text-slate-400 font-mono">New Rating: {c.newRating}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 px-6 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-2">
                    <Trophy className="w-8 h-8 text-slate-500 mx-auto" />
                    <div className="text-sm font-extrabold text-white">No contest records synced yet.</div>
                    <p className="text-xs text-slate-400">Click "Sync Live Data" to update contest performance.</p>
                  </div>
                )}
              </div>
            )}

            {/* LINKS FORM TAB */}
            {activeTab === 'links' && (
              <form onSubmit={handleSaveLinks} className="space-y-4">
                {saveSuccess && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{saveSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['leetcode', 'codechef', 'codeforces', 'atcoder', 'codolio', 'hackerrank', 'github', 'geeksforgeeks'] as const).map((plat) => {
                    const rawVal = linksForm[plat] || '';
                    const url = getPlatformUrl(plat, rawVal);

                    return (
                      <div key={plat} className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                            <span>{platformIcons[plat] || '💻'}</span>
                            <span>{plat}</span>
                          </label>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <span>Open Profile</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-medium">Profile Not Linked</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={linksForm[plat] || ''}
                          onChange={(e) => setLinksForm({ ...linksForm, [plat]: e.target.value })}
                          placeholder={`Paste ${plat} profile link or handle`}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingLinks}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg hover:from-blue-500 hover:to-indigo-500 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingLinks ? 'Saving Links...' : 'Save Profile Links'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
