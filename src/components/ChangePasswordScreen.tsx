import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Key, CheckCircle2, ShieldAlert, Eye, EyeOff, ShieldCheck, UserCheck, Check, Sparkles, Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserSession } from '../types';

interface ChangePasswordScreenProps {
  session: UserSession;
  onPasswordChanged: (updatedSession: UserSession) => void;
  onLogout: () => void;
}

export default function ChangePasswordScreen({ session, onPasswordChanged, onLogout }: ChangePasswordScreenProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const student = session.studentDetails;
  const registerNo = session.username || student?.registerNumber || '';

  // Rule Validations
  const isMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isMatching = newPassword !== '' && newPassword === confirmPassword;
  const isDifferentFromDefault = newPassword !== 'KIT@2026';

  // Strength Meter Calculation
  const calculateStrength = () => {
    if (!newPassword) return { score: 0, label: 'None', color: 'bg-slate-700', text: 'text-slate-500' };
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 12) score += 1;
    if (hasUpper) score += 1;
    if (hasLower) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;

    if (score <= 2) return { score: 25, label: 'Weak', color: 'bg-red-500', text: 'text-red-400' };
    if (score <= 4) return { score: 50, label: 'Medium', color: 'bg-amber-500', text: 'text-amber-400' };
    if (score <= 5) return { score: 75, label: 'Strong', color: 'bg-blue-500', text: 'text-blue-400' };
    return { score: 100, label: 'Very Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const strength = calculateStrength();
  const isValid = isMinLength && hasUpper && hasLower && hasNumber && hasSpecial && isMatching && isDifferentFromDefault && currentPassword !== '';

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

    console.log('[AUTH] Password update started');

    if (!currentPassword) {
      console.error('[AUTH] Database update failed: Current password missing');
      setError("Please enter your current password.");
      return;
    }

    if (!newPassword) {
      console.error('[AUTH] Database update failed: New password missing');
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 8) {
      console.error('[AUTH] Database update failed: Password too short');
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      console.error('[AUTH] Database update failed: Password complexity requirements not met');
      setError("New password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (!@#$).");
      return;
    }

    if (newPassword === 'KIT@2026') {
      console.error('[AUTH] Database update failed: Cannot use default password');
      setError("New password cannot be the default password (KIT@2026). Please choose a new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      console.error('[AUTH] Database update failed: Passwords do not match');
      setError("New password and confirm password do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerNo.trim(),
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[AUTH] Database update failed:', data.error || 'Password update failed');
        setError(data.error || "Failed to update password. Please verify current password.");
        setIsLoading(false);
        return;
      }

      console.log('[AUTH] Password updated successfully');

      // Success Sequence
      setIsSuccess(true);
      triggerConfettiEffect();

      setTimeout(() => {
        console.log('[AUTH] Navigation to Student Dashboard');
        onPasswordChanged(data.user);
      }, 2000);
    } catch (err) {
      console.error('[AUTH] Database update failed:', err);
      setError("Network connection error. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 text-white font-sans overflow-hidden select-none">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-lg"
      >
        {/* Glassmorphism Outer Card */}
        <div className="bg-slate-900/85 backdrop-blur-2xl border border-white/15 rounded-[32px] p-6 sm:p-9 shadow-2xl relative overflow-hidden space-y-6">
          
          {/* Top Glowing Bar */}
          <div className="absolute top-0 left-8 right-8 h-1 rounded-b-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 shadow-md shadow-cyan-500/50" />

          {/* HEADER SECTION */}
          <div className="text-center space-y-2">
            <motion.div
              animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30 border border-white/20"
            >
              <ShieldCheck className="w-8 h-8 text-cyan-300" />
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              Welcome to SC SMART POLL AI
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto font-medium">
              For your account security, please create your own password before accessing your Student Dashboard.
            </p>
          </div>

          {/* STUDENT INFO BADGE */}
          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-3.5 flex items-center space-x-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 text-cyan-400 flex items-center justify-center font-bold text-sm shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate">
                {student?.studentName || session.name || session.username}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                <span className="text-cyan-400 font-mono font-bold">Register: {registerNo}</span>
                {student && (
                  <span>• {student.department} ({student.year}-{student.section})</span>
                )}
              </div>
            </div>
          </div>

          {/* SUCCESS VIEW */}
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 text-center space-y-4"
            >
              <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-extrabold text-white font-display">
                Password updated successfully.
              </h3>
              <p className="text-sm text-slate-300 font-medium">
                Redirecting to your Student Dashboard...
              </p>
              <div className="flex justify-center pt-2">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-400"></div>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              
              {/* ERROR TOAST */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-950/90 border border-red-500/60 p-3.5 rounded-2xl flex items-start space-x-3 shadow-lg"
                  >
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-red-200">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CURRENT PASSWORD */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Key className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter Current Password"
                    className="w-full pl-10 pr-11 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* NEW PASSWORD */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter New Password"
                    className="w-full pl-10 pr-11 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* STRENGTH METER */}
                {newPassword && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-400">Password Strength:</span>
                      <span className={strength.text}>{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`} 
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="w-full pl-10 pr-11 py-3 bg-slate-950/80 border border-white/10 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* LIVE VALIDATION RULES GRID */}
              <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block mb-1">
                  Password Requirements:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className={`flex items-center space-x-2 font-medium ${isMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${isMinLength ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Minimum 8 characters</span>
                  </div>
                  <div className={`flex items-center space-x-2 font-medium ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>1 Uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center space-x-2 font-medium ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasLower ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>1 Lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center space-x-2 font-medium ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>1 Number (0-9)</span>
                  </div>
                  <div className={`flex items-center space-x-2 font-medium ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${hasSpecial ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>1 Special Character (!@#$)</span>
                  </div>
                  <div className={`flex items-center space-x-2 font-medium ${isMatching ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <Check className={`w-3.5 h-3.5 ${isMatching ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: isLoading ? 1 : 1.02, y: isLoading ? 0 : -1 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm text-white shadow-xl transition-all flex items-center justify-center space-x-2 border ${
                    isLoading
                      ? 'bg-slate-800 border-white/10 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 border-blue-400/40 shadow-blue-500/30 cursor-pointer active:scale-98'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Saving New Password...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-cyan-300" />
                      <span>Update Password & Continue</span>
                    </span>
                  )}
                </motion.button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs text-slate-400 hover:text-white transition-colors underline cursor-pointer"
                >
                  Return to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
