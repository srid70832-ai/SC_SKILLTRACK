import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Search, Filter, Crown, Flame, Zap, Award, 
  ExternalLink, ArrowUpDown, ChevronRight, BarChart2 
} from 'lucide-react';
import { CodeAnalyticsStudentMetrics, CodingPlatform } from '../../types';

interface TopCodersLeaderboardProps {
  students: CodeAnalyticsStudentMetrics[];
  onSelectStudent: (student: CodeAnalyticsStudentMetrics) => void;
}

export default function TopCodersLeaderboard({
  students,
  onSelectStudent
}: TopCodersLeaderboardProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter and sort students based on active period & platform (Only students with profile links)
  const filteredStudents = students.filter(s => {
    const hasLink = s.profileLinks && Object.values(s.profileLinks).some(v => typeof v === 'string' && v.trim().length > 0);
    if (!hasLink) return false;

    const matchesSearch = s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.registerNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedPlatform !== 'All') {
      const platformCount = s.platformBreakdown?.[selectedPlatform as CodingPlatform] || 0;
      if (platformCount === 0) return false;
    }

    return true;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let countA = 0;
    let countB = 0;
    if (period === 'today') {
      countA = a.problemsSolvedToday || 0;
      countB = b.problemsSolvedToday || 0;
    } else if (period === 'week') {
      countA = a.weeklyCount || 0;
      countB = b.weeklyCount || 0;
    } else if (period === 'month') {
      countA = a.monthlyCount || 0;
      countB = b.monthlyCount || 0;
    } else {
      countA = a.totalSolved || 0;
      countB = b.totalSolved || 0;
    }

    if (countB !== countA) return countB - countA;

    // Tie-breaker 1: Total Solved
    const totalA = a.totalSolved || 0;
    const totalB = b.totalSolved || 0;
    if (totalB !== totalA) return totalB - totalA;

    // Tie-breaker 2: Contest Rating
    const ratingA = a.contestRating || 0;
    const ratingB = b.contestRating || 0;
    return ratingB - ratingA;
  });

  const top1 = sortedStudents[0];
  const top2 = sortedStudents[1];
  const top3 = sortedStudents[2];

  const getSolvedCount = (s: CodeAnalyticsStudentMetrics) => {
    if (period === 'today') return s.problemsSolvedToday || 0;
    if (period === 'week') return s.weeklyCount || 0;
    if (period === 'month') return s.monthlyCount || 0;
    return s.totalSolved || 0;
  };

  return (
    <div className="space-y-8">
      {/* Search & Filter Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or register no..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        {/* Period Switcher Buttons */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs font-bold overflow-x-auto scrollbar-none">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              period === 'today' ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              period === 'week' ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              period === 'month' ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              period === 'all' ? 'bg-blue-600 text-white shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Time
          </button>
        </div>

        {/* Platform Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="w-full md:w-auto px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Platforms</option>
            <option value="LeetCode">LeetCode 🟡</option>
            <option value="CodeChef">CodeChef 🟤</option>
            <option value="Codeforces">Codeforces 🔴</option>
            <option value="AtCoder">AtCoder ⚫</option>
            <option value="Codolio">Codolio 🟣</option>
            <option value="HackerRank">HackerRank 🟢</option>
            <option value="GitHub">GitHub 🐙</option>
            <option value="GeeksforGeeks">GeeksforGeeks 💚</option>
          </select>
        </div>
      </div>

      {/* Top 3 Podium Section - Only shown when top student has solved problems > 0 */}
      {sortedStudents.length >= 3 && top1 && getSolvedCount(top1) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 items-end">
          {/* Rank 2 (Silver) */}
          {top2 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              onClick={() => onSelectStudent(top2)}
              className="relative p-6 rounded-3xl bg-gradient-to-b from-slate-800/90 via-slate-900 to-slate-950 border border-slate-400/40 shadow-xl cursor-pointer hover:border-slate-300 transition-all group order-2 md:order-1"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black bg-slate-300 text-slate-900 shadow-md border border-white flex items-center gap-1">
                🥈 Rank #2
              </div>

              <div className="text-center pt-2">
                <img
                  src={top2.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${top2.registerNumber}`}
                  alt={top2.studentName}
                  className="w-16 h-16 rounded-2xl mx-auto border-2 border-slate-300 bg-slate-800 object-cover shadow-lg group-hover:scale-105 transition-transform"
                />
                <h3 className="text-base font-extrabold text-white mt-3 font-display">{top2.studentName}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{top2.registerNumber}</p>

                <div className="mt-4 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Solved</span>
                  <span className="text-slate-200 font-black text-sm">{getSolvedCount(top2)} Problems</span>
                </div>

                <div className="mt-2 text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-400" /> {top2.xp} XP Points
                </div>
              </div>
            </motion.div>
          )}

          {/* Rank 1 (Gold 👑) - Tallest & Center */}
          {top1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => onSelectStudent(top1)}
              className="relative p-7 rounded-3xl bg-gradient-to-b from-amber-950/80 via-slate-900 to-blue-950 border-2 border-amber-400/80 shadow-2xl shadow-amber-500/20 cursor-pointer hover:border-amber-300 transition-all group order-1 md:order-2 -translate-y-2"
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-lg border border-amber-200 flex items-center gap-1.5 animate-bounce">
                <Crown className="w-4 h-4 fill-slate-950" /> 🥇 RANK #1 CHAMPION
              </div>

              <div className="text-center pt-3">
                <div className="relative inline-block">
                  <div className="absolute -inset-2 rounded-2xl bg-amber-400 blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                  <img
                    src={top1.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${top1.registerNumber}`}
                    alt={top1.studentName}
                    className="relative w-20 h-20 rounded-2xl mx-auto border-2 border-amber-300 bg-slate-800 object-cover shadow-xl group-hover:scale-105 transition-transform"
                  />
                </div>

                <h3 className="text-lg font-black text-white mt-3 font-display">{top1.studentName}</h3>
                <p className="text-xs text-amber-300 font-mono mt-0.5">{top1.registerNumber}</p>

                <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex justify-between items-center text-xs">
                  <span className="text-amber-200/80 font-medium">Solved {period.toUpperCase()}</span>
                  <span className="text-amber-300 font-black text-base">{getSolvedCount(top1)} Problems</span>
                </div>

                <div className="mt-2 text-xs font-extrabold text-amber-400 flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> {top1.xp} XP • {top1.streakDays} Day Streak
                </div>
              </div>
            </motion.div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onClick={() => onSelectStudent(top3)}
              className="relative p-6 rounded-3xl bg-gradient-to-b from-amber-900/30 via-slate-900 to-slate-950 border border-amber-700/40 shadow-xl cursor-pointer hover:border-amber-600 transition-all group order-3"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black bg-amber-700 text-white shadow-md border border-amber-500 flex items-center gap-1">
                🥉 Rank #3
              </div>

              <div className="text-center pt-2">
                <img
                  src={top3.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3.registerNumber}`}
                  alt={top3.studentName}
                  className="w-16 h-16 rounded-2xl mx-auto border-2 border-amber-600 bg-slate-800 object-cover shadow-lg group-hover:scale-105 transition-transform"
                />
                <h3 className="text-base font-extrabold text-white mt-3 font-display">{top3.studentName}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{top3.registerNumber}</p>

                <div className="mt-4 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Solved</span>
                  <span className="text-amber-200 font-black text-sm">{getSolvedCount(top3)} Problems</span>
                </div>

                <div className="mt-2 text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-400" /> {top3.xp} XP Points
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Complete Leaderboard Table */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-display">
              Class Coding Rankings ({sortedStudents.length} Coders)
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Sorted by <span className="text-blue-400 uppercase font-bold">{period} Solves</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Rank</th>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Dept / Sec</th>
                <th className="px-6 py-3.5 text-center">Solved ({period.toUpperCase()})</th>
                <th className="px-6 py-3.5 text-center">Total Solved</th>
                <th className="px-6 py-3.5 text-center">Contest Rating</th>
                <th className="px-6 py-3.5 text-center">XP Points</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="space-y-3 max-w-md mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                        <Trophy className="w-6 h-6 text-slate-400" />
                      </div>
                      <h4 className="text-sm font-extrabold text-white">No coding analytics available yet.</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Connect your coding profiles to start analytics. Data will appear automatically after successful synchronization.
                      </p>
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          🟡 Waiting for Sync
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedStudents.map((s, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;

                return (
                  <tr
                    key={`${s.registerNumber || 'coder'}-${index}`}
                    onClick={() => onSelectStudent(s)}
                    className="hover:bg-blue-950/40 transition-colors cursor-pointer group"
                  >
                    {/* Rank Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl text-xs font-black ${
                        rank === 1 ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/30' :
                        rank === 2 ? 'bg-slate-300 text-slate-950 shadow-md' :
                        rank === 3 ? 'bg-amber-700 text-white shadow-md' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {rank}
                      </span>
                    </td>

                    {/* Student Name & Avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={s.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${s.registerNumber}`}
                          alt={s.studentName}
                          className="w-9 h-9 rounded-xl bg-slate-800 object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                            {s.studentName}
                            {s.problemsSolvedToday > 0 && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active Today" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.registerNumber}</div>
                        </div>
                      </div>
                    </td>

                    {/* Dept & Section */}
                    <td className="px-6 py-4 text-xs font-semibold text-slate-300">
                      {s.department} - Year {s.year} - Sec {s.section}
                    </td>

                    {/* Period Solved Count */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-black text-amber-400">
                        {getSolvedCount(s)}
                      </span>
                    </td>

                    {/* Total Solved */}
                    <td className="px-6 py-4 text-center font-bold text-blue-400">
                      {s.totalSolved}
                    </td>

                    {/* Contest Rating */}
                    <td className="px-6 py-4 text-center font-bold text-indigo-400">
                      {s.contestRating}
                    </td>

                    {/* XP Points */}
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        ⚡ {s.xp}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(s);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-blue-600 text-slate-300 group-hover:text-white transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold px-2.5"
                      >
                        <span>View Analytics</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
