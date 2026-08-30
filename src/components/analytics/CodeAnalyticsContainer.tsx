import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, Trophy, Activity, Calendar, MessageSquare, BrainCircuit, 
  Search, RefreshCw, Flame, Users, Zap, Code2, Globe, ShieldCheck, Sparkles,
  ExternalLink, CheckCircle2, AlertCircle, Clock, User, Layers, Award
} from 'lucide-react';
import { 
  CodeAnalyticsStudentMetrics, 
  CodingContest, 
  LiveActivityFeedItem, 
  UserSession, 
  PlatformLinks 
} from '../../types';

import TopCodersLeaderboard from './TopCodersLeaderboard';
import LiveActivityFeed from './LiveActivityFeed';
import ContestsTracker from './ContestsTracker';
import WhatsAppSummaryGenerator from './WhatsAppSummaryGenerator';
import AIInsightsPanel from './AIInsightsPanel';
import StudentAnalyticsProfileModal from './StudentAnalyticsProfileModal';
import { SyncProgressModal, SyncStep } from './SyncProgressModal';
import SubmissionAnalyticsTab from './SubmissionAnalyticsTab';
import ContestAnalysisModule from './ContestAnalysisModule';
import { verifyStudentIdentity } from '../../lib/studentVerification';

interface CodeAnalyticsContainerProps {
  session: UserSession;
}

