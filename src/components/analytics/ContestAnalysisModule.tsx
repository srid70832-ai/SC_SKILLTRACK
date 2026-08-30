import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Search, RefreshCw, Calendar, Filter, Download, FileSpreadsheet, 
  FileText, ExternalLink, Award, User, CheckCircle2, XCircle, AlertCircle, 
  Layers, BarChart3, ShieldCheck, Sparkles, X, Activity, Globe, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { verifyStudentIdentity, getVerifiedStudentName } from '../../lib/studentVerification';

export interface ContestRecord {
  id: string;
  contestId: string;
  contestName: string;
  contestDate: string; // "DD-MMM-YYYY" or "YYYY-MM-DD"
  rawTimestamp: number;
  platform: 'LeetCode' | 'CodeChef' | 'Codeforces' | 'AtCoder' | 'HackerRank' | string;
  studentName: string;
  registerNumber: string;
  mentorName: string;
  section: string;
  year: string;
  department: string;
  problemsSolved: number;
  totalProblems: number;
  score: string; // e.g. "3/4"
  rank: number | string;
  verdict: string;
  status: 'Participated' | 'Completed' | 'Qualified' | 'Winner' | string;
  profileUrl: string;
  contestUrl?: string;
  problemsAttempted?: number;
  acceptedProblems?: string[];
  wrongAttempts?: number;
  submissionTime?: string;
}

export interface PlatformSummary {
  platform: string;
  contests: number;
  students: number;
  problemsSolved: number;
}

interface FilterState {
  dateRange: 'All' | 'Today' | 'Yesterday' | 'Last 7 Days' | 'Last 30 Days' | 'Custom';
  customStartDate: string;
  customEndDate: string;
  platform: string;
  studentName: string;
  registerNumber: string;
  mentor: string;
  section: string;
  year: string;
  contestName: string;
}

const DEFAULT_FILTERS: FilterState = {
  dateRange: 'All',
  customStartDate: '',
  customEndDate: '',
  platform: 'All Platforms',
  studentName: '',
  registerNumber: '',
  mentor: 'All Mentors',
  section: 'All Sections',
  year: 'All Years',
  contestName: ''
};

// Utility to sanitize student names: Enforces verified student mapping across views and exports
export function sanitizeStudentName(rawName?: string, regNum?: string): string {
  return getVerifiedStudentName(rawName, regNum);
}

