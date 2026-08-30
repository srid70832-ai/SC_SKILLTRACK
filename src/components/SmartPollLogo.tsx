import React from 'react';
import { motion } from 'motion/react';

interface SmartPollLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  lightText?: boolean;
}

export default function SmartPollLogo({ size = 'md', showText = false, lightText = false }: SmartPollLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-9 h-9'
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 border border-blue-400/30 relative overflow-hidden group shrink-0`}>
        {/* Subtle inner sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        
        {/* SC SkillTrack Vector Logo: Graduation Cap + Code Analytics Chart + AI Spark */}
        <svg 
          className={`${iconSizes[size]} text-white drop-shadow-sm`} 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Graduation Cap Top Accent */}
          <path 
            d="M16 4L5 9.5L16 15L27 9.5L16 4Z" 
            fill="currentColor" 
            fillOpacity="0.95" 
          />
          <path 
            d="M23.5 11.52V16.5C23.5 16.5 20.5 18.5 16 18.5C11.5 18.5 8.5 16.5 8.5 16.5V11.52" 
            stroke="currentColor" 
            strokeWidth="1.8" 
            strokeLinecap="round" 
          />
          {/* Tassel */}
          <path d="M25 10.5V15.5L26 17" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />

          {/* SkillTrack Bar Columns */}
          <rect x="8" y="21" width="3.5" height="7" rx="1" fill="#93C5FD" />
          <rect x="14.25" y="18" width="3.5" height="10" rx="1" fill="#FFFFFF" />
          <rect x="20.5" y="23" width="3.5" height="5" rx="1" fill="#60A5FA" />

          {/* Voice AI Spark Dot */}
          <circle cx="25" cy="6" r="2" fill="#F59E0B" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`text-lg font-black tracking-tight ${lightText ? 'text-white' : 'text-slate-900'} font-display leading-none`}>
              SC SkillTrack
            </span>
            <span className="px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
              AI
            </span>
          </div>
          <motion.span 
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className={`text-[10px] font-extrabold tracking-wider ${lightText ? 'text-cyan-300' : 'text-blue-600'}`}
          >
            Track Every Coding Achievement.
          </motion.span>
        </div>
      )}
    </div>
  );
}

