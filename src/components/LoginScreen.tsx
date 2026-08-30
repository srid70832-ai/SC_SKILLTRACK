import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogIn, Key, User, ShieldAlert, WifiOff, GraduationCap, ShieldCheck, 
  Eye, EyeOff, Cpu, Zap, Lock, ArrowRight, Check, HelpCircle, X, Send, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserSession } from '../types';
import SmartPollLogo from './SmartPollLogo';

interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  // Page Loading State
  const [isInitializing, setIsInitializing] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  const [initMessageIndex, setInitMessageIndex] = useState(0);

  // Form State
  const [loginType, setLoginType] = useState<'student' | 'staff'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Focus States
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Submission State
  const [isLoading, setIsLoading] = useState(false);
  const [loginState, setLoginState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [shakeError, setShakeError] = useState(false);

  // Self-Service Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'verify' | 'reset' | 'done'>('verify');
  const [forgotRegisterNo, setForgotRegisterNo] = useState('');
  const [verifiedStudent, setVerifiedStudent] = useState<{ registerNumber: string; studentName: string; department: string; year: number; section: string } | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Staff Forgot Password Modal State
  const [showStaffForgotModal, setShowStaffForgotModal] = useState(false);
  const [staffForgotStep, setStaffForgotStep] = useState<'verify' | 'reset' | 'done'>('verify');
  const [staffForgotIdentifier, setStaffForgotIdentifier] = useState('');
  const [verifiedStaff, setVerifiedStaff] = useState<{ username: string; name: string; token: string; emailConfigured: boolean } | null>(null);
  const [staffResetNewPassword, setStaffResetNewPassword] = useState('');
  const [staffResetConfirmPassword, setStaffResetConfirmPassword] = useState('');
  const [showStaffResetNewPassword, setShowStaffResetNewPassword] = useState(false);
  const [showStaffResetConfirmPassword, setShowStaffResetConfirmPassword] = useState(false);
  const [staffForgotLoading, setStaffForgotLoading] = useState(false);
  const [staffForgotMessage, setStaffForgotMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const initMessages = [
    'Preparing AI Workspace...',
    'Loading AI Engine...',
    'Connecting Secure Server...',
    'Initializing Smart Poll...',
    'Almost Ready...'
  ];

  // Initializing Loader Effect
  useEffect(() => {
    const hasLoaded = sessionStorage.getItem('ai_workspace_loaded');
    if (hasLoaded) {
      setIsInitializing(false);
      return;
    }

    const interval = setInterval(() => {
      setInitProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsInitializing(false);
            sessionStorage.setItem('ai_workspace_loaded', 'true');
          }, 300);
          return 100;
        }
        const next = prev + 12;
        if (next > 20 && next <= 40) setInitMessageIndex(1);
        else if (next > 40 && next <= 65) setInitMessageIndex(2);
        else if (next > 65 && next <= 85) setInitMessageIndex(3);
        else if (next > 85) setInitMessageIndex(4);
        return next;
      });
    }, 180);

    return () => clearInterval(interval);
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 200);
    } catch (e) {
      console.log('Confetti effect fallback');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShakeError(false);

    if (loginType === 'staff') {
      if (!username.trim() && !password.trim()) {
        setError("Please enter staff username and password.");
        triggerErrorShake();
        return;
      }
      if (!username.trim()) {
        setError("Please enter staff username.");
        triggerErrorShake();
        return;
      }
      if (!password.trim()) {
        setError("Please enter staff password.");
        triggerErrorShake();
        return;
      }
    } else {
      if (!username.trim() && !password.trim()) {
        setError("Please enter Register Number and password.");
        triggerErrorShake();
        return;
      }
      if (!username.trim()) {
        setError("Please enter Register Number.");
        triggerErrorShake();
        return;
      }
      if (!password.trim()) {
        setError("Please enter password.");
        triggerErrorShake();
        return;
      }
    }

    setIsLoading(true);
    setLoginState('submitting');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          portalType: loginType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        setLoginState('idle');
        setIsLoading(false);
        triggerErrorShake();
        return;
      }

      // Success Sequence
      setLoginState('success');
      triggerConfetti();

      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1200);

    } catch (err) {
      console.error(err);
      setError("Unable to connect to authentication server. Please try again.");
      setLoginState('idle');
      setIsLoading(false);
      triggerErrorShake();
    }
  };

  const resetStaffForgotModal = () => {
    setStaffForgotStep('verify');
    setStaffForgotIdentifier('');
    setVerifiedStaff(null);
    setStaffResetNewPassword('');
    setStaffResetConfirmPassword('');
    setStaffForgotMessage(null);
    setShowStaffForgotModal(false);
  };

  const handleVerifyStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffForgotMessage(null);

    if (!staffForgotIdentifier.trim()) {
      setStaffForgotMessage({ type: 'error', text: 'Please enter Staff Username or registered Staff Email.' });
      return;
    }

    setStaffForgotLoading(true);

    try {
      const res = await fetch('/api/auth/verify-staff-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: staffForgotIdentifier.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setStaffForgotMessage({ type: 'error', text: data.error || 'Staff account not found.' });
      } else {
        setVerifiedStaff({
          username: data.username,
          name: data.name,
          token: data.token,
          emailConfigured: data.emailConfigured
        });
        setStaffForgotStep('reset');
        setStaffForgotMessage({
          type: 'info',
          text: 'Password recovery service is not configured yet. Administrator-controlled password reset option enabled.'
        });
      }
    } catch (err) {
      setStaffForgotMessage({ type: 'error', text: 'Server error. Please try again later.' });
    } finally {
      setStaffForgotLoading(false);
    }
  };

  const handleStaffResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffForgotMessage(null);

    if (!verifiedStaff) return;

    if (staffResetNewPassword.length < 8) {
      setStaffForgotMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    const hasUpper = /[A-Z]/.test(staffResetNewPassword);
    const hasLower = /[a-z]/.test(staffResetNewPassword);
    const hasNumber = /[0-9]/.test(staffResetNewPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(staffResetNewPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setStaffForgotMessage({ 
        type: 'error', 
        text: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.' 
      });
      return;
    }

    if (staffResetNewPassword !== staffResetConfirmPassword) {
      setStaffForgotMessage({ type: 'error', text: 'Passwords do not match. Please verify both password fields.' });
      return;
    }

    setStaffForgotLoading(true);

    try {
      const res = await fetch('/api/auth/staff-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: verifiedStaff.username,
          token: verifiedStaff.token,
          newPassword: staffResetNewPassword.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setStaffForgotMessage({ type: 'error', text: data.error || 'Failed to reset staff password.' });
      } else {
        setStaffForgotStep('done');
        setStaffForgotMessage({ type: 'success', text: data.message });
        setUsername(verifiedStaff.username);
        setPassword('');
        triggerConfetti();
      }
    } catch (err) {
      setStaffForgotMessage({ type: 'error', text: 'Server error. Please try again later.' });
    } finally {
      setStaffForgotLoading(false);
    }
  };

  const resetForgotModal = () => {
    setForgotStep('verify');
    setForgotRegisterNo('');
    setVerifiedStudent(null);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setForgotMessage(null);
    setShowForgotModal(false);
  };

  const handleVerifyStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);

    if (!forgotRegisterNo.trim()) {
      setForgotMessage({ type: 'error', text: 'Please enter your Register Number or Roll Number.' });
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/verify-student-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: forgotRegisterNo.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setForgotMessage({ type: 'error', text: data.error || 'Student account not found.' });
      } else {
        setVerifiedStudent({
          registerNumber: data.registerNumber,
          studentName: data.studentName,
          department: data.department,
          year: data.year,
          section: data.section
        });
        setForgotStep('reset');
        setForgotMessage(null);
      }
    } catch (err) {
      setForgotMessage({ type: 'error', text: 'Server error. Please try again later.' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSelfResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage(null);

    if (!verifiedStudent) return;

    if (resetNewPassword.length < 8) {
      setForgotMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setForgotMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setForgotLoading(true);

    try {
      const res = await fetch('/api/auth/self-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: verifiedStudent.registerNumber,
          newPassword: resetNewPassword.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setForgotMessage({ type: 'error', text: data.error || 'Failed to reset password.' });
      } else {
        setForgotStep('done');
        setForgotMessage({ type: 'success', text: data.message });
        setUsername(verifiedStudent.registerNumber);
        setPassword('');
        triggerConfetti();
      }
    } catch (err) {
      setForgotMessage({ type: 'error', text: 'Server error. Please try again later.' });
    } finally {
      setForgotLoading(false);
    }
  };

  const triggerErrorShake = () => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 600);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center py-8 sm:py-12 px-3 sm:px-6 lg:px-8 bg-slate-950 overflow-hidden font-sans select-none">
      
      {/* ------------------------------------------------------------------ */}
      {/* INITIAL WORKSPACE LOADING OVERLAY */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {isInitializing && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white px-4"
          >
            {/* Glowing Background Radial */}
            <div className="absolute w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            
            <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6">
              {/* Animated Logo Container */}
              <motion.div
                animate={{ 
                  scale: [1, 1.08, 1],
                  rotate: [0, -3, 3, 0]
                }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="relative p-6 rounded-3xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 shadow-2xl shadow-blue-500/30 border border-white/20"
              >
                <div className="absolute inset-0 rounded-3xl bg-blue-400 blur-xl opacity-40 animate-pulse" />
                <SmartPollLogo size="lg" />
              </motion.div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold tracking-tight text-white font-display">
                  SC SkillTrack AI
                </h3>
                <motion.p 
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-xs font-bold tracking-widest text-cyan-300"
                >
                  Track Every Coding Achievement.
                </motion.p>
              </div>

              {/* Progress Bar & Status Text */}
              <div className="w-full space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                  <span className="flex items-center gap-1.5 text-blue-300">
                    <Cpu className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    {initMessages[initMessageIndex]}
                  </span>
                  <span className="font-mono text-blue-400">{initProgress}%</span>
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 rounded-full shadow-lg shadow-blue-500/50"
                    style={{ width: `${initProgress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Skip Button */}
              <button
                onClick={() => {
                  setIsInitializing(false);
                  sessionStorage.setItem('ai_workspace_loaded', 'true');
                }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline pt-2 cursor-pointer"
              >
                Skip preview animation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* FUTURISTIC ANIMATED BACKGROUND LAYER */}
      {/* ------------------------------------------------------------------ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating Gradient Orbs */}
        <motion.div 
          animate={{
            x: [0, 40, -40, 0],
            y: [0, -50, 50, 0],
            scale: [1, 1.1, 0.95, 1]
          }}
          transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 sm:w-[550px] h-96 sm:h-[550px] bg-blue-600/25 rounded-full blur-[130px]"
        />

        <motion.div 
          animate={{
            x: [0, -50, 50, 0],
            y: [0, 40, -40, 0],
            scale: [1, 0.9, 1.1, 1]
          }}
          transition={{ repeat: Infinity, duration: 22, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-32 -right-32 w-96 sm:w-[550px] h-96 sm:h-[550px] bg-indigo-600/25 rounded-full blur-[130px]"
        />

        <motion.div 
          animate={{
            opacity: [0.15, 0.35, 0.15]
          }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[160px]"
        />

        {/* Neural Network SVG Grid Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.5" />
              <circle cx="40" cy="40" r="1.5" fill="rgba(96, 165, 250, 0.4)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Floating Glowing Particle Dots */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              repeat: Infinity,
              duration: 6 + (i % 5) * 2,
              delay: i * 0.5,
              ease: 'easeInOut'
            }}
            className="absolute rounded-full bg-cyan-400 blur-[1px]"
            style={{
              width: `${(i % 3) + 3}px`,
              height: `${(i % 3) + 3}px`,
              top: `${(i * 8 + 10) % 90}%`,
              left: `${(i * 13 + 5) % 95}%`
            }}
          />
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN AUTHENTICATION CONTAINER */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative z-10 w-full max-w-md mx-auto space-y-6">
        
        {/* HEADER BRANDING */}
        <motion.div 
          initial={{ opacity: 0, y: -25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center flex flex-col items-center space-y-3"
        >
          {/* Logo with Gentle Pulse & Floating Animation */}
          <motion.div 
            animate={{ 
              y: [0, -6, 0],
              rotate: [-1.5, 1.5, -1.5]
            }}
            transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
            whileHover={{ scale: 1.06 }}
            className="relative cursor-pointer group"
          >
            {/* Glowing Blue Light Ripple Background */}
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-80 transition duration-500 animate-pulse" />
            <SmartPollLogo size="lg" />
          </motion.div>

          {/* Title with Fade & Scale Animation */}
          <div className="space-y-1 text-center">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display flex items-center justify-center gap-2 drop-shadow-md"
            >
              SC SkillTrack AI
            </motion.h1>

            {/* Subtitle with Gradient Shimmer Animation */}
            <motion.p 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400 inline animate-pulse" /> 
              <motion.span
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] 
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                Track Every Coding Achievement.
              </motion.span>
            </motion.p>
          </div>
        </motion.div>

        {/* ------------------------------------------------------------------ */}
        {/* LOGIN GLASSMORPHISM CARD */}
        {/* ------------------------------------------------------------------ */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={shakeError ? {
            x: [0, -14, 14, -10, 10, -5, 5, 0],
            transition: { duration: 0.5 }
          } : {
            opacity: 1, 
            scale: 1, 
            y: 0,
            transition: { duration: 0.6, delay: 0.2, ease: 'easeOut' }
          }}
          className={`relative rounded-[32px] p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 ${
            shakeError 
              ? 'bg-red-950/80 border-2 border-red-500/80 shadow-2xl shadow-red-500/20' 
              : 'bg-slate-900/80 border border-white/15 shadow-2xl shadow-blue-950/50 hover:border-white/25'
          }`}
        >
          {/* Top Gradient Glowing Bar */}
          <div className="absolute top-0 left-8 right-8 h-1 rounded-b-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 shadow-md shadow-cyan-500/50" />

          {/* PORTAL SWITCHER TABS */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/70 rounded-2xl mb-6 border border-white/10 relative">
            <button
              type="button"
              onClick={() => {
                setLoginType('student');
                setError(null);
              }}
              className={`relative z-10 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                loginType === 'student' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${loginType === 'student' ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>Student Portal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginType('staff');
                setError(null);
              }}
              className={`relative z-10 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                loginType === 'staff' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${loginType === 'staff' ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>Staff Login</span>
            </button>

            {/* Sliding Tab Highlight Pill */}
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              className={`absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r ${
                loginType === 'student'
                  ? 'left-1.5 right-[50%] from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30'
                  : 'left-[50%] right-1.5 from-indigo-600 to-blue-700 shadow-lg shadow-indigo-500/30'
              }`}
            />
          </div>

          {/* LOGIN FORM */}
          <form className="space-y-5" onSubmit={handleLogin}>
            
            {/* ERROR ALERT TOAST */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="bg-red-950/90 border border-red-500/60 p-3.5 rounded-2xl flex items-start space-x-3 text-left shadow-lg shadow-red-950/50 backdrop-blur-md"
                >
                  {error.includes("Unable") ? (
                    <WifiOff className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className="text-[11px] font-bold text-red-300 block uppercase tracking-wider">Authentication Error</span>
                    <p className="text-xs font-medium text-red-200">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* USERNAME FIELD */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>{loginType === 'student' ? 'Student Register Number' : 'Staff Username'}</span>
                {usernameFocused && (
                  <span className="text-[10px] text-cyan-400 font-normal animate-pulse">Required</span>
                )}
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors">
                  {loginType === 'student' ? (
                    <GraduationCap className={`h-5 w-5 transition-colors ${usernameFocused ? 'text-cyan-400' : 'text-slate-500'}`} />
                  ) : (
                    <User className={`h-5 w-5 transition-colors ${usernameFocused ? 'text-cyan-400' : 'text-slate-500'}`} />
                  )}
                </div>

                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3 bg-slate-950/70 border rounded-2xl text-sm font-semibold text-white placeholder-slate-500 transition-all outline-none ${
                    usernameFocused
                      ? 'border-cyan-400 ring-4 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  placeholder={loginType === 'student' ? "Enter Register Number (e.g. 711525BAD004)" : "Enter Staff Username"}
                  required
                />
              </div>
            </div>

            {/* PASSWORD FIELD */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                {loginType === 'student' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(true);
                      setForgotMessage(null);
                    }}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    Forgot Password?
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowStaffForgotModal(true);
                      setStaffForgotMessage(null);
                    }}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    Forgot Password?
                  </button>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Key className={`h-5 w-5 transition-colors ${passwordFocused ? 'text-cyan-400' : 'text-slate-500'}`} />
                </div>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-11 pr-11 py-3 bg-slate-950/70 border rounded-2xl text-sm font-semibold text-white placeholder-slate-500 transition-all outline-none ${
                    passwordFocused
                      ? 'border-cyan-400 ring-4 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  placeholder={loginType === 'student' ? "Enter Account Password" : "Enter Staff Password"}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || loginState === 'success'}
                className={`relative w-full overflow-hidden py-3.5 px-4 rounded-2xl text-sm font-extrabold text-white shadow-xl transition-all cursor-pointer border ${
                  loginState === 'success'
                    ? 'bg-emerald-600 border-emerald-400 shadow-emerald-500/30'
                    : loginType === 'student'
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 border-blue-400/40 shadow-blue-600/30'
                    : 'bg-gradient-to-r from-indigo-600 via-slate-800 to-indigo-700 hover:from-indigo-500 hover:to-slate-700 border-indigo-400/40 shadow-indigo-600/30'
                }`}
              >
                {/* Button Light Sheen Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                {loginState === 'submitting' ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing in...</span>
                  </span>
                ) : loginState === 'success' ? (
                  <span className="flex items-center justify-center space-x-2 text-white">
                    <Check className="w-5 h-5 animate-bounce" />
                    <span>Welcome! Redirecting...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <LogIn className="h-4 w-4 text-cyan-300" />
                    <span>{loginType === 'student' ? 'Access Student Portal' : 'Login as Staff Coordinator'}</span>
                    <ArrowRight className="h-4 w-4 ml-1 opacity-80" />
                  </span>
                )}
              </motion.button>
            </div>
          </form>

          {/* FOOTER BADGE */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-cyan-400" /> 256-Bit SSL Encrypted
            </span>
            <span className="font-mono text-slate-500">v2.4 Enterprise</span>
          </div>
        </motion.div>

        {/* BOTTOM ATTRIBUTION */}
        <p className="text-center text-xs text-slate-500 font-medium">
          SC SMART POLL AI • Academic Evaluation & Management System
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SELF-SERVICE FORGOT PASSWORD MODAL */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5 my-8"
            >
              <button
                onClick={resetForgotModal}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Student Self-Service Password Reset</h3>
                  <p className="text-xs text-cyan-400 font-medium">Instant Reset • No Staff Approval Needed</p>
                </div>
              </div>

              {/* STEP 1: VERIFY ACCOUNT */}
              {forgotStep === 'verify' && (
                <form onSubmit={handleVerifyStudent} className="space-y-4 pt-1">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Forgot your password? Enter your Register Number or Roll Number below to verify your account and create a new password directly.
                  </p>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Student Register / Roll Number
                    </label>
                    <input
                      type="text"
                      value={forgotRegisterNo}
                      onChange={(e) => setForgotRegisterNo(e.target.value)}
                      placeholder="e.g. 711525BAD004"
                      className="w-full px-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                      required
                    />
                  </div>

                  {forgotMessage && (
                    <div
                      className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
                        forgotMessage.type === 'success'
                          ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                          : 'bg-red-950/80 border border-red-500/40 text-red-200'
                      }`}
                    >
                      {forgotMessage.type === 'success' ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <span>{forgotMessage.text}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetForgotModal}
                      className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      {forgotLoading ? (
                        <span>Verifying...</span>
                      ) : (
                        <>
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Verify Account</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: SET NEW PASSWORD */}
              {forgotStep === 'reset' && verifiedStudent && (
                <form onSubmit={handleSelfResetPasswordSubmit} className="space-y-4 pt-1">
                  {/* Verified Student Details Card */}
                  <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-1">
                    <div className="flex justify-between items-center text-cyan-300 font-bold">
                      <span>Verified Student Account</span>
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-[10px]">Verified</span>
                    </div>
                    <div className="text-white font-extrabold text-sm">{verifiedStudent.studentName}</div>
                    <div className="text-slate-400 text-[11px] font-mono">
                      Reg: {verifiedStudent.registerNumber} • Dept: {verifiedStudent.department} (Yr {verifiedStudent.year})
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showResetNewPassword ? 'text' : 'password'}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Enter new strong password"
                        className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-cyan-400 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showResetConfirmPassword ? 'text' : 'password'}
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-cyan-400 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Checklist */}
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 text-[11px] space-y-1.5">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Password Requirements:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className={`flex items-center gap-1.5 ${resetNewPassword.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" /> 8+ Characters
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(resetNewPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" /> Uppercase (A-Z)
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[a-z]/.test(resetNewPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" /> Lowercase (a-z)
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[0-9]/.test(resetNewPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" /> Number (0-9)
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[^A-Za-z0-9]/.test(resetNewPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" /> Special Char (!@#)
                      </div>
                      <div className={`flex items-center gap-1.5 ${resetNewPassword !== '' && resetNewPassword === resetConfirmPassword ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" /> Passwords Match
                      </div>
                    </div>
                  </div>

                  {forgotMessage && (
                    <div
                      className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
                        forgotMessage.type === 'success'
                          ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                          : 'bg-red-950/80 border border-red-500/40 text-red-200'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{forgotMessage.text}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('verify');
                        setForgotMessage(null);
                      }}
                      className="py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      {forgotLoading ? (
                        <span>Updating...</span>
                      ) : (
                        <>
                          <Key className="w-3.5 h-3.5" />
                          <span>Change Password Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: DONE */}
              {forgotStep === 'done' && (
                <div className="space-y-4 pt-1 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-white">Password Changed Successfully!</h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                      Your password has been updated and your account is ready. You can now log in immediately.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 text-xs font-mono text-cyan-300">
                    Register No: {verifiedStudent?.registerNumber || forgotRegisterNo}
                  </div>

                  <button
                    type="button"
                    onClick={resetForgotModal}
                    className="w-full py-3.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Proceed to Login</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STAFF FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {showStaffForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5 my-8"
            >
              <button
                onClick={resetStaffForgotModal}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Staff Password Recovery</h3>
                  <p className="text-xs text-indigo-400 font-medium">Enterprise Security • Staff Coordinator Portal</p>
                </div>
              </div>

              {/* STEP 1: VERIFY STAFF USERNAME / EMAIL */}
              {staffForgotStep === 'verify' && (
                <form onSubmit={handleVerifyStaff} className="space-y-4 pt-1">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Enter your Staff Username or registered Staff Email address to initiate secure password recovery.
                  </p>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Staff Username / Email
                    </label>
                    <input
                      type="text"
                      value={staffForgotIdentifier}
                      onChange={(e) => setStaffForgotIdentifier(e.target.value)}
                      placeholder="Enter Staff Username (e.g. Gowtham)"
                      className="w-full px-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                      required
                    />
                  </div>

                  {staffForgotMessage && (
                    <div
                      className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
                        staffForgotMessage.type === 'success'
                          ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                          : staffForgotMessage.type === 'info'
                          ? 'bg-indigo-950/80 border border-indigo-500/40 text-indigo-200'
                          : 'bg-red-950/80 border border-red-500/40 text-red-200'
                      }`}
                    >
                      {staffForgotMessage.type === 'success' ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <span>{staffForgotMessage.text}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetStaffForgotModal}
                      className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Back to Login
                    </button>
                    <button
                      type="submit"
                      disabled={staffForgotLoading}
                      className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      {staffForgotLoading ? (
                        <span>Searching...</span>
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: RESET PASSWORD STATE */}
              {staffForgotStep === 'reset' && verifiedStaff && (
                <form onSubmit={handleStaffResetPasswordSubmit} className="space-y-4 pt-1">
                  {/* Verified Staff Badge & Info */}
                  <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-xs space-y-1">
                    <div className="flex justify-between items-center text-indigo-300 font-bold">
                      <span>Verified Staff Coordinator Account</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-[10px]">Staff Account</span>
                    </div>
                    <div className="text-white font-extrabold text-sm">{verifiedStaff.name} ({verifiedStaff.username})</div>
                    
                    <div className="pt-1.5 text-amber-300 text-[11px] bg-amber-950/40 border border-amber-500/20 p-2 rounded-xl flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>Password recovery service is not configured yet. Administrator-controlled password reset option enabled.</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showStaffResetNewPassword ? 'text' : 'password'}
                        value={staffResetNewPassword}
                        onChange={(e) => setStaffResetNewPassword(e.target.value)}
                        placeholder="Enter new strong staff password"
                        className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-indigo-400 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffResetNewPassword(!showStaffResetNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showStaffResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showStaffResetConfirmPassword ? 'text' : 'password'}
                        value={staffResetConfirmPassword}
                        onChange={(e) => setStaffResetConfirmPassword(e.target.value)}
                        placeholder="Re-enter new staff password"
                        className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/15 rounded-xl text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-indigo-400 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffResetConfirmPassword(!showStaffResetConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showStaffResetConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements Indicator */}
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 text-[11px] space-y-1.5">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Password Requirements:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className={`flex items-center gap-1.5 ${staffResetNewPassword.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" /> 8+ Characters
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[A-Z]/.test(staffResetNewPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" /> Uppercase (A-Z)
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[a-z]/.test(staffResetNewPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" /> Lowercase (a-z)
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[0-9]/.test(staffResetNewPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" /> Number (0-9)
                      </div>
                      <div className={`flex items-center gap-1.5 ${/[^A-Za-z0-9]/.test(staffResetNewPassword) ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" /> Special Char (!@#)
                      </div>
                      <div className={`flex items-center gap-1.5 ${staffResetNewPassword !== '' && staffResetNewPassword === staffResetConfirmPassword ? 'text-emerald-400' : 'text-slate-500'}`}>
                        <Check className="w-3 h-3" /> Passwords Match
                      </div>
                    </div>
                  </div>

                  {staffForgotMessage && (
                    <div
                      className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
                        staffForgotMessage.type === 'success'
                          ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                          : 'bg-red-950/80 border border-red-500/40 text-red-200'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{staffForgotMessage.text}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStaffForgotStep('verify');
                        setStaffForgotMessage(null);
                      }}
                      className="py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={staffForgotLoading}
                      className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      {staffForgotLoading ? (
                        <span>Updating...</span>
                      ) : (
                        <>
                          <Key className="w-3.5 h-3.5" />
                          <span>Reset Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: DONE */}
              {staffForgotStep === 'done' && (
                <div className="space-y-4 pt-1 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-extrabold text-white">Staff Password Reset Complete!</h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                      Your staff coordinator password has been updated successfully. You can now log in immediately.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 text-xs font-mono text-indigo-300">
                    Staff Username: {verifiedStaff?.username || staffForgotIdentifier}
                  </div>

                  <button
                    type="button"
                    onClick={resetStaffForgotModal}
                    className="w-full py-3.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Back to Login</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
