import React from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Sparkles, 
  Activity, 
  Cpu, 
  ArrowUp, 
  Lock, 
  Radio, 
  CheckCircle2, 
  Code2, 
  Zap,
  Globe
} from 'lucide-react';
import SmartPollLogo from './SmartPollLogo';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.footer 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true }}
      className="relative bg-slate-950 text-slate-100 border-t border-slate-800/80 overflow-hidden no-print mt-6 sm:mt-10"
    >
      {/* Smooth Glowing Top Divider Line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/80 to-transparent shadow-[0_0_10px_rgba(6,182,212,0.6)]" />

      {/* Subtle Ambient Background Glow Effects */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-24 bg-blue-600/10 blur-[60px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 relative z-10">
        {/* Top Feature Highlights Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <motion.div 
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-lg p-2 sm:p-2.5 flex items-center gap-2.5 shadow-sm hover:border-blue-500/40 hover:bg-slate-900/90 transition-all group min-w-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-all shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[11px] sm:text-xs font-bold text-white tracking-wide flex items-center gap-1 truncate">
                Voice to Poll AI <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-pulse shrink-0" />
              </h4>
              <p className="text-[10px] text-slate-400 truncate">Instant neural NLP evaluation</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-lg p-2 sm:p-2.5 flex items-center gap-2.5 shadow-sm hover:border-cyan-500/40 hover:bg-slate-900/90 transition-all group min-w-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-all shrink-0">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[11px] sm:text-xs font-bold text-white tracking-wide flex items-center gap-1 truncate">
                Live Analytics Sync <Globe className="w-2.5 h-2.5 text-blue-400 shrink-0" />
              </h4>
              <p className="text-[10px] text-slate-400 truncate">Real-time profile & platform telemetry</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-lg p-2 sm:p-2.5 flex items-center gap-2.5 shadow-sm hover:border-emerald-500/40 hover:bg-slate-900/90 transition-all group min-w-0"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all shrink-0">
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[11px] sm:text-xs font-bold text-white tracking-wide flex items-center gap-1 truncate">
                Enterprise Security <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              </h4>
              <p className="text-[10px] text-slate-400 truncate">Role-based access & encrypted channels</p>
            </div>
          </motion.div>
        </div>

        {/* Middle Main Footer Row */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-3 sm:gap-4 py-3 border-t border-b border-slate-800/60">
          {/* Left Brand Info */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left min-w-0">
            <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 shadow-sm shrink-0">
              <SmartPollLogo size="sm" showText={false} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1 sm:gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm tracking-wide bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                  SC SkillTrack AI
                </span>
                <span className="text-slate-400 text-[11px] font-mono font-medium hidden sm:inline">— "Track Every Coding Achievement."</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Developed by <span className="text-slate-200 font-bold">SC TECH</span> © 2026 • All Rights Reserved
              </p>
            </div>
          </div>

          {/* Right Badges & Status Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Live Status Indicator */}
            <div 
              className="bg-slate-900/90 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold flex items-center shadow-sm cursor-default"
            >
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Systems Operational</span>
            </div>

            {/* Secure System Badge */}
            <div 
              className="bg-slate-900/90 border border-blue-500/30 text-blue-400 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 shadow-sm cursor-default"
            >
              <Shield className="w-3 h-3 text-blue-400" />
              <span>AES-256 Secure</span>
            </div>

            {/* Version Badge */}
            <div 
              className="bg-slate-900/90 border border-slate-700/80 text-slate-300 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 shadow-sm cursor-default"
            >
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>v2026.4.0 • Enterprise</span>
            </div>
          </div>
        </div>

        {/* Bottom Scroll-To-Top & Small Metadata */}
        <div className="pt-2.5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-2 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> AI Neural Pipeline Verified
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Real-time Code Analytics Engine</span>
          </div>

          <motion.button
            onClick={scrollToTop}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer shadow-sm group"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3 h-3 text-blue-400 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        </div>
      </div>
    </motion.footer>
  );
}
