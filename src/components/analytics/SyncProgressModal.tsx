import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, CheckCircle2, AlertTriangle, Sparkles, Database, Globe, Search, ShieldCheck } from 'lucide-react';

export type SyncStep = 
  | 'Connecting...'
  | 'Fetching Profile...'
  | 'Reading Latest Activity...'
  | 'Generating AI Insights...'
  | 'Sync Complete'
  | 'Sync Failed';

interface SyncProgressModalProps {
  isOpen: boolean;
  currentStep: SyncStep;
  errorMessage?: string;
  onClose?: () => void;
  targetStudentName?: string;
}

const STEPS: { id: SyncStep; label: string; description: string; icon: any }[] = [
  { 
    id: 'Connecting...', 
    label: 'Connecting...', 
    description: 'Validating profile URLs & establishing secure platform handshake',
    icon: Globe 
  },
  { 
    id: 'Fetching Profile...', 
    label: 'Fetching Profile...', 
    description: 'Querying public APIs & live profile pages across coding platforms',
    icon: Search 
  },
  { 
    id: 'Reading Latest Activity...', 
    label: 'Reading Latest Activity...', 
    description: 'Extracting authentic problem solves, difficulty breakdown & ratings',
    icon: Database 
  },
  { 
    id: 'Generating AI Insights...', 
    label: 'Generating AI Insights...', 
    description: 'Gemini AI analyzing real fetched performance metrics for insights',
    icon: Sparkles 
  },
  { 
    id: 'Sync Complete', 
    label: 'Sync Complete', 
    description: 'Database updated cleanly & live dashboard refreshed',
    icon: ShieldCheck 
  }
];

export const SyncProgressModal: React.FC<SyncProgressModalProps> = ({
  isOpen,
  currentStep,
  errorMessage,
  onClose,
  targetStudentName
}) => {
  if (!isOpen) return null;

  const getStepIndex = (step: SyncStep) => {
    if (step === 'Sync Failed') return -1;
    const idx = STEPS.findIndex(s => s.id === step);
    return idx >= 0 ? idx : 0;
  };

  const activeIndex = getStepIndex(currentStep);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <RefreshCw className={`w-6 h-6 ${currentStep !== 'Sync Complete' && currentStep !== 'Sync Failed' ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>REAL DATA SYNC ENGINE</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {targetStudentName ? `Synchronizing data for ${targetStudentName}` : 'Synchronizing global competitive programming feeds'}
                </p>
              </div>
            </div>
          </div>

          {/* Sync Progress Steps */}
          <div className="py-6 space-y-4">
            {STEPS.map((stepItem, idx) => {
              const Icon = stepItem.icon;
              const isDone = activeIndex > idx || currentStep === 'Sync Complete';
              const isCurrent = activeIndex === idx && currentStep !== 'Sync Complete' && currentStep !== 'Sync Failed';
              const isPending = activeIndex < idx && currentStep !== 'Sync Complete';

              return (
                <div 
                  key={stepItem.id} 
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                    isCurrent 
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-lg shadow-blue-500/5' 
                      : isDone 
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300' 
                      : 'bg-slate-950/40 border-slate-800/80 opacity-60 text-slate-500'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isCurrent ? (
                      <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 text-slate-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isCurrent ? 'text-blue-300 font-extrabold' : isDone ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {stepItem.label}
                      </span>
                      {isDone && <span className="text-[10px] text-emerald-400 font-mono font-bold">Done</span>}
                      {isCurrent && <span className="text-[10px] text-blue-400 font-mono animate-pulse">In Progress...</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                      {stepItem.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error Notice if Sync Failed */}
          {(errorMessage || currentStep === 'Sync Failed') && (
            <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-300">Sync Notice:</span> Unable to fetch latest coding activity. {errorMessage}
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="pt-2 flex justify-end">
            {(currentStep === 'Sync Complete' || currentStep === 'Sync Failed' || errorMessage) ? (
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer shadow-lg"
              >
                Done
              </button>
            ) : (
              <div className="text-[11px] text-slate-500 font-mono text-center w-full">
                ⚡ Fetching authentic data... Please wait a moment.
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
