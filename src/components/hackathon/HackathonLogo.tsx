import React from 'react';

interface HackathonLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  lightText?: boolean;
}

export default function HackathonLogo({ size = 'md', showText = true, lightText = false }: HackathonLogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`${sizeClasses[size]} bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 border border-amber-300/40 relative overflow-hidden shrink-0`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
        
        {/* Trophy + Code Vector Logo */}
        <svg 
          className={`${iconSizes[size]} text-white drop-shadow-sm`} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-black tracking-tight ${lightText ? 'text-white' : 'text-slate-900'} font-display leading-none`}>
              SC HACKATHON HUB
            </span>
            <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-black rounded-md uppercase tracking-wider">
              🏆 2026
            </span>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${lightText ? 'text-amber-200' : 'text-amber-600'}`}>
            Register • Build • Win • Certify
          </span>
        </div>
      )}
    </div>
  );
}
