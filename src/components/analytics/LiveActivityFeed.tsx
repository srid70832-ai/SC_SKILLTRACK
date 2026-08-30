import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, RefreshCw, Zap, ExternalLink, Code, Flame } from 'lucide-react';
import { LiveActivityFeedItem } from '../../types';

interface LiveActivityFeedProps {
  feed: LiveActivityFeedItem[];
  onTriggerSync: () => Promise<void>;
}

export default function LiveActivityFeed({
  feed,
  onTriggerSync
}: LiveActivityFeedProps) {
  const [syncing, setSyncing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');

  const handleSync = async () => {
    try {
      setSyncing(true);
      await onTriggerSync();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const filteredFeed = feed.filter(item => {
    if (selectedPlatform === 'All') return true;
    return item.platform === selectedPlatform;
  });

  return (
    <div className="space-y-6">
      {/* Top Ticker Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white font-display flex items-center gap-2">
              Live Submission Stream
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            </h3>
            <p className="text-xs text-slate-400">
              Real-time competitive programming activity tracking across all platforms
            </p>
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center gap-2 shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Fetching Live Feeds...' : 'Sync Live Stream'}</span>
        </button>
      </div>

      {/* Platform Filter Buttons */}
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        {['All', 'LeetCode', 'CodeChef', 'Codeforces', 'AtCoder', 'Codolio', 'HackerRank', 'GitHub'].map((plat) => (
          <button
            key={plat}
            onClick={() => setSelectedPlatform(plat)}
            className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              selectedPlatform === plat
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
            }`}
          >
            {plat}
          </button>
        ))}
      </div>

      {/* Feed Stream List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredFeed.map((item, idx) => (
            <motion.div
              key={item.id ? `${item.id}-${item.registerNumber || idx}-${idx}` : `feed-${idx}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.35, delay: idx * 0.03 }}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={item.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.registerNumber}`}
                  alt={item.studentName}
                  className="w-10 h-10 rounded-xl bg-slate-800 object-cover border border-slate-700 shrink-0"
                />
                <div>
                  <div className="text-xs font-extrabold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                    {item.studentName}
                    <span className="text-[10px] text-slate-400 font-mono">({item.registerNumber})</span>
                  </div>

                  <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-1.5 font-medium">
                    <span>solved</span>
                    <span className="font-bold text-white">{item.problemTitle || 'Coding Challenge'}</span>
                    <span>on</span>
                    <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 text-[10px]">
                      {item.platform}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                {item.difficulty && (
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border ${
                    item.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    item.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {item.difficulty}
                  </span>
                )}

                <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  +{item.xpEarned || 15} XP
                </span>

                <span className="text-[10px] text-slate-400 font-medium">
                  {item.formattedTime || 'Just now'}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredFeed.length === 0 && (
          <div className="text-center py-16 px-6 bg-slate-900/80 rounded-3xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <Activity className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-extrabold text-white">No coding activity found.</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Waiting for first synchronization. Connect your coding profiles to start analytics. Data will appear automatically after successful synchronization.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                🟡 Waiting for Sync
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