export default function ContestAnalysisModule() {
  // All records loaded from backend
  const [allRecords, setAllRecords] = useState<ContestRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form filter state (unapplied until user clicks "Apply Filters")
  const [formFilters, setFormFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Applied filter state (used to filter the visible contest records)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Modal for detailed student contest profile
  const [selectedRecord, setSelectedRecord] = useState<ContestRecord | null>(null);

  // Export progress indicator
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportingLabel, setExportingLabel] = useState<string>('');

  // Initial fetch on mount
  useEffect(() => {
    console.log('[SC DEBUG] Initial data load - ContestAnalysisModule');
    fetchContestData();
  }, []);

  // Fetch contest data ONCE from API with retry capability
  const fetchContestData = async (retries = 2) => {
    if (isLoading && allRecords.length > 0 && retries === 2) return;
    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/code-analytics/contest-analysis');
      if (!res.ok) {
        throw new Error(`Failed to fetch contest data (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data.records)) {
        // Sanitize records on client as defense-in-depth and remove unknown students
        const cleanRecords: ContestRecord[] = data.records
          .map((r: ContestRecord) => {
            const verified = verifyStudentIdentity({
              studentName: r.studentName,
              registerNumber: r.registerNumber,
              profileUrl: r.profileUrl
            });
            return {
              ...r,
              studentName: verified.verifiedName,
              registerNumber: verified.verifiedRegisterNumber
            };
          })
          .filter((r: ContestRecord) => 
            r.studentName && 
            r.studentName !== 'Unknown Student' && 
            !r.studentName.toLowerCase().includes('unknown') &&
            !/^\d+$/.test(r.studentName)
          );
        setAllRecords(cleanRecords);
      }
    } catch (err: any) {
      if (retries > 0) {
        console.warn(`[CONTEST ANALYSIS FETCH RETRY] Retrying... (${retries} left)`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return fetchContestData(retries - 1);
      }
      console.error('[CONTEST ANALYSIS FETCH ERROR]', err);
      setErrorMsg(err.message || 'Unable to load contest records.');
    } finally {
      setIsLoading(false);
    }
  };

  // Execute Apply Filters explicitly
  const handleApplyFilters = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    console.log('[SC DEBUG] Contest filter changed', formFilters);
    setAppliedFilters({ ...formFilters });
  };

  // Reset Filters
  const handleResetFilters = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setFormFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  // Refresh Data
  const handleRefreshData = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isLoading || isExporting) return;
    await fetchContestData();
  };

  // Filter logic applied ONLY against `appliedFilters`
  const filteredRecords = useMemo(() => {
    return allRecords.filter(record => {
      // 1. Platform Filter
      if (appliedFilters.platform !== 'All Platforms') {
        if (record.platform.toLowerCase() !== appliedFilters.platform.toLowerCase()) {
          return false;
        }
      }

      // 2. Student Name Filter
      if (appliedFilters.studentName.trim()) {
        const query = appliedFilters.studentName.trim().toLowerCase();
        if (!record.studentName.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 3. Register Number Filter
      if (appliedFilters.registerNumber.trim()) {
        const query = appliedFilters.registerNumber.trim().toLowerCase();
        if (!record.registerNumber.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 4. Mentor Filter
      if (appliedFilters.mentor !== 'All Mentors') {
        const query = appliedFilters.mentor.toLowerCase();
        if (!record.mentorName.toLowerCase().includes(query) && !query.includes(record.mentorName.toLowerCase())) {
          return false;
        }
      }

      // 5. Section Filter
      if (appliedFilters.section !== 'All Sections') {
        if (record.section.toLowerCase() !== appliedFilters.section.toLowerCase()) {
          return false;
        }
      }

      // 6. Year Filter
      if (appliedFilters.year !== 'All Years') {
        if (record.year.toLowerCase() !== appliedFilters.year.toLowerCase()) {
          return false;
        }
      }

      // 7. Contest Name Filter
      if (appliedFilters.contestName.trim()) {
        const query = appliedFilters.contestName.trim().toLowerCase();
        if (!record.contestName.toLowerCase().includes(query)) {
          return false;
        }
      }

      // 8. Date Range Filter
      if (appliedFilters.dateRange !== 'All') {
        const recDate = new Date(record.rawTimestamp || record.contestDate);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterdayStart = todayStart - 86400000;
        const last7Start = todayStart - 7 * 86400000;
        const last30Start = todayStart - 30 * 86400000;

        if (appliedFilters.dateRange === 'Today') {
          if (recDate.getTime() < todayStart) return false;
        } else if (appliedFilters.dateRange === 'Yesterday') {
          if (recDate.getTime() < yesterdayStart || recDate.getTime() >= todayStart) return false;
        } else if (appliedFilters.dateRange === 'Last 7 Days') {
          if (recDate.getTime() < last7Start) return false;
        } else if (appliedFilters.dateRange === 'Last 30 Days') {
          if (recDate.getTime() < last30Start) return false;
        } else if (appliedFilters.dateRange === 'Custom') {
          if (appliedFilters.customStartDate) {
            const startMs = new Date(appliedFilters.customStartDate).getTime();
            if (recDate.getTime() < startMs) return false;
          }
          if (appliedFilters.customEndDate) {
            const endMs = new Date(appliedFilters.customEndDate).getTime() + 86400000; // inclusive
            if (recDate.getTime() > endMs) return false;
          }
        }
      }

      return true;
    });
  }, [allRecords, appliedFilters]);

  // Derived Summary Metrics from currently filtered records
  const summary = useMemo(() => {
    const contestSet = new Set<string>();
    const studentSet = new Set<string>();
    let totalProblemsSolved = 0;

    let leetcodeSolved = 0;
    let codechefSolved = 0;
    let codeforcesSolved = 0;
    let atcoderSolved = 0;

    const platformMap: Record<string, { contests: Set<string>; students: Set<string>; solved: number }> = {
      LeetCode: { contests: new Set(), students: new Set(), solved: 0 },
      CodeChef: { contests: new Set(), students: new Set(), solved: 0 },
      Codeforces: { contests: new Set(), students: new Set(), solved: 0 },
      AtCoder: { contests: new Set(), students: new Set(), solved: 0 },
      HackerRank: { contests: new Set(), students: new Set(), solved: 0 }
    };

    filteredRecords.forEach(r => {
      contestSet.add(r.contestName);
      studentSet.add(r.registerNumber);
      totalProblemsSolved += (r.problemsSolved || 0);

      const plat = r.platform || 'LeetCode';
      if (plat === 'LeetCode') leetcodeSolved += (r.problemsSolved || 0);
      else if (plat === 'CodeChef') codechefSolved += (r.problemsSolved || 0);
      else if (plat === 'Codeforces') codeforcesSolved += (r.problemsSolved || 0);
      else if (plat === 'AtCoder') atcoderSolved += (r.problemsSolved || 0);

      if (!platformMap[plat]) {
        platformMap[plat] = { contests: new Set(), students: new Set(), solved: 0 };
      }
      platformMap[plat].contests.add(r.contestName);
      platformMap[plat].students.add(r.registerNumber);
      platformMap[plat].solved += (r.problemsSolved || 0);
    });

    const platformSummaries: PlatformSummary[] = Object.keys(platformMap).map(p => ({
      platform: p,
      contests: platformMap[p].contests.size,
      students: platformMap[p].students.size,
      problemsSolved: platformMap[p].solved
    }));

    return {
      totalContests: contestSet.size,
      totalStudents: studentSet.size,
      totalProblemsSolved,
      leetcodeSolved,
      codechefSolved,
      codeforcesSolved,
      atcoderSolved,
      platformSummaries
    };
  }, [filteredRecords]);

  // Unique list of contests for contest dropdown/cards
  const uniqueContests = useMemo(() => {
    const map = new Map<string, { name: string; date: string; platform: string; students: number; problems: number }>();
    filteredRecords.forEach(r => {
      if (!map.has(r.contestName)) {
        map.set(r.contestName, {
          name: r.contestName,
          date: r.contestDate,
          platform: r.platform,
          students: 1,
          problems: r.totalProblems || 4
        });
      } else {
        const curr = map.get(r.contestName)!;
        curr.students += 1;
      }
    });
    return Array.from(map.values());
  }, [filteredRecords]);

  // Helper for safe client-side file download using Blob
  const triggerSafeDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  // Export handlers (Exports ONLY currently filtered records)
  const exportToExcel = (targetPlatform: string = 'All') => {
    try {
      setIsExporting(true);
      setExportingLabel(`Preparing ${targetPlatform === 'All' ? 'Excel' : targetPlatform + ' Excel'}...`);
      console.log('[SC DEBUG] Excel export started', targetPlatform);

      let targetRecords = filteredRecords;
      if (targetPlatform !== 'All') {
        targetRecords = filteredRecords.filter(r => r.platform.toLowerCase() === targetPlatform.toLowerCase());
      }

      if (targetRecords.length === 0) {
        alert(`No ${targetPlatform === 'All' ? '' : targetPlatform + ' '}contest records match your current filters.`);
        setIsExporting(false);
        setExportingLabel('');
        return;
      }

      const excelData = targetRecords.map((r, idx) => ({
        'S.No': idx + 1,
        'Contest Date': r.contestDate,
        'Contest Name': r.contestName,
        'Platform': r.platform,
        'Student Name': sanitizeStudentName(r.studentName, r.registerNumber),
        'Register Number': r.registerNumber,
        'Mentor': r.mentorName,
        'Section': r.section,
        'Year': r.year,
        'Problems Solved': r.problemsSolved,
        'Total Problems': r.totalProblems,
        'Score': r.score,
        'Rank': r.rank,
        'Status': r.status,
        'Profile URL': r.profileUrl || 'No Profile'
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      const sheetName = targetPlatform === 'All' ? 'Contest Analysis' : `${targetPlatform} Contests`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const safeFilename = `SC_SkillTrack_${targetPlatform === 'All' ? 'Contest_Analysis' : targetPlatform + '_Contest_Report'}_${new Date().toISOString().split('T')[0]}.xlsx`;

      triggerSafeDownload(blob, safeFilename);
      console.log('[SC DEBUG] Excel export completed', safeFilename);
    } catch (err) {
      console.error('[EXCEL EXPORT ERROR]', err);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportingLabel('');
      }, 500);
    }
  };

  const exportToCSV = () => {
    try {
      setIsExporting(true);
      setExportingLabel('Preparing CSV...');
      console.log('[SC DEBUG] CSV export started');

      if (filteredRecords.length === 0) {
        alert('No contest records match your current filters.');
        setIsExporting(false);
        setExportingLabel('');
        return;
      }

      const headers = ['Contest Date', 'Contest Name', 'Platform', 'Student Name', 'Register Number', 'Mentor', 'Section', 'Year', 'Problems Solved', 'Total Problems', 'Score', 'Rank', 'Status', 'Profile URL'];
      
      const rows = filteredRecords.map(r => [
        `"${r.contestDate}"`,
        `"${r.contestName.replace(/"/g, '""')}"`,
        `"${r.platform}"`,
        `"${sanitizeStudentName(r.studentName, r.registerNumber).replace(/"/g, '""')}"`,
        `"${r.registerNumber}"`,
        `"${r.mentorName.replace(/"/g, '""')}"`,
        `"${r.section}"`,
        `"${r.year}"`,
        r.problemsSolved,
        r.totalProblems,
        `"${r.score}"`,
        `"${r.rank}"`,
        `"${r.status}"`,
        `"${r.profileUrl || 'No Profile'}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const safeFilename = `SC_SkillTrack_Contest_Analysis_${new Date().toISOString().split('T')[0]}.csv`;

      triggerSafeDownload(blob, safeFilename);
      console.log('[SC DEBUG] CSV export completed', safeFilename);
    } catch (err) {
      console.error('[CSV EXPORT ERROR]', err);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportingLabel('');
      }, 500);
    }
  };

  const exportToPDF = () => {
    try {
      setIsExporting(true);
      setExportingLabel('Preparing PDF...');
      console.log('[SC DEBUG] PDF export started');

      if (filteredRecords.length === 0) {
        alert('No contest records match your current filters.');
        setIsExporting(false);
        setExportingLabel('');
        return;
      }

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('SC SkillTrack AI - Contest Analysis Report', 40, 40);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString()} | Filtered Records: ${filteredRecords.length}`, 40, 58);

      const tableHeaders = [['Date', 'Contest', 'Platform', 'Student Name', 'Reg No', 'Mentor', 'Sec', 'Year', 'Solved', 'Score', 'Rank', 'Status']];
      const tableData = filteredRecords.map(r => [
        r.contestDate,
        r.contestName.length > 25 ? r.contestName.substring(0, 23) + '...' : r.contestName,
        r.platform,
        sanitizeStudentName(r.studentName, r.registerNumber),
        r.registerNumber,
        r.mentorName,
        r.section,
        r.year,
        `${r.problemsSolved}/${r.totalProblems}`,
        r.score,
        String(r.rank),
        r.status
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 75,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });

      const safeFilename = `SC_SkillTrack_Contest_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(safeFilename);
      console.log('[SC DEBUG] PDF export completed', safeFilename);
    } catch (err) {
      console.error('[PDF EXPORT ERROR]', err);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setExportingLabel('');
      }, 500);
    }
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white"
      >
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 text-white shadow-xl shadow-amber-500/20 shrink-0 border border-white/20">
              <Trophy className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Dedicated Contest Module
                </span>
                <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Academic Division
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display flex items-center gap-2">
                🏆 SC CONTEST ANALYSIS
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
                Track student performance across competitive programming contests. Strictly contest submissions only (practice submissions excluded).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end">
            <button
              type="button"
              onClick={handleRefreshData}
              disabled={isLoading || isExporting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchContestData(2)}
            className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-bold transition-all cursor-pointer shrink-0"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* 2. Top Summary Cards (Requirement 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Contests</div>
          <div className="text-xl font-black text-white mt-1 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            {summary.totalContests}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Participants</div>
          <div className="text-xl font-black text-blue-400 mt-1 flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-400" />
            {summary.totalStudents}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Solved</div>
          <div className="text-xl font-black text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {summary.totalProblemsSolved}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">LeetCode</div>
          <div className="text-xl font-black text-amber-300 mt-1">
            🟡 {summary.leetcodeSolved}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">CodeChef</div>
          <div className="text-xl font-black text-amber-600 mt-1">
            🟤 {summary.codechefSolved}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Codeforces</div>
          <div className="text-xl font-black text-rose-400 mt-1">
            🔴 {summary.codeforcesSolved}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">AtCoder</div>
          <div className="text-xl font-black text-cyan-400 mt-1">
            ⚪ {summary.atcoderSolved}
          </div>
        </div>
      </div>

      {/* 3. Platform Contest Summary (Requirement 10) */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" /> Platform Contest Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {summary.platformSummaries.map((p) => (
            <div key={p.platform} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  {p.platform === 'LeetCode' && '🟡'}
                  {p.platform === 'CodeChef' && '🟤'}
                  {p.platform === 'Codeforces' && '🔴'}
                  {p.platform === 'AtCoder' && '⚪'}
                  {p.platform === 'HackerRank' && '🟢'}
                  <span>{p.platform}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {p.contests} Contests • {p.students} Students
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-300 border border-blue-500/20">
                {p.problemsSolved} Solved
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Filters Section (Requirement 2 & 3 - No auto reload on change) */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-white">Contest Filters</h2>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
              Explicit Trigger Only
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Date Range */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Date Range</label>
            <select
              value={formFilters.dateRange}
              onChange={(e) => setFormFilters({ ...formFilters, dateRange: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Pickers */}
          {formFilters.dateRange === 'Custom' && (
            <>
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formFilters.customStartDate}
                  onChange={(e) => setFormFilters({ ...formFilters, customStartDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={formFilters.customEndDate}
                  onChange={(e) => setFormFilters({ ...formFilters, customEndDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </>
          )}

          {/* Platform */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Platform</label>
            <select
              value={formFilters.platform}
              onChange={(e) => setFormFilters({ ...formFilters, platform: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All Platforms">All Platforms</option>
              <option value="LeetCode">LeetCode</option>
              <option value="CodeChef">CodeChef</option>
              <option value="Codeforces">Codeforces</option>
              <option value="AtCoder">AtCoder</option>
              <option value="HackerRank">HackerRank</option>
            </select>
          </div>

          {/* Student Name */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Student Name</label>
            <input
              type="text"
              placeholder="Search Student..."
              value={formFilters.studentName}
              onChange={(e) => setFormFilters({ ...formFilters, studentName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Register Number */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Register Number</label>
            <input
              type="text"
              placeholder="711525BAD..."
              value={formFilters.registerNumber}
              onChange={(e) => setFormFilters({ ...formFilters, registerNumber: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Mentor */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Mentor</label>
            <select
              value={formFilters.mentor}
              onChange={(e) => setFormFilters({ ...formFilters, mentor: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All Mentors">All Mentors</option>
              <option value="Mrs.V.Prema">Mrs. V. Prema</option>
              <option value="Mrs.B.Padmapriya">Mrs. B. Padmapriya</option>
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Section</label>
            <select
              value={formFilters.section}
              onChange={(e) => setFormFilters({ ...formFilters, section: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All Sections">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Year</label>
            <select
              value={formFilters.year}
              onChange={(e) => setFormFilters({ ...formFilters, year: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="All Years">All Years</option>
              <option value="I">Year I</option>
              <option value="II">Year II</option>
              <option value="III">Year III</option>
              <option value="IV">Year IV</option>
            </select>
          </div>

          {/* Contest Name */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Contest Name</label>
            <input
              type="text"
              placeholder="e.g. Weekly Contest 465..."
              value={formFilters.contestName}
              onChange={(e) => setFormFilters({ ...formFilters, contestName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 font-medium">
            Showing <span className="text-amber-400 font-bold">{filteredRecords.length}</span> of {allRecords.length} contest records
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={isLoading || isExporting}
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:scale-105 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>APPLY FILTERS</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Contests List Grid */}
      {uniqueContests.length > 0 && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" /> Filtered Contests Overview ({uniqueContests.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {uniqueContests.map((c) => (
              <div key={c.name} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 transition-all">
                <div className="flex justify-between items-start gap-2">
                  <div className="font-bold text-white text-sm line-clamp-1">{c.name}</div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
                    {c.platform}
                  </span>
                </div>

                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>📅 {c.date}</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-800/60">
                  <span className="text-slate-300">{c.students} Students • {c.problems} Problems</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setFormFilters({ ...formFilters, contestName: c.name });
                      setAppliedFilters({ ...appliedFilters, contestName: c.name });
                    }}
                    className="text-amber-400 hover:underline text-[11px] font-bold cursor-pointer"
                  >
                    View Analysis →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Student Contest Performance Table (Requirement 6 & 11) */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>STUDENT CONTEST PERFORMANCE TABLE</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any student row to view full contest breakdown and problem details.
            </p>
          </div>

          {/* Separate Export Options (Requirement 8 - Platform Specific & Safe Download) */}
          <div className="flex flex-wrap items-center gap-2">
            {isExporting && (
              <span className="text-xs font-bold text-amber-400 animate-pulse bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 mr-1">
                ⏳ {exportingLabel}
              </span>
            )}

            {/* All Contests Excel */}
            <button
              type="button"
              disabled={isExporting}
              onClick={() => exportToExcel('All')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Export all filtered contest records to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel</span>
            </button>

            {/* LeetCode Excel */}
            <button
              type="button"
              disabled={isExporting}
              onClick={() => exportToExcel('LeetCode')}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="Export ONLY LeetCode contest records"
            >
              <span>🟡 LeetCode</span>
            </button>

            {/* Codeforces Excel */}
            <button
              type="button"
              disabled={isExporting}
              onClick={() => exportToExcel('Codeforces')}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="Export ONLY Codeforces contest records"
            >
              <span>🔴 Codeforces</span>
            </button>

            {/* CodeChef Excel */}
            <button
              type="button"
              disabled={isExporting}
              onClick={() => exportToExcel('CodeChef')}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 hover:bg-orange-500/30 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="Export ONLY CodeChef contest records"
            >
              <span>🟤 CodeChef</span>
            </button>

            {/* AtCoder Excel */}
            <button
              type="button"
              disabled={isExporting}
              onClick={() => exportToExcel('AtCoder')}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="Export ONLY AtCoder contest records"
            >
              <span>⚪ AtCoder</span>
            </button>

            {/* CSV Export */}
            <button
              type="button"
              disabled={isExporting}
              onClick={exportToCSV}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Export filtered records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>CSV</span>
            </button>

            {/* PDF Export */}
            <button
              type="button"
              disabled={isExporting}
              onClick={exportToPDF}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Export filtered records to PDF"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Contest</th>
                <th className="py-3 px-3">Platform</th>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Register Number</th>
                <th className="py-3 px-3">Mentor</th>
                <th className="py-3 px-3 text-center">Sec</th>
                <th className="py-3 px-3 text-center">Yr</th>
                <th className="py-3 px-3 text-center">Solved</th>
                <th className="py-3 px-3 text-center">Total</th>
                <th className="py-3 px-3 text-center">Score</th>
                <th className="py-3 px-3 text-center">Rank</th>
                <th className="py-3 px-3 text-center">Verdict</th>
                <th className="py-3 px-3 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.map((r) => {
                const isWinner = r.status === 'Winner' || r.rank === 1;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedRecord(r)}
                    className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{r.contestDate}</td>
                    <td className="py-3 px-3 font-bold text-white group-hover:text-amber-300 transition-colors">
                      {r.contestName}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 border border-slate-700 text-amber-300">
                        {r.platform}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                      {/* Requirement 11: Never display pure numeric string as name */}
                      {sanitizeStudentName(r.studentName, r.registerNumber)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-400 whitespace-nowrap">{r.registerNumber}</td>
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">{r.mentorName}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-300">{r.section}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-300">{r.year}</td>
                    <td className="py-3 px-3 text-center font-black text-emerald-400">{r.problemsSolved}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{r.totalProblems}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-amber-300">{r.score}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isWinner ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        #{r.rank}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {r.verdict || r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {r.profileUrl && r.profileUrl !== 'No Profile' ? (
                        <a
                          href={r.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          <span>Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500">No Profile</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Trophy className="w-8 h-8 text-slate-600 animate-pulse" />
                      <p className="text-sm font-bold text-white">No contest records match your selected filters.</p>
                      <p className="text-xs text-slate-500">Click "Clear Filters" or adjust your filter selection above.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Contest-Wise Student Profile Modal (Requirement 8) */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Student Header */}
              <div className="flex items-start gap-4 border-b border-slate-800 pb-5">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{sanitizeStudentName(selectedRecord.studentName, selectedRecord.registerNumber)}</h3>
                  <div className="flex flex-wrap gap-2 mt-1.5 text-xs font-mono font-bold">
                    <span className="bg-slate-800 text-blue-400 px-2.5 py-0.5 rounded-md border border-slate-700">Reg: {selectedRecord.registerNumber}</span>
                    <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-700">{selectedRecord.department} - Year {selectedRecord.year} - Sec {selectedRecord.section}</span>
                    <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-700">Mentor: {selectedRecord.mentorName}</span>
                  </div>
                </div>
              </div>

              {/* Contest Performance Card */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider">Official Contest Record</span>
                    <h4 className="text-base font-black text-white mt-0.5">{selectedRecord.contestName}</h4>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {selectedRecord.platform}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400">Problems Solved</div>
                    <div className="text-lg font-black text-emerald-400 mt-1">{selectedRecord.problemsSolved} / {selectedRecord.totalProblems}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400">Score</div>
                    <div className="text-lg font-black text-amber-300 mt-1">{selectedRecord.score}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400">Rank</div>
                    <div className="text-lg font-black text-blue-400 mt-1">#{selectedRecord.rank}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400">Status</div>
                    <div className="text-lg font-black text-cyan-300 mt-1">{selectedRecord.status}</div>
                  </div>
                </div>

                {/* Additional Performance Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300 font-medium">
                  <div>📅 Contest Date: <span className="font-bold text-white">{selectedRecord.contestDate}</span></div>
                  <div>⏱️ Submission Time: <span className="font-bold text-white">{selectedRecord.submissionTime || 'During Contest Window'}</span></div>
                  <div>🎯 Problems Attempted: <span className="font-bold text-white">{selectedRecord.problemsAttempted || selectedRecord.problemsSolved || 1}</span></div>
                  <div>❌ Wrong Attempts: <span className="font-bold text-rose-400">{selectedRecord.wrongAttempts || 0}</span></div>
                </div>

                {/* Accepted Problems List */}
                {selectedRecord.acceptedProblems && selectedRecord.acceptedProblems.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400 mb-2">Accepted Problems in Contest</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.acceptedProblems.map((p, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Link Footer */}
              <div className="flex items-center justify-between pt-2">
                {selectedRecord.profileUrl && selectedRecord.profileUrl !== 'No Profile' ? (
                  <a
                    href={selectedRecord.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all"
                  >
                    <span>Open Verified Student Profile</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <div className="text-xs text-slate-500 italic text-center w-full">
                    No verified profile URL linked for this student on {selectedRecord.platform}.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