export default function CodeAnalyticsContainer({ session }: CodeAnalyticsContainerProps) {
  const isStaff = session.role === 'Staff';

  // Tabs for Staff vs Student
  const [activeTab, setActiveTab] = useState<
    'submissions' | 'contest_analysis' | 'leaderboard' | 'registry' | 'feed' | 'contests' | 'whatsapp' | 'ai' | 'my_analytics' | 'my_contests' | 'my_profile'
  >(isStaff ? 'submissions' : 'my_analytics');
  
  const [studentsList, setStudentsList] = useState<CodeAnalyticsStudentMetrics[]>([]);
  const [feedItems, setFeedItems] = useState<LiveActivityFeedItem[]>([]);
  const [contestsList, setContestsList] = useState<CodingContest[]>([]);
  
  const [selectedStudent, setSelectedStudent] = useState<CodeAnalyticsStudentMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [globalSyncing, setGlobalSyncing] = useState<boolean>(false);
  const [directorySearch, setDirectorySearch] = useState<string>('');
  const [registryFilter, setRegistryFilter] = useState<'All' | 'Complete' | 'Incomplete'>('All');

  const [myStudentMetric, setMyStudentMetric] = useState<CodeAnalyticsStudentMetrics | null>(null);
  const [profileForm, setProfileForm] = useState<PlatformLinks>({});
  const [savingProfileForm, setSavingProfileForm] = useState(false);
  const [profileFormMessage, setProfileFormMessage] = useState('');

  // Sync Progress Modal State
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [syncModalStep, setSyncModalStep] = useState<SyncStep>('Connecting...');
  const [syncModalError, setSyncModalError] = useState<string>('');
  const [syncModalStudentName, setSyncModalStudentName] = useState<string>('');

  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState<boolean>(false);

  useEffect(() => {
    fetchAnalyticsData(true);
    const interval = setInterval(() => {
      fetchAnalyticsData(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [session.username, session.studentDetails?.registerNumber]);

  const cleanRegUpper = (session.username || session.studentDetails?.registerNumber || session.studentDetails?.rollNumber || '').trim().toUpperCase();
  const currentRegNo = cleanRegUpper;

  const fetchAnalyticsData = async (isInitial = false, retries = 2) => {
    try {
      if (isInitial || !hasInitiallyLoaded) {
        console.log('[SC DEBUG] Initial data load');
        setLoading(true);
      } else {
        console.log('[SC DEBUG] Background sync');
      }

      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const ct = res.headers.get('content-type');
          if (ct && ct.includes('application/json')) {
            return await res.json();
          }
          return null;
        } catch (err) {
          console.warn(`[SAFE FETCH] Error fetching ${url}:`, err);
          return null;
        }
      };

      const [dataStudents, dataFeed, dataContests] = await Promise.all([
        safeFetch('/api/code-analytics/students'),
        safeFetch('/api/code-analytics/feed'),
        safeFetch('/api/code-analytics/contests')
      ]);

      if (dataStudents && Array.isArray(dataStudents)) {
        const verifiedStudents = dataStudents.map((s: CodeAnalyticsStudentMetrics) => {
          const verified = verifyStudentIdentity({
            studentName: s.studentName,
            registerNumber: s.registerNumber
          });
          return {
            ...s,
            studentName: verified.verifiedName,
            registerNumber: verified.verifiedRegisterNumber
          };
        });
        setStudentsList(verifiedStudents);
      }
      if (dataFeed) setFeedItems(dataFeed);
      if (dataContests) setContestsList(dataContests);

      if (cleanRegUpper) {
        const myData = await safeFetch(`/api/code-analytics/student/${cleanRegUpper}`);
        if (myData) {
          setMyStudentMetric(myData);
        }
      }

      if (isInitial || !hasInitiallyLoaded) {
        setHasInitiallyLoaded(true);
      }
    } catch (e) {
      if (retries > 0) {
        console.warn(`[ANALYTICS FETCH RETRY] Retrying... (${retries} left)`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchAnalyticsData(isInitial, retries - 1);
      }
      console.error('Error loading code analytics:', e);
    } finally {
      if (isInitial || !hasInitiallyLoaded) {
        setLoading(false);
      }
    }
  };

  const handleGlobalSync = async () => {
    if (!isStaff) return;
    try {
      setGlobalSyncing(true);
      setShowSyncModal(true);
      setSyncModalError('');
      setSyncModalStudentName('All Enrolled Coders');
      setSyncModalStep('Connecting...');

      await new Promise(r => setTimeout(r, 400));
      setSyncModalStep('Fetching Profile...');

      const res = await fetch('/api/code-analytics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      setSyncModalStep('Reading Latest Activity...');
      await new Promise(r => setTimeout(r, 400));

      setSyncModalStep('Generating AI Insights...');
      await new Promise(r => setTimeout(r, 500));

      if (res.ok) {
        await fetchAnalyticsData();
        setSyncModalStep('Sync Complete');
      } else {
        const errData = await res.json().catch(() => ({}));
        setSyncModalStep('Sync Failed');
        setSyncModalError(errData.error || 'Unable to fetch latest coding activity.');
      }
    } catch (e: any) {
      console.error(e);
      setSyncModalStep('Sync Failed');
      setSyncModalError(e.message || 'Unable to fetch latest coding activity.');
    } finally {
      setGlobalSyncing(false);
    }
  };

  const handleSyncStudent = async (regNo: string) => {
    const targetReg = regNo || currentRegNo;
    const studentObj = studentsList.find(s => s.registerNumber?.toUpperCase() === targetReg.toUpperCase());
    const studentName = studentObj ? studentObj.studentName : targetReg;

    try {
      setGlobalSyncing(true);
      setShowSyncModal(true);
      setSyncModalError('');
      setSyncModalStudentName(studentName);
      setSyncModalStep('Connecting...');

      await new Promise(r => setTimeout(r, 300));
      setSyncModalStep('Fetching Profile...');

      const res = await fetch('/api/code-analytics/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registerNumber: targetReg })
      });

      setSyncModalStep('Reading Latest Activity...');
      await new Promise(r => setTimeout(r, 400));

      setSyncModalStep('Generating AI Insights...');
      await new Promise(r => setTimeout(r, 500));

      if (res.ok) {
        const data = await res.json();
        if (data.student) {
          setMyStudentMetric(data.student);
          if (selectedStudent && (
            selectedStudent.registerNumber?.toUpperCase() === targetReg.toUpperCase() ||
            selectedStudent.registerNumber?.toUpperCase().endsWith(targetReg.toUpperCase())
          )) {
            setSelectedStudent(data.student);
          }
        }
        await fetchAnalyticsData();
        setSyncModalStep('Sync Complete');
      } else {
        const errData = await res.json().catch(() => ({}));
        setSyncModalStep('Sync Failed');
        setSyncModalError(errData.error || 'Unable to fetch latest coding activity.');
      }
    } catch (e: any) {
      console.error(`[CLIENT AUDIT SYNC] Exception during sync: ${e.message}`);
      setSyncModalStep('Sync Failed');
      setSyncModalError(e.message || 'Unable to fetch latest coding activity.');
    } finally {
      setGlobalSyncing(false);
    }
  };

  const handleUpdateLinks = async (regNo: string, links: PlatformLinks) => {
    const targetReg = regNo || currentRegNo;
    console.log(`\n==================================================`);
    console.log(`[CLIENT AUDIT UPDATE LINKS] Current Register Number: ${targetReg}`);
    console.log(`[CLIENT AUDIT UPDATE LINKS] Database query: PUT /api/code-analytics/student/${targetReg}/links`);
    console.log(`[CLIENT AUDIT UPDATE LINKS] Returned profile URLs:`, links);

    const handles = {
      leetcode: links.leetcode?.split('/').filter(Boolean).pop() || '',
      codechef: links.codechef?.split('/').filter(Boolean).pop() || '',
      codeforces: links.codeforces?.split('/').filter(Boolean).pop() || '',
      github: links.github?.split('/').filter(Boolean).pop() || ''
    };
    console.log(`[CLIENT AUDIT UPDATE LINKS] Extracted usernames:`, handles);

    try {
      const res = await fetch(`/api/code-analytics/student/${targetReg}/links`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links })
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[CLIENT AUDIT UPDATE LINKS] Platform fetch response: SUCCESS`);
        console.log(`[CLIENT AUDIT UPDATE LINKS] Database save response: SUCCESS`);
        console.log(`[CLIENT AUDIT UPDATE LINKS] Dashboard refresh status: Refreshed UI successfully`);

        if (data.student) {
          setMyStudentMetric(data.student);
          if (selectedStudent) {
            setSelectedStudent(data.student);
          }
        }
        await fetchAnalyticsData();
      } else {
        console.error(`[CLIENT AUDIT UPDATE LINKS] Database save response: FAILED`);
      }
    } catch (e: any) {
      console.error(`[CLIENT AUDIT UPDATE LINKS] Exception: ${e.message}`);
    }
  };

  // Student details for student view - Strictly isolated for currently logged in student
  const foundMetric = studentsList.find(s => 
    s.registerNumber?.toUpperCase() === cleanRegUpper ||
    (session.studentDetails?.rollNumber && s.registerNumber?.toUpperCase() === session.studentDetails.rollNumber.toUpperCase()) ||
    (session.studentDetails?.registerNumber && s.registerNumber?.toUpperCase() === session.studentDetails.registerNumber.toUpperCase())
  );

  const studentDetail = session.studentDetails;
  const currentStudentMetric: CodeAnalyticsStudentMetrics = myStudentMetric || foundMetric || {
    registerNumber: cleanRegUpper || session.username || 'UNKNOWN',
    studentName: studentDetail?.studentName || session.name || session.username || 'Student',
    department: studentDetail?.department || 'AI&DS',
    section: studentDetail?.section || 'A',
    year: studentDetail?.year || 'I',
    mentorName: studentDetail?.mentorName || '',
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanRegUpper}`,
    profileLinks: session.profileLinks || { leetcode: '', codechef: '', codeforces: '' },
    problemsSolvedToday: 0,
    problemsSolvedYesterday: 0,
    weeklyCount: 0,
    monthlyCount: 0,
    totalSolved: 0,
    contestParticipation: 0,
    contestRank: 0,
    contestRating: 0,
    currentRating: 0,
    maxRating: 0,
    xp: 0,
    streakDays: 0,
    lastActiveAt: 'Profile Not Linked',
    isActiveToday: false,
    difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
    languagesUsed: {},
    platformBreakdown: { LeetCode: 0, CodeChef: 0, Codeforces: 0, AtCoder: 0, Codolio: 0, HackerRank: 0, GitHub: 0, GeeksforGeeks: 0 },
    badges: [],
    recentSubmissions: [],
    heatmap: {},
    contestHistory: []
  };

  // Class Overview Summary Numbers (Only students with linked profiles)
  const linkedStudents = studentsList.filter(s => !!(
    s.profileLinks?.leetcode?.trim() || 
    s.profileLinks?.codechef?.trim() || 
    s.profileLinks?.codeforces?.trim()
  ));
  const totalStudents = linkedStudents.length;
  const activeTodayCount = linkedStudents.filter(s => (s.problemsSolvedToday || 0) > 0).length;
  const totalTodaySolved = linkedStudents.reduce((acc, s) => acc + (s.problemsSolvedToday || 0), 0);
  const avgRating = totalStudents > 0 ? Math.round(linkedStudents.reduce((acc, s) => acc + (s.contestRating || 0), 0) / totalStudents) : 0;

  // Search filtered directory list for search input
  const directoryResults = directorySearch.trim() ? studentsList.filter(s => 
    s.studentName.toLowerCase().includes(directorySearch.toLowerCase()) ||
    s.registerNumber.toLowerCase().includes(directorySearch.toLowerCase())
  ) : [];

  // Filter registry table for staff
  const registryList = studentsList.filter(s => {
    const hasAnyLink = !!(
      s.profileLinks?.leetcode?.trim() || 
      s.profileLinks?.codechef?.trim() || 
      s.profileLinks?.codeforces?.trim()
    );

    if (!hasAnyLink) return false;

    const matchesSearch = !directorySearch.trim() || 
      s.studentName.toLowerCase().includes(directorySearch.toLowerCase()) ||
      s.registerNumber.toLowerCase().includes(directorySearch.toLowerCase()) ||
      (s.mentorName && s.mentorName.toLowerCase().includes(directorySearch.toLowerCase()));

    const isComplete = !!(s.profileLinks?.leetcode?.trim() && s.profileLinks?.codechef?.trim() && s.profileLinks?.codeforces?.trim());

    if (registryFilter === 'Complete') return matchesSearch && isComplete;
    if (registryFilter === 'Incomplete') return matchesSearch && !isComplete;
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Hero Banner Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 border border-blue-500/30 shadow-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white"
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              className="p-4 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 text-white shadow-xl shadow-blue-500/20 shrink-0 border border-white/20"
            >
              <Code2 className="w-9 h-9 relative z-10 text-white" />
            </motion.div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Multi-Platform Tracker
                </span>
                {isStaff ? (
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-md flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Staff Analytics Control
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Student Profile Connected
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight font-display flex items-center gap-2">
                ⚡ SC CODE ANALYTICS
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                Automated competitive programming monitoring across LeetCode, CodeChef, Codeforces, AtCoder, Codolio, HackerRank, and GitHub.
              </p>
            </div>
          </div>

          {/* Action Sync Button */}
          {isStaff ? (
            <button
              onClick={handleGlobalSync}
              disabled={globalSyncing}
              className="px-5 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 text-white flex items-center gap-2 shadow-xl shadow-blue-600/30 hover:scale-105 transition-all cursor-pointer disabled:opacity-50 border border-white/20 self-stretch lg:self-auto justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${globalSyncing ? 'animate-spin' : ''}`} />
              <span>{globalSyncing ? 'Syncing All Students...' : 'Sync Live Analytics'}</span>
            </button>
          ) : (
            <button
              onClick={() => handleSyncStudent(currentRegNo)}
              disabled={globalSyncing}
              className="px-5 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-2 shadow-xl shadow-emerald-600/30 hover:scale-105 transition-all cursor-pointer disabled:opacity-50 border border-white/20 self-stretch lg:self-auto justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${globalSyncing ? 'animate-spin' : ''}`} />
              <span>{globalSyncing ? 'Refreshing My Data...' : 'Sync My Analytics'}</span>
            </button>
          )}
        </div>

        {/* Sync Status / Error Banner */}
        {currentStudentMetric?.syncError && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-center gap-3 backdrop-blur-md">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="leading-snug">
              <span className="font-bold text-amber-300">Sync Notice:</span> {currentStudentMetric.syncError}
            </div>
          </div>
        )}

        {/* Realtime Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="text-xs text-slate-400 font-medium">{isStaff ? 'Monitored Coders' : 'My Total Solved'}</div>
            <div className="text-xl font-black text-white mt-1 flex items-center gap-1.5">
              {isStaff ? (
                <><Users className="w-4 h-4 text-blue-400" /> {totalStudents} Students</>
              ) : (
                <><Code2 className="w-4 h-4 text-blue-400" /> {currentStudentMetric?.totalSolved || 0} Problems</>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="text-xs text-slate-400 font-medium">{isStaff ? 'Active Coders Today' : 'Problems Solved Today'}</div>
            <div className="text-xl font-black text-emerald-400 mt-1 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-emerald-400 fill-emerald-400" /> 
              {isStaff ? `${activeTodayCount} (${totalStudents > 0 ? Math.round((activeTodayCount/totalStudents)*100) : 0}%)` : `${currentStudentMetric?.problemsSolvedToday || 0} Solved`}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="text-xs text-slate-400 font-medium">{isStaff ? 'Problems Solved Today' : 'Current Streak'}</div>
            <div className="text-xl font-black text-amber-400 mt-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" /> 
              {isStaff ? `${totalTodaySolved} Solved` : `${currentStudentMetric?.streakDays || 0} Days`}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="text-xs text-slate-400 font-medium">{isStaff ? 'Class Avg Rating' : 'Contest Rating'}</div>
            <div className="text-xl font-black text-indigo-300 mt-1 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-indigo-400" /> 
              {isStaff ? `${avgRating} Rating` : `${currentStudentMetric?.contestRating || 0} Rating`}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Directory Quick Search (STAFF ONLY) */}
      {isStaff && (
        <div className="relative z-30">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={directorySearch}
              onChange={(e) => setDirectorySearch(e.target.value)}
              placeholder="🔍 Quick Search student by Name, Register No, or Mentor to view analytics or profile links..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-900 border border-blue-500/30 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-lg font-medium"
            />
          </div>

          {directorySearch.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 max-h-60 overflow-y-auto space-y-1">
              {directoryResults.map((s, idx) => (
                <div
                  key={`${s.registerNumber || 'student'}-${idx}`}
                  onClick={() => {
                    setSelectedStudent(s);
                    setDirectorySearch('');
                  }}
                  className="p-3 rounded-xl hover:bg-slate-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={s.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${s.registerNumber}`}
                      alt={s.studentName}
                      className="w-8 h-8 rounded-lg bg-slate-800 object-cover"
                    />
                    <div>
                      <div className="font-bold text-white">{s.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.registerNumber} • Mentor: {s.mentorName || 'N/A'}</div>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {s.totalSolved} Solved
                  </span>
                </div>
              ))}

              {directoryResults.length === 0 && (
                <div className="p-3 text-center text-xs text-slate-400">No student matches "{directorySearch}"</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation Tabs (Staff vs Student) */}
      {isStaff ? (
        /* STAFF NAVIGATION TABS */
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 sm:gap-2 bg-slate-900/80 p-1.5 sm:p-2 rounded-2xl border border-slate-800 shadow-md">
          <button
            onClick={() => setActiveTab('contest_analysis')}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs font-black transition-all cursor-pointer min-w-0 ${
              activeTab === 'contest_analysis'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                : 'text-amber-400 hover:text-white hover:bg-slate-800 border border-amber-500/20'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Contest Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-w-0 ${
              activeTab === 'submissions'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">Submissions</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-w-0 ${
              activeTab === 'leaderboard'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Top Coders</span>
          </button>

          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-w-0 ${
              activeTab === 'registry'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">Registry</span>
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-w-0 ${
              activeTab === 'feed'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Live Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('contests')}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-w-0 ${
              activeTab === 'contests'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">Contests</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-w-0 ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">WhatsApp Report</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-w-0 ${
              activeTab === 'ai'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">AI Insights</span>
          </button>
        </div>
      ) : (
        /* STUDENT NAVIGATION TABS (Strictly Student Modules Only) */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 bg-slate-900/80 p-1.5 sm:p-2 rounded-2xl border border-slate-800 shadow-md">
          <button
            onClick={() => setActiveTab('contest_analysis')}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs font-black transition-all cursor-pointer min-w-0 ${
              activeTab === 'contest_analysis'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30'
                : 'text-amber-400 hover:text-white hover:bg-slate-800 border border-amber-500/20'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Contest Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('my_analytics')}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-w-0 ${
              activeTab === 'my_analytics'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="truncate">My Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('my_contests')}
            className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-w-0 ${
              activeTab === 'my_contests'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">Contest History</span>
          </button>

          <button
            onClick={() => setActiveTab('my_profile')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'my_profile'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-amber-400" />
            <span>My Profile & Links</span>
          </button>
        </div>
      )}

      {/* Render Selected View */}
      {loading ? (
        <div className="text-center py-16 bg-slate-900/80 rounded-3xl border border-slate-800">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-xs text-slate-400 font-medium">Loading SC Code Analytics live database...</p>
        </div>
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* DEDICATED CONTEST ANALYSIS MODULE */}
          {activeTab === 'contest_analysis' && (
            <ContestAnalysisModule />
          )}

          {/* STAFF VIEWS */}
          {isStaff && activeTab === 'submissions' && (
            <SubmissionAnalyticsTab
              students={studentsList}
              onTriggerSync={handleGlobalSync}
              onSelectStudent={(std) => setSelectedStudent(std)}
              syncingGlobal={globalSyncing}
            />
          )}

          {isStaff && activeTab === 'leaderboard' && (
            <TopCodersLeaderboard
              students={studentsList}
              onSelectStudent={(std) => setSelectedStudent(std)}
            />
          )}

          {isStaff && activeTab === 'registry' && (
            <div className="bg-slate-900/90 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    <span>Student Coding Profiles Registry</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live database of submitted LeetCode, CodeChef, and Codeforces profiles mapped by Register Number.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Filter Status:</span>
                  <select
                    value={registryFilter}
                    onChange={(e) => setRegistryFilter(e.target.value as any)}
                    className="bg-slate-800 border border-slate-700 text-xs font-bold text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="All">All Students ({studentsList.length})</option>
                    <option value="Complete">Complete Profiles (3/3) ✅</option>
                    <option value="Incomplete">Incomplete Profiles ⚠️</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Register Number</th>
                      <th className="py-3.5 px-4">Submitted Platforms</th>
                      <th className="py-3.5 px-4">Last Sync Time</th>
                      <th className="py-3.5 px-4 text-center">Problems Today (Real)</th>
                      <th className="py-3.5 px-4 text-center">Total Solved (Real)</th>
                      <th className="py-3.5 px-4 text-center">Contest Rating (Real)</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {registryList.map((s, idx) => {
                      const lc = s.profileLinks?.leetcode?.trim();
                      const cc = s.profileLinks?.codechef?.trim();
                      const cf = s.profileLinks?.codeforces?.trim();
                      const linked = !!(lc || cc || cf);

                      let statusText = "Waiting for Profile Links";
                      let statusBg = "bg-amber-500/10 text-amber-400 border-amber-500/30";

                      if (s.syncStatus === "Failed") {
                        statusText = "Sync Failed";
                        statusBg = "bg-rose-500/10 text-rose-400 border-rose-500/30";
                      } else if (s.lastSyncTime && (s.totalSolved > 0 || linked)) {
                        statusText = "Sync Successful";
                        statusBg = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                      } else if (linked) {
                        statusText = "Profile Linked";
                        statusBg = "bg-blue-500/10 text-blue-400 border-blue-500/30";
                      }

                      return (
                        <tr key={`${s.registerNumber || 'student'}-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white">{s.studentName}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{s.registerNumber}</td>
                          
                          {/* Submitted Platforms */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1 font-mono text-[11px]">
                              {lc ? (
                                <span className="text-amber-400 font-bold flex items-center gap-1">
                                  <span>🟡 LeetCode ✓</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">LeetCode Not Linked</span>
                              )}

                              {cc ? (
                                <span className="text-amber-600 font-bold flex items-center gap-1">
                                  <span>🟤 CodeChef ✓</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">CodeChef Not Linked</span>
                              )}

                              {cf ? (
                                <span className="text-red-400 font-bold flex items-center gap-1">
                                  <span>🔴 Codeforces ✓</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">Codeforces Not Linked</span>
                              )}
                            </div>
                          </td>

                          {/* Last Sync Time */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                            {s.lastSyncTime ? new Date(s.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }) : (linked ? 'Just now' : 'Never')}
                          </td>

                          {/* Problems Solved Today (real) */}
                          <td className="py-3.5 px-4 text-center font-bold text-amber-400 font-mono">
                            {s.problemsSolvedToday || 0}
                          </td>

                          {/* Total Solved (real) */}
                          <td className="py-3.5 px-4 text-center font-bold text-blue-400 font-mono">
                            {s.totalSolved || 0}
                          </td>

                          {/* Contest Rating (real) */}
                          <td className="py-3.5 px-4 text-center font-bold text-indigo-400 font-mono">
                            {s.contestRating || 0}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${statusBg}`}>
                              {statusText}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedStudent(s)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-md"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {registryList.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Globe className="w-8 h-8 text-slate-500 animate-pulse" />
                            <p className="text-sm font-extrabold text-white">No coding profiles have been linked yet.</p>
                            <p className="text-xs text-slate-400">Students must submit their profile links to appear in the dashboard.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isStaff && activeTab === 'feed' && (
            <LiveActivityFeed
              feed={feedItems}
              onTriggerSync={handleGlobalSync}
            />
          )}

          {isStaff && activeTab === 'contests' && (
            <ContestsTracker
              contests={contestsList}
            />
          )}

          {isStaff && activeTab === 'whatsapp' && (
            <WhatsAppSummaryGenerator />
          )}

          {isStaff && activeTab === 'ai' && (
            <AIInsightsPanel />
          )}

          {/* STUDENT VIEWS (Strictly Student Dashboard) */}
          {!isStaff && activeTab === 'my_analytics' && currentStudentMetric && (
            <div className="space-y-6">
              {/* Personal Solved Banner */}
              <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6 mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
                      <User className="w-3.5 h-3.5" /> MY PERSONAL CODING ANALYTICS
                    </div>
                    <h2 className="text-2xl font-black text-white">{currentStudentMetric.studentName}</h2>
                    <p className="text-xs text-slate-400 font-mono mt-1">Reg: {currentStudentMetric.registerNumber} • Mentor: {currentStudentMetric.mentorName}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-black text-center">
                      <div className="text-xl">{currentStudentMetric.totalSolved}</div>
                      <div className="text-[10px] font-extrabold uppercase text-emerald-300">Total Solved</div>
                    </div>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 font-black text-center">
                      <div className="text-xl">⚡ {currentStudentMetric.xp}</div>
                      <div className="text-[10px] font-extrabold uppercase text-amber-300">Total XP</div>
                    </div>
                  </div>
                </div>

                {/* Platform Links Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {[
                    { key: 'leetcode', name: 'LeetCode', icon: '🟡', val: currentStudentMetric.profileLinks?.leetcode },
                    { key: 'codechef', name: 'CodeChef', icon: '🟤', val: currentStudentMetric.profileLinks?.codechef },
                    { key: 'codeforces', name: 'Codeforces', icon: '🔴', val: currentStudentMetric.profileLinks?.codeforces }
                  ].map(({ key, name, icon, val }) => (
                    <div key={key} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <span>{icon}</span> {name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {val ? `@${val.split('/').filter(Boolean).pop()}` : 'Profile Not Linked'}
                        </div>
                      </div>
                      {val ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Connected ✅</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-full">Profile Not Linked</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Difficulty Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" /> My Difficulty Distribution
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                          <span className="text-emerald-400">Easy ({currentStudentMetric.difficultyDistribution?.easy || 0})</span>
                          <span>{currentStudentMetric.totalSolved > 0 ? Math.round(((currentStudentMetric.difficultyDistribution?.easy || 0)/currentStudentMetric.totalSolved)*100) : 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${currentStudentMetric.totalSolved > 0 ? ((currentStudentMetric.difficultyDistribution?.easy || 0)/currentStudentMetric.totalSolved)*100 : 0}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                          <span className="text-amber-400">Medium ({currentStudentMetric.difficultyDistribution?.medium || 0})</span>
                          <span>{currentStudentMetric.totalSolved > 0 ? Math.round(((currentStudentMetric.difficultyDistribution?.medium || 0)/currentStudentMetric.totalSolved)*100) : 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${currentStudentMetric.totalSolved > 0 ? ((currentStudentMetric.difficultyDistribution?.medium || 0)/currentStudentMetric.totalSolved)*100 : 0}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                          <span className="text-rose-400">Hard ({currentStudentMetric.difficultyDistribution?.hard || 0})</span>
                          <span>{currentStudentMetric.totalSolved > 0 ? Math.round(((currentStudentMetric.difficultyDistribution?.hard || 0)/currentStudentMetric.totalSolved)*100) : 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${currentStudentMetric.totalSolved > 0 ? ((currentStudentMetric.difficultyDistribution?.hard || 0)/currentStudentMetric.totalSolved)*100 : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badges Unlocked */}
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-400" /> My Badges & Milestones
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentStudentMetric.badges && currentStudentMetric.badges.length > 0 ? (
                        currentStudentMetric.badges.map((b, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400" /> {b}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400">Keep solving problems to unlock your first badge!</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isStaff && activeTab === 'my_contests' && (
            <ContestsTracker contests={contestsList} />
          )}

          {!isStaff && activeTab === 'my_profile' && currentStudentMetric && (
            <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl max-w-2xl mx-auto">
              <h2 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-400" /> Registered Coding Profile Links
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Update your official profile URLs below and click "Save & Sync Platform Links" to immediately fetch your latest problem-solving stats.
              </p>

              {profileFormMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{profileFormMessage}</span>
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                setSavingProfileForm(true);
                try {
                  const mergedLinks = {
                    ...(currentStudentMetric?.profileLinks || {}),
                    ...profileForm
                  };
                  await handleUpdateLinks(currentRegNo, mergedLinks);
                  await handleSyncStudent(currentRegNo);
                  setProfileFormMessage('Profile links saved and live analytics refreshed successfully!');
                  setTimeout(() => setProfileFormMessage(''), 4000);
                } catch (err) {
                  alert('Failed to save profile links');
                } finally {
                  setSavingProfileForm(false);
                }
              }} className="space-y-4">
                {[
                  { key: 'leetcode', name: 'LeetCode', icon: '🟡', req: true, ph: 'https://leetcode.com/u/username/' },
                  { key: 'codechef', name: 'CodeChef', icon: '🟤', req: true, ph: 'https://www.codechef.com/users/username' },
                  { key: 'codeforces', name: 'Codeforces', icon: '🔴', req: true, ph: 'https://codeforces.com/profile/username' },
                  { key: 'atcoder', name: 'AtCoder', icon: '⚫', req: false, ph: 'https://atcoder.jp/users/username' },
                  { key: 'codolio', name: 'Codolio', icon: '🟣', req: false, ph: 'https://codolio.com/profile/username' },
                  { key: 'github', name: 'GitHub', icon: '🐙', req: false, ph: 'https://github.com/username' }
                ].map(({ key, name, icon, req, ph }) => {
                  const val = profileForm?.[key as keyof PlatformLinks] || currentStudentMetric.profileLinks?.[key as keyof PlatformLinks] || '';
                  return (
                    <div key={key} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                          <span>{icon} {name}</span>
                          {req && <span className="text-red-400 text-[10px]">* REQUIRED</span>}
                        </label>
                        {val && (
                          <a href={val.startsWith('http') ? val : `https://${key}.com/${val}`} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 font-mono font-bold flex items-center gap-1 hover:underline">
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                        placeholder={ph}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  );
                })}

                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <button
                    type="submit"
                    disabled={savingProfileForm || globalSyncing}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-lg hover:from-emerald-500 hover:to-teal-500 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${savingProfileForm || globalSyncing ? 'animate-spin' : ''}`} />
                    <span>{savingProfileForm ? 'Saving & Syncing...' : 'Save & Sync Platform Links'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStudent(currentStudentMetric)}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg hover:from-blue-500 hover:to-indigo-500 cursor-pointer"
                  >
                    Open Detailed Analytics Modal
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      )}

      {/* Profile Modal */}
      {selectedStudent && (
        <StudentAnalyticsProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onUpdateLinks={handleUpdateLinks}
          onSyncStudent={handleSyncStudent}
        />
      )}

      {/* Real Data Sync Progress Modal */}
      <SyncProgressModal
        isOpen={showSyncModal}
        currentStep={syncModalStep}
        errorMessage={syncModalError}
        targetStudentName={syncModalStudentName}
        onClose={() => setShowSyncModal(false)}
      />
    </div>
  );
}
