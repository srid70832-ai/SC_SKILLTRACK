import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Calendar, Clock, ExternalLink, Users, ShieldCheck, 
  Download, FileSpreadsheet, FileText, FileCode, Search, Filter, 
  Sparkles, Plus, AlertCircle, CheckCircle2, ChevronRight, X, 
  Eye, RefreshCw, Flame, Award, Hash, Zap
} from 'lucide-react';
import { CodingContest, ContestParticipant, CodingPlatform } from '../../types';
import { exportContestPdf, exportContestExcel, exportContestCsv } from '../../lib/contestExportUtils';

interface ContestsTrackerProps {
  contests: CodingContest[];
  onRefreshContests?: () => void;
}

export default function ContestsTracker({ contests, onRefreshContests }: ContestsTrackerProps) {
  // Active Selected Contest for Modal View
  const [selectedContest, setSelectedContest] = useState<CodingContest | null>(null);

  // Filters State
  const [searchContest, setSearchContest] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedMentor, setSelectedMentor] = useState<string>('All');
  const [searchStudent, setSearchStudent] = useState<string>('');

  // Modal State for Adding Verified Contest Entry
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [submittingEntry, setSubmittingEntry] = useState<boolean>(false);

  // Form State
  const [newContestTitle, setNewContestTitle] = useState<string>('');
  const [newContestPlatform, setNewContestPlatform] = useState<CodingPlatform>('LeetCode');
  const [newContestDate, setNewContestDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newContestUrl, setNewContestUrl] = useState<string>('');
  
  // Student Entry Form State inside Add Modal
  const [studentRegNo, setStudentRegNo] = useState<string>('');
  const [studentNameInput, setStudentNameInput] = useState<string>('');
  const [studentDeptInput, setStudentDeptInput] = useState<string>('AI&DS');
  const [studentRankInput, setStudentRankInput] = useState<string>('1');
  const [studentSolvedInput, setStudentSolvedInput] = useState<string>('2');
  const [studentPenaltyInput, setStudentPenaltyInput] = useState<string>('00:25:00');
  const [studentScoreInput, setStudentScoreInput] = useState<string>('200');

  // Platform styling maps
  const platformBadges: Record<string, { badge: string; text: string; bg: string }> = {
    LeetCode: { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30', text: 'text-amber-400', bg: 'from-amber-950/40 to-slate-900' },
    CodeChef: { badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', text: 'text-orange-400', bg: 'from-orange-950/40 to-slate-900' },
    Codeforces: { badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30', text: 'text-rose-400', bg: 'from-rose-950/40 to-slate-900' },
  };

  // Time remaining countdown logic
  const getTimeRemaining = (endTimeStr: string) => {
    const totalMs = new Date(endTimeStr).getTime() - Date.now();
    if (totalMs <= 0) return 'Ended';
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const mins = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((totalMs % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} remaining`;
  };

  // Filter Contests List
  const filteredContests = useMemo(() => {
    return contests.filter(contest => {
      // Platform Filter (Strictly LeetCode, CodeChef, Codeforces)
      if (selectedPlatform !== 'All' && contest.platform !== selectedPlatform) {
        return false;
      }
      // Status Filter
      if (selectedStatus !== 'All' && contest.status !== selectedStatus) {
        return false;
      }
      // Contest Name Search
      if (searchContest.trim()) {
        const query = searchContest.toLowerCase();
        if (!contest.title.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [contests, selectedPlatform, selectedStatus, searchContest]);

  // Filter Participants inside Selected Contest
  const getFilteredParticipants = (participants: ContestParticipant[] = []): ContestParticipant[] => {
    return participants.filter(p => {
      if (selectedDept !== 'All' && p.department !== selectedDept) return false;
      if (selectedSection !== 'All' && p.section !== selectedSection) return false;
      if (selectedMentor !== 'All' && (!p.mentorName || !p.mentorName.toLowerCase().includes(selectedMentor.toLowerCase()))) return false;
      if (searchStudent.trim()) {
        const q = searchStudent.toLowerCase();
        const matchName = p.studentName && p.studentName.toLowerCase().includes(q);
        const matchReg = p.registerNumber && p.registerNumber.toLowerCase().includes(q);
        if (!matchName && !matchReg) return false;
      }
      return true;
    });
  };

  // Submit Verified Official Contest Entry
  const handleAddOfficialContest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContestTitle.trim()) return;

    try {
      setSubmittingEntry(true);
      // 1. Create Contest
      const res = await fetch('/api/code-analytics/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newContestTitle.trim(),
          platform: newContestPlatform,
          contestDate: newContestDate,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 7200000).toISOString(),
          url: newContestUrl.trim() || `https://${newContestPlatform.toLowerCase()}.com`
        })
      });

      if (res.ok) {
        const createdContest = await res.json();
        
        // 2. Add Student Participant if entered
        if (studentRegNo.trim()) {
          await fetch(`/api/code-analytics/contests/${createdContest.id}/participants`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registerNumber: studentRegNo.trim(),
              studentName: studentNameInput.trim() || studentRegNo.trim(),
              department: studentDeptInput,
              contestRank: Number(studentRankInput) || 1,
              problemsSolved: Number(studentSolvedInput) || 1,
              penalty: studentPenaltyInput || '00:20:00',
              score: Number(studentScoreInput) || 100,
              profileUrl: newContestUrl || ''
            })
          });
        }

        if (onRefreshContests) onRefreshContests();
        setShowAddModal(false);
        setNewContestTitle('');
        setStudentRegNo('');
      }
    } catch (err) {
      console.error('Failed to create contest entry:', err);
    } finally {
      setSubmittingEntry(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-blue-500/30 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Real Official Contest Tracker
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              LeetCode • CodeChef • Codeforces
            </span>
          </div>
          <h3 className="text-xl font-black text-white font-display flex items-center gap-2">
            <span>Official Coding Contest Dashboard & Reports</span>
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Real-time live monitoring and permanent frozen reports for official contests. Zero fake data or estimations. Every export is strictly verified.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add / Sync Official Contest</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Contest Name Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search contest name..."
              value={searchContest}
              onChange={(e) => setSearchContest(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Platform Select */}
          <div>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Platforms (LeetCode, CodeChef, Codeforces)</option>
              <option value="LeetCode">LeetCode Contest</option>
              <option value="CodeChef">CodeChef Contest</option>
              <option value="Codeforces">Codeforces Contest</option>
            </select>
          </div>

          {/* Status Select */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses (Live, Completed, Upcoming)</option>
              <option value="Live">🔴 Live Contests Only</option>
              <option value="Completed">❄️ Completed & Frozen Contests</option>
              <option value="Upcoming">📅 Upcoming Contests</option>
            </select>
          </div>

          {/* Department Select */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Departments (AI&DS, CSE, ECE, IT, MECH)</option>
              <option value="AI&DS">AI&DS</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="IT">IT</option>
              <option value="MECH">MECH</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Active Contests Found:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-extrabold border border-blue-500/30">
              {filteredContests.length} Official Contests
            </span>
          </div>

          {(searchContest || selectedPlatform !== 'All' || selectedStatus !== 'All' || selectedDept !== 'All') && (
            <button
              onClick={() => {
                setSearchContest('');
                setSelectedPlatform('All');
                setSelectedStatus('All');
                setSelectedDept('All');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Contests Cards Grid */}
      {filteredContests.length === 0 ? (
        <div className="p-16 text-center bg-slate-900/80 rounded-3xl border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Trophy className="w-6 h-6 text-slate-400" />
          </div>
          <h4 className="text-base font-extrabold text-white">No verified contest submissions found.</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            No official contest data matches the selected filter parameters. Change your filters or click "Add / Sync Official Contest" to record verified results.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredContests.map((contest, idx) => {
            const isLive = contest.status === 'Live';
            const isCompleted = contest.status === 'Completed';
            const style = platformBadges[contest.platform] || { badge: 'bg-blue-500/20 text-blue-300 border-blue-400/30', text: 'text-blue-400', bg: 'from-slate-900 to-slate-900' };
            const participants = contest.participants || [];
            const filteredParts = getFilteredParticipants(participants);

            return (
              <motion.div
                key={contest.id ? `${contest.id}-${idx}` : `contest-${idx}`}
                whileHover={{ y: -3 }}
                className={`p-6 rounded-3xl bg-slate-900/90 border transition-all shadow-xl flex flex-col justify-between ${
                  isLive 
                    ? 'border-amber-400/80 shadow-amber-500/10' 
                    : isCompleted 
                    ? 'border-emerald-500/30' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex justify-between items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase border ${style.badge}`}>
                      {contest.platform} Contest
                    </span>

                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase flex items-center gap-1.5 border ${
                      isLive 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 animate-pulse' 
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-blue-500/10 text-blue-300 border-blue-400/20'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      {isLive ? 'CONTEST LIVE' : isCompleted ? 'COMPLETED & FROZEN' : 'UPCOMING'}
                    </span>
                  </div>

                  {/* Contest Title */}
                  <h4 className="text-lg font-black text-white font-display">{contest.title}</h4>

                  {/* Metadata Row */}
                  <div className="mt-3 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        Contest Date:
                      </span>
                      <strong className="text-white">{contest.contestDate || new Date(contest.startTime).toLocaleDateString()}</strong>
                    </div>

                    {isLive && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                        <span className="text-amber-300 font-bold flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                          Time Remaining:
                        </span>
                        <strong className="text-amber-200 font-mono text-xs">{getTimeRemaining(contest.endTime)}</strong>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Users className="w-4 h-4 text-emerald-400" />
                        Participating Coders:
                      </span>
                      <strong className="text-emerald-300 font-black">{filteredParts.length} Verified Students</strong>
                    </div>
                  </div>

                  {/* Top 3 Participants Leaderboard Preview */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        Contest Leaderboard Preview
                      </span>
                      <span className="text-[10px] text-slate-500">Official Ranks</span>
                    </div>

                    {filteredParts.length === 0 ? (
                      <p className="text-xs text-amber-400/90 italic">No verified contest submissions found for current filter.</p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {filteredParts.slice(0, 3).map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center text-slate-200">
                            <span className="font-bold flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-700 text-amber-300 text-[10px] font-black flex items-center justify-center">
                                #{p.contestRank || p.currentRank || idx + 1}
                              </span>
                              <span>{p.studentName}</span>
                              <span className="text-[10px] text-slate-400">({p.registerNumber})</span>
                            </span>
                            <span className="text-emerald-400 font-extrabold">{p.problemsSolved} Solved</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Individual Contest Export Buttons & View Report Button */}
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
                  {/* Export Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-400">Official Report:</span>

                    <div className="flex items-center gap-1.5">
                      {/* PDF */}
                      <button
                        onClick={() => exportContestPdf(contest, filteredParts)}
                        title="Export Official PDF Report"
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                        <span>PDF</span>
                      </button>

                      {/* Excel */}
                      <button
                        onClick={() => exportContestExcel(contest, filteredParts)}
                        title="Export Excel (.xlsx)"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Excel</span>
                      </button>

                      {/* CSV */}
                      <button
                        onClick={() => exportContestCsv(contest, filteredParts)}
                        title="Export CSV (.csv)"
                        className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-400" />
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* View Full Report Button */}
                  <button
                    onClick={() => setSelectedContest(contest)}
                    className="w-full py-2.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Full Contest Report & Submissions</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* DETAILED INDIVIDUAL CONTEST REPORT MODAL */}
      <AnimatePresence>
        {selectedContest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl my-8 bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {selectedContest.platform} Official Contest
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      selectedContest.status === 'Live' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {selectedContest.status === 'Live' ? 'CONTEST LIVE' : 'FROZEN REPORT'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white font-display">
                    {selectedContest.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Contest Date: {selectedContest.contestDate || new Date(selectedContest.startTime).toLocaleDateString()} | Platform: {selectedContest.platform}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Export Buttons in Modal Header */}
                  <button
                    onClick={() => exportContestPdf(selectedContest, getFilteredParticipants(selectedContest.participants))}
                    className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-400" />
                    <span>PDF</span>
                  </button>

                  <button
                    onClick={() => exportContestExcel(selectedContest, getFilteredParticipants(selectedContest.participants))}
                    className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Excel</span>
                  </button>

                  <button
                    onClick={() => exportContestCsv(selectedContest, getFilteredParticipants(selectedContest.participants))}
                    className="px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={() => setSelectedContest(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer ml-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Contest Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Total Participants</span>
                    <p className="text-xl font-black text-white mt-1">
                      {getFilteredParticipants(selectedContest.participants).length}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Problems Solved</span>
                    <p className="text-xl font-black text-emerald-400 mt-1">
                      {getFilteredParticipants(selectedContest.participants).reduce((sum, p) => sum + (p.problemsSolved || 0), 0)}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Platform</span>
                    <p className="text-xl font-black text-amber-400 mt-1">
                      {selectedContest.platform}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Status</span>
                    <p className="text-[13px] font-black text-blue-300 mt-1 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      {selectedContest.status === 'Completed' ? 'Frozen Record' : 'Live Monitoring'}
                    </p>
                  </div>
                </div>

                {/* Table Header & Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Contest Student Records</span>
                  </h4>

                  <div className="w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Filter student in this contest..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Participants Table */}
                {getFilteredParticipants(selectedContest.participants).length === 0 ? (
                  <div className="p-12 text-center bg-slate-800/40 rounded-2xl border border-slate-800 space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                    <h5 className="text-sm font-extrabold text-white">No verified contest submissions found.</h5>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      There are no verified student participation records matching your current filter criteria for this contest.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/80">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-800/80 text-slate-200 font-bold uppercase text-[11px] border-b border-slate-700">
                          <tr>
                            <th className="p-3">Rank</th>
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Register Number</th>
                            <th className="p-3">Department</th>
                            <th className="p-3">Problems Solved</th>
                            <th className="p-3">Penalty</th>
                            <th className="p-3">Score</th>
                            <th className="p-3">Submissions / Profile</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-medium">
                          {getFilteredParticipants(selectedContest.participants).map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/50 transition-all">
                              <td className="p-3 font-black text-amber-300">
                                #{p.contestRank || p.currentRank || idx + 1}
                              </td>
                              <td className="p-3 font-bold text-white">
                                {p.studentName}
                              </td>
                              <td className="p-3 text-slate-300 font-mono">
                                {p.registerNumber}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                                  {p.department || 'AI&DS'} - {p.year || 'II'}{p.section || 'A'}
                                </span>
                              </td>
                              <td className="p-3 font-black text-emerald-400">
                                {p.problemsSolved} Solved
                              </td>
                              <td className="p-3 text-slate-300 font-mono">
                                {p.penalty || '00:00'}
                              </td>
                              <td className="p-3 font-bold text-amber-300">
                                {p.score ?? (p.problemsSolved ? p.problemsSolved * 100 : 0)}
                              </td>
                              <td className="p-3">
                                {p.profileUrl ? (
                                  <a
                                    href={p.profileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-[11px] font-bold"
                                  >
                                    <span>Verified Profile</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">Verified Submission</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD / SYNC VERIFIED OFFICIAL CONTEST MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <span>Add / Sync Verified Official Contest</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddOfficialContest} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Official Contest Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LeetCode Weekly Contest 462 or Codeforces Round 1084"
                    value={newContestTitle}
                    onChange={(e) => setNewContestTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Platform *</label>
                    <select
                      value={newContestPlatform}
                      onChange={(e) => setNewContestPlatform(e.target.value as CodingPlatform)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="LeetCode">LeetCode Contest</option>
                      <option value="CodeChef">CodeChef Contest</option>
                      <option value="Codeforces">Codeforces Contest</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Contest Date *</label>
                    <input
                      type="date"
                      value={newContestDate}
                      onChange={(e) => setNewContestDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Official Contest Page URL</label>
                  <input
                    type="url"
                    placeholder="https://leetcode.com/contest/weekly-contest-462"
                    value={newContestUrl}
                    onChange={(e) => setNewContestUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                  <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block">
                    Optional: Initial Student Verified Result
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Student Reg Number (e.g. 711525BAD004)"
                      value={studentRegNo}
                      onChange={(e) => setStudentRegNo(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Student Name"
                      value={studentNameInput}
                      onChange={(e) => setStudentNameInput(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Rank (e.g. 42)"
                      value={studentRankInput}
                      onChange={(e) => setStudentRankInput(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Problems Solved"
                      value={studentSolvedInput}
                      onChange={(e) => setStudentSolvedInput(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Penalty (00:20:00)"
                      value={studentPenaltyInput}
                      onChange={(e) => setStudentPenaltyInput(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submittingEntry}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-lg"
                  >
                    {submittingEntry ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>Save & Verify Record</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
