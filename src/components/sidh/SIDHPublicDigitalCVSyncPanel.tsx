import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  ExternalLink,
  RefreshCw,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  Award,
  Users,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Check,
  X,
  FileText,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  History,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  SIDHPublicStudentData,
  SIDHPublicCourseRecord,
  SIDHPublicSyncHistoryRecord,
  SIDHPublicSyncMetrics
} from '../../types';

interface SIDHPublicDigitalCVSyncPanelProps {
  onSyncSuccess?: () => void;
  onNavigateTab?: (tab: string) => void;
  initialRegNumber?: string;
  isStaff?: boolean;
}

export const SIDHPublicDigitalCVSyncPanel: React.FC<SIDHPublicDigitalCVSyncPanelProps> = ({
  onSyncSuccess,
  onNavigateTab,
  initialRegNumber,
  isStaff = true
}) => {
  // Input State
  const [profileUrl, setProfileUrl] = useState('');
  const [studentRegisterNumber, setStudentRegisterNumber] = useState(initialRegNumber || '');
  const [verifying, setVerifying] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Result State
  const [activeResult, setActiveResult] = useState<{
    success: boolean;
    verificationResult: 'VERIFIED' | 'PRIVATE_OR_AUTH_REQUIRED' | 'UNAVAILABLE' | 'NO_COURSES' | 'INVALID_URL';
    statusBadge: string;
    httpStatus: number;
    message: string;
    student?: SIDHPublicStudentData;
    courses?: SIDHPublicCourseRecord[];
    certificates?: any[];
    changesDetected?: any[];
    syncRecord?: SIDHPublicSyncHistoryRecord;
  } | null>(null);

  // Bulk Sync State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkUrlsInput, setBulkUrlsInput] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState<any[] | null>(null);

  // User-Controlled Sync State (DOM/Text fallback)
  const [showUserControlledSync, setShowUserControlledSync] = useState(false);
  const [userControlledHtml, setUserControlledHtml] = useState('');
  const [userControlledLoading, setUserControlledLoading] = useState(false);

  // Dashboard & History State
  const [metrics, setMetrics] = useState<SIDHPublicSyncMetrics>({
    totalProfilesVerified: 0,
    totalCoursesFound: 0,
    registeredCourses: 0,
    inProgressCourses: 0,
    completedCourses: 0,
    certificatesAvailable: 0,
    verificationErrors: 0
  });
  const [allVerifiedCourses, setAllVerifiedCourses] = useState<SIDHPublicCourseRecord[]>([]);
  const [syncHistory, setSyncHistory] = useState<SIDHPublicSyncHistoryRecord[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Table Filters
  const [courseSearch, setCourseSearch] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState('ALL');
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'verify' | 'courses' | 'history'>('verify');

  // Load Dashboard Data
  const loadSyncData = async () => {
    try {
      setLoadingDashboard(true);
      const res = await fetch('/api/sidh/public-sync-data');
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) setMetrics(data.metrics);
        if (data.courses) setAllVerifiedCourses(data.courses);
        if (data.history) setSyncHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to load public sync data:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    loadSyncData();
  }, []);

  // Validation function
  const validateUrlInput = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('Please enter a SIDH Public Digital CV URL.');
      return false;
    }
    const trimmed = url.trim().toLowerCase();
    if (!trimmed.includes('skillindiadigital.gov.in')) {
      setUrlError('Invalid SIDH Public URL. URL must belong to skillindiadigital.gov.in (e.g. https://www.skillindiadigital.gov.in/user/digital-cv-preview/public/...)');
      return false;
    }
    setUrlError(null);
    return true;
  };

  // Handle Single URL Verification & Sync
  const handleVerifyPublicCV = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateUrlInput(profileUrl)) return;

    setVerifying(true);
    setActiveResult(null);

    try {
      const response = await fetch('/api/sidh/verify-public-digital-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileUrl: profileUrl.trim(),
          studentRegisterNumber: studentRegisterNumber.trim() || undefined
        })
      });

      const data = await response.json();
      setActiveResult(data);

      if (data.success) {
        loadSyncData();
        if (onSyncSuccess) onSyncSuccess();
      }
    } catch (err: any) {
      setActiveResult({
        success: false,
        verificationResult: 'UNAVAILABLE',
        statusBadge: 'PRIVATE / UNVERIFIED',
        httpStatus: 0,
        message: 'SIDH Public Profile Could Not Be Reached',
      });
    } finally {
      setVerifying(false);
    }
  };

  // Handle User-Controlled Public Sync (Pasting Public HTML/Text)
  const handleUserControlledSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrlInput(profileUrl)) return;
    if (!userControlledHtml.trim()) {
      alert('Please paste the publicly visible page content from your browser tab.');
      return;
    }

    setUserControlledLoading(true);
    setActiveResult(null);

    try {
      const response = await fetch('/api/sidh/user-controlled-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileUrl: profileUrl.trim(),
          rawPublicHtmlOrText: userControlledHtml,
          studentRegisterNumber: studentRegisterNumber.trim() || undefined
        })
      });

      const data = await response.json();
      setActiveResult(data);

      if (data.success) {
        setShowUserControlledSync(false);
        setUserControlledHtml('');
        loadSyncData();
        if (onSyncSuccess) onSyncSuccess();
      }
    } catch (err: any) {
      alert('Failed to process public page text: ' + err.message);
    } finally {
      setUserControlledLoading(false);
    }
  };

  // Handle Bulk URLs Verification
  const handleBulkSync = async () => {
    const rawLines = bulkUrlsInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (rawLines.length === 0) {
      alert('Please paste at least one SIDH Public URL.');
      return;
    }

    setBulkProcessing(true);
    setBulkProgress({ current: 0, total: rawLines.length });
    setBulkResults(null);

    try {
      const response = await fetch('/api/sidh/verify-public-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: rawLines })
      });

      const data = await response.json();
      if (data.results) {
        setBulkResults(data.results);
        loadSyncData();
        if (onSyncSuccess) onSyncSuccess();
      }
    } catch (err: any) {
      alert('Bulk sync error: ' + err.message);
    } finally {
      setBulkProcessing(false);
    }
  };

  // Export 3-Sheet Excel
  const handleExportExcel = () => {
    if (allVerifiedCourses.length === 0 && (!activeResult || !activeResult.courses || activeResult.courses.length === 0)) {
      alert('No verified public course records available to export.');
      return;
    }

    const coursesToExport = allVerifiedCourses.length > 0 ? allVerifiedCourses : (activeResult?.courses || []);

    // Sheet 1: Students
    const studentMap: Record<string, any> = {};
    coursesToExport.forEach(c => {
      const key = c.registrationId || c.studentName;
      if (!studentMap[key]) {
        studentMap[key] = {
          'Student Name': c.studentName || 'Not Available',
          'SIDH Profile ID': c.sidhProfileId || 'Not Available',
          'Registration ID': c.registrationId || 'Not Available',
          'Public Digital CV URL': c.sourceUrl || 'Not Available',
          'Last Verified': c.verifiedAt ? new Date(c.verifiedAt).toLocaleString() : 'Not Available'
        };
      }
    });
    const studentsSheetData = Object.values(studentMap);

    // Sheet 2: Courses
    const coursesSheetData = coursesToExport.map(c => ({
      'Student Name': c.studentName || 'Not Available',
      'Registration ID': c.registrationId || 'Not Available',
      'Course Name': c.courseName || 'Not Available',
      'Course ID': c.courseId || 'Not Available',
      'Provider': c.provider || 'Skill India Digital Hub',
      'Status': c.status || 'In Progress',
      'Progress': c.progress || 'Not Available',
      'Completion Date': c.completionDate || 'Not Available',
      'Certificate Status': c.certificateStatus || 'Not Available',
      'Certificate ID': c.certificateId || 'Not Available',
      'Source URL': c.sourceUrl || 'Not Available',
      'Verification Status': c.verificationStatus || 'VERIFIED'
    }));

    // Sheet 3: Certificates
    const certsSheetData = coursesToExport
      .filter(c => c.certificateStatus === 'Available' || (c.certificateId && c.certificateId !== 'Not Available'))
      .map(c => ({
        'Student Name': c.studentName || 'Not Available',
        'Course Name': c.courseName || 'Not Available',
        'Certificate ID': c.certificateId || `CERT-${c.courseId}`,
        'Issue Date': c.completionDate || 'Not Available',
        'Certificate URL': c.certificateUrl || c.sourceUrl || 'Not Available',
        'Verification Status': 'VERIFIED'
      }));

    const wb = XLSX.utils.book_new();

    const wsStudents = XLSX.utils.json_to_sheet(studentsSheetData.length > 0 ? studentsSheetData : [{ 'Status': 'No verified students' }]);
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Students');

    const wsCourses = XLSX.utils.json_to_sheet(coursesSheetData.length > 0 ? coursesSheetData : [{ 'Status': 'No verified courses' }]);
    XLSX.utils.book_append_sheet(wb, wsCourses, 'Courses');

    const wsCerts = XLSX.utils.json_to_sheet(certsSheetData.length > 0 ? certsSheetData : [{ 'Status': 'No verified certificates' }]);
    XLSX.utils.book_append_sheet(wb, wsCerts, 'Certificates');

    XLSX.writeFile(wb, `SIDH_Public_Digital_CV_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Filtered lists
  const filteredCourses = allVerifiedCourses.filter(c => {
    const matchSearch =
      (c.courseName?.toLowerCase() || '').includes(courseSearch.toLowerCase()) ||
      (c.studentName?.toLowerCase() || '').includes(courseSearch.toLowerCase()) ||
      (c.registrationId?.toLowerCase() || '').includes(courseSearch.toLowerCase()) ||
      (c.courseId?.toLowerCase() || '').includes(courseSearch.toLowerCase());

    const matchStatus =
      courseStatusFilter === 'ALL' ||
      (courseStatusFilter === 'COMPLETED' && c.status === 'Completed') ||
      (courseStatusFilter === 'IN_PROGRESS' && c.status === 'In Progress') ||
      (courseStatusFilter === 'REGISTERED' && c.status === 'Registered') ||
      (courseStatusFilter === 'CERTIFICATE' && (c.certificateStatus === 'Available' || c.status === 'Certificate Available'));

    return matchSearch && matchStatus;
  });

  const filteredHistory = syncHistory.filter(h => {
    const matchSearch =
      (h.publicUrl?.toLowerCase() || '').includes(historySearch.toLowerCase()) ||
      (h.studentName?.toLowerCase() || '').includes(historySearch.toLowerCase()) ||
      (h.registrationId?.toLowerCase() || '').includes(historySearch.toLowerCase());

    const matchStatus =
      historyStatusFilter === 'ALL' ||
      (historyStatusFilter === 'VERIFIED' && h.statusBadge === 'VERIFIED PUBLIC SIDH DATA') ||
      (historyStatusFilter === 'PRIVATE' && h.statusBadge === 'PRIVATE / UNVERIFIED') ||
      (historyStatusFilter === 'ERROR' && h.statusBadge === 'INVALID / ERROR');

    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. TOP METRICS & STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Profiles Verified</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">{metrics.totalProfilesVerified}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Public Digital CVs</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Courses</span>
            <BookOpen className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-300">{metrics.totalCoursesFound}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Verified on SIDH</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300">{metrics.completedCourses}</div>
          <div className="text-[10px] text-emerald-500/70 mt-0.5">100% Verified Finish</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Progress</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300">{metrics.inProgressCourses}</div>
          <div className="text-[10px] text-amber-500/70 mt-0.5">Active Learnings</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Certificates</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300">{metrics.certificatesAvailable}</div>
          <div className="text-[10px] text-purple-500/70 mt-0.5">Available & Verified</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Private / Errors</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-300">{metrics.verificationErrors}</div>
          <div className="text-[10px] text-rose-500/70 mt-0.5">Auth / Restricted</div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-900/60 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveSubTab('verify')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'verify'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify & Sync Digital CV</span>
          </button>

          <button
            onClick={() => setActiveSubTab('courses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'courses'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Verified Course Database ({allVerifiedCourses.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Sync History ({syncHistory.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Bulk Sync URLs</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export to Excel</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN TAB CONTENT: VERIFY & SYNC DIGITAL CV */}
      {activeSubTab === 'verify' && (
        <div className="space-y-6">
          {/* URL Input Form Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    PUBLIC DIGITAL CV SYNC
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    NO LOGIN REQUIRED
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-blue-400" /> Verify Public SIDH Digital CV
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Enter a public Skill India Digital Hub (SIDH) Digital CV URL. The verifier fetches only publicly accessible course and certificate records without requiring credentials or bypassing authentication.
                </p>
              </div>

              {/* Quick Sample Links helper */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Quick Test URL:</span>
                <button
                  type="button"
                  onClick={() => {
                    setProfileUrl('https://www.skillindiadigital.gov.in/user/digital-cv-preview/public/789a2b8e-991f-4f81-a3f1-7918a2099f6b');
                    setStudentRegisterNumber('23AD001');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-[11px] font-mono border border-slate-700 cursor-pointer"
                >
                  Public Sample 1
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileUrl('https://www.skillindiadigital.gov.in/user/digital-cv-preview/public/a198c4d2-3112-4211-92b2-88192a01bcde');
                    setStudentRegisterNumber('23AD002');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-mono border border-slate-700 cursor-pointer"
                >
                  Public Sample 2
                </button>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleVerifyPublicCV} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Public SIDH Digital CV URL <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      placeholder="https://www.skillindiadigital.gov.in/user/digital-cv-preview/public/..."
                      value={profileUrl}
                      onChange={(e) => {
                        setProfileUrl(e.target.value);
                        if (urlError) setUrlError(null);
                      }}
                      className={`w-full px-4 py-3 rounded-xl bg-slate-950 border text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors ${
                        urlError ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-blue-500'
                      }`}
                    />
                  </div>
                  {urlError && (
                    <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{urlError}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Student Register Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 23AD001 (Auto-matches)"
                    value={studentRegisterNumber}
                    onChange={(e) => setStudentRegisterNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <span>Only public elements are parsed. Missing fields will be marked "Not Available".</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowUserControlledSync(!showUserControlledSync)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Dynamic Page Sync Assistant</span>
                  </button>

                  <button
                    type="submit"
                    disabled={verifying || !profileUrl.trim()}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-900/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {verifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Public SIDH Page...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Sync Public Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* User-Controlled Fallback Assistant */}
            {showUserControlledSync && (
              <div className="mt-4 p-5 rounded-2xl bg-indigo-950/30 border border-indigo-800/60 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-indigo-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" /> User-Controlled Public Page Sync
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      If the public SIDH page uses dynamic single-page rendering or client-side hydration, you can open the public link in your browser, copy the rendered text/content (no login or cookies needed), and paste it below.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowUserControlledSync(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="font-bold text-indigo-300 block mb-1">Step 1: Open Link</span>
                    <a
                      href={profileUrl || 'https://www.skillindiadigital.gov.in'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      <span>Open SIDH Page in Tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="font-bold text-indigo-300 block mb-1">Step 2: Copy Content</span>
                    <span>Select all (Ctrl+A) and Copy (Ctrl+C) visible course records on the page.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="font-bold text-indigo-300 block mb-1">Step 3: Paste & Sync</span>
                    <span>Paste into the box below and click Sync Public Content.</span>
                  </div>
                </div>

                <form onSubmit={handleUserControlledSync} className="space-y-3">
                  <textarea
                    rows={4}
                    placeholder="Paste the publicly visible text or HTML content from the official SIDH page here..."
                    value={userControlledHtml}
                    onChange={(e) => setUserControlledHtml(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={userControlledLoading || !userControlledHtml.trim()}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {userControlledLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Parsing Public Content...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Sync Public Content</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* 4. VERIFICATION RESULT BANNER & DETAILS */}
          {activeResult && (
            <div className="space-y-6">
              {/* Error or Private Banner */}
              {activeResult.verificationResult === 'PRIVATE_OR_AUTH_REQUIRED' ? (
                <div className="p-6 rounded-3xl bg-rose-950/40 border-2 border-rose-800/80 text-rose-100 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-400" /> PRIVATE / UNVERIFIED
                      </span>
                      <span className="text-xs font-bold text-rose-300/80">HTTP 401/403 or Login Restricted</span>
                    </div>
                    <span className="text-xs text-rose-400 font-mono">Status: Private Page</span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-white">
                      Unable to verify public SIDH data. The provided page is private or requires authentication.
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Skill India Digital Hub restricts access to private profile dashboards to protect student privacy. SC SkillTrack does NOT bypass logins or store credentials.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('import')}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Import Official SIDH Export</span>
                    </button>
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('proof')}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold shadow-lg flex items-center gap-2 cursor-pointer transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Upload Official Proof</span>
                    </button>
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4 text-indigo-400" />
                      <span>Open Link in Browser</span>
                    </a>
                  </div>
                </div>
              ) : activeResult.verificationResult === 'UNAVAILABLE' || activeResult.verificationResult === 'INVALID_URL' ? (
                <div className="p-6 rounded-3xl bg-amber-950/30 border border-amber-800/80 text-amber-100 shadow-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> SIDH Public Profile Could Not Be Reached
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeResult.message || 'The SIDH server did not respond or returned a non-success status code.'} Please verify the link format or try the User-Controlled Dynamic Page Sync assistant.
                  </p>
                </div>
              ) : (
                /* Success Banner */
                <div className="p-6 rounded-3xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-100 shadow-2xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/60">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> VERIFIED PUBLIC SIDH DATA
                      </span>
                      <span className="text-xs font-mono text-emerald-300/80">HTTP 200 OK</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <span>Verified: {new Date().toLocaleTimeString()}</span>
                      <a
                        href={profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <span>Source URL</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {activeResult.message}
                    </h3>
                  </div>

                  {/* Change Detection Notice */}
                  {activeResult.changesDetected && activeResult.changesDetected.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-2">
                      <div className="text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-400" /> Live Sync Updates & Change Detection ({activeResult.changesDetected.length})
                      </div>
                      <div className="space-y-1.5">
                        {activeResult.changesDetected.map((ch, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs font-mono text-slate-200">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/20 text-indigo-300">
                              {ch.title}
                            </span>
                            <span>{ch.details}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extracted Student Summary Card */}
                  {activeResult.student && (
                    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 space-y-4">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" /> Extracted Student Identity & Profile Fields
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <span className="text-[11px] font-bold text-slate-500 block mb-1">Student Name</span>
                          <div className="font-bold text-sm text-white flex items-center justify-between gap-1">
                            <span className="truncate">{activeResult.student.studentName.value}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              activeResult.student.studentName.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {activeResult.student.studentName.status}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <span className="text-[11px] font-bold text-slate-500 block mb-1">Registration ID</span>
                          <div className="font-mono font-bold text-sm text-blue-300 flex items-center justify-between gap-1">
                            <span>{activeResult.student.registrationId.value}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              activeResult.student.registrationId.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {activeResult.student.registrationId.status}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <span className="text-[11px] font-bold text-slate-500 block mb-1">SIDH Profile ID</span>
                          <div className="font-mono font-bold text-xs text-indigo-300 flex items-center justify-between gap-1">
                            <span className="truncate">{activeResult.student.sidhProfileId.value}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              activeResult.student.sidhProfileId.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {activeResult.student.sidhProfileId.status}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <span className="text-[11px] font-bold text-slate-500 block mb-1">Institution</span>
                          <div className="font-bold text-xs text-slate-300 flex items-center justify-between gap-1">
                            <span className="truncate">{activeResult.student.institution?.value || 'Not Available'}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              activeResult.student.institution?.status === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {activeResult.student.institution?.status || 'NOT AVAILABLE'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Skills & Achievements if present */}
                      {(activeResult.student.skills.length > 0 || activeResult.student.qualifications.length > 0) && (
                        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400">Public Skills & Tags:</span>
                          {activeResult.student.skills.map((skill, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs font-semibold">
                              {skill}
                            </span>
                          ))}
                          {activeResult.student.qualifications.map((q, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-semibold">
                              {q}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Extracted Course Records Table */}
                  {activeResult.courses && activeResult.courses.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-emerald-400" /> Extracted Verified Course Records ({activeResult.courses.length})
                        </h4>
                        <span className="text-xs font-bold text-emerald-400">
                          {activeResult.courses.filter(c => c.status === 'Completed').length} Completed
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                            <tr>
                              <th className="p-3.5">Course Name</th>
                              <th className="p-3.5">Provider</th>
                              <th className="p-3.5 text-center">Status</th>
                              <th className="p-3.5 text-center">Progress</th>
                              <th className="p-3.5">Completion Date</th>
                              <th className="p-3.5 text-center">Certificate</th>
                              <th className="p-3.5 text-center">Verification</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                            {activeResult.courses.map((course, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-3.5">
                                  <div className="font-bold text-white text-xs">{course.courseName}</div>
                                  {course.courseId && course.courseId !== 'Not Available' && (
                                    <div className="font-mono text-[10px] text-slate-500">ID: {course.courseId}</div>
                                  )}
                                </td>
                                <td className="p-3.5 text-slate-300">{course.provider || 'Skill India Digital Hub'}</td>
                                <td className="p-3.5 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                    course.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                    course.status === 'In Progress' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                    course.status === 'Registered' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                    'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  }`}>
                                    {course.status}
                                  </span>
                                </td>
                                <td className="p-3.5 text-center font-mono font-bold text-slate-200">
                                  {course.progress}
                                </td>
                                <td className="p-3.5 text-slate-300 font-semibold">{course.completionDate}</td>
                                <td className="p-3.5 text-center">
                                  {course.certificateStatus === 'Available' || (course.certificateId && course.certificateId !== 'Not Available') ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                      🏅 Available
                                    </span>
                                  ) : (
                                    <span className="text-slate-500 text-[11px]">Not Available</span>
                                  )}
                                </td>
                                <td className="p-3.5 text-center">
                                  <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    VERIFIED
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. VERIFIED COURSE DATABASE TAB */}
      {activeSubTab === 'courses' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" /> Verified SIDH Public Course Records Database
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                All records verified through public SIDH Digital CV profiles and user-controlled sync workflows.
              </p>
            </div>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Verified Database</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search course title, student name, registration ID, course ID..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={courseStatusFilter}
              onChange={(e) => setCourseStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">🟢 Completed</option>
              <option value="IN_PROGRESS">🟡 In Progress</option>
              <option value="REGISTERED">🔵 Registered</option>
              <option value="CERTIFICATE">🏅 Certificate Available</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 mt-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Student Name</th>
                  <th className="p-3.5">Register No</th>
                  <th className="p-3.5">Course Name</th>
                  <th className="p-3.5">Provider</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Progress</th>
                  <th className="p-3.5">Completion Date</th>
                  <th className="p-3.5 text-center">Certificate</th>
                  <th className="p-3.5 text-center">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-bold text-sm text-slate-300">No matching verified course records found.</p>
                      <p className="text-xs text-slate-500 mt-1">Paste an official SIDH Public Digital CV URL above to verify and sync.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCourses.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-white">{c.studentName || 'Not Available'}</td>
                      <td className="p-3.5 font-mono text-blue-300 font-semibold">{c.registrationId || 'Not Available'}</td>
                      <td className="p-3.5 font-semibold text-slate-200">{c.courseName}</td>
                      <td className="p-3.5 text-slate-400">{c.provider || 'Skill India Digital Hub'}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                          c.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          c.status === 'In Progress' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          c.status === 'Registered' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-200">{c.progress || 'Not Available'}</td>
                      <td className="p-3.5 text-slate-300 font-semibold">{c.completionDate || 'Not Available'}</td>
                      <td className="p-3.5 text-center">
                        {c.certificateStatus === 'Available' || (c.certificateId && c.certificateId !== 'Not Available') ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                            🏅 Available
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Not Available</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300">
                          VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SYNC HISTORY & AUDIT LOG TAB */}
      {activeSubTab === 'history' && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" /> Public Digital CV Sync History & Verification Log
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Audit trail of all public SIDH URL verification attempts, change logs, and access status.
              </p>
            </div>
            <button
              onClick={loadSyncData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingDashboard ? 'animate-spin' : ''}`} />
              <span>Refresh History</span>
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search history by URL, student name, registration ID..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={historyStatusFilter}
              onChange={(e) => setHistoryStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Outcomes</option>
              <option value="VERIFIED">🟢 Verified</option>
              <option value="PRIVATE">🔴 Private / Restricted</option>
              <option value="ERROR">🟡 Invalid / Error</option>
            </select>
          </div>

          {/* History Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 mt-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Student / Register No</th>
                  <th className="p-3.5">Public SIDH URL</th>
                  <th className="p-3.5 text-center">Courses</th>
                  <th className="p-3.5 text-center">Certificates</th>
                  <th className="p-3.5 text-center">Status Badge</th>
                  <th className="p-3.5">Details / Changes</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-bold text-sm text-slate-300">No sync history logs found.</p>
                      <p className="text-xs text-slate-500 mt-1">Verification attempts will be recorded here automatically.</p>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((h, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(h.syncedAt).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-bold text-white">
                        <div>{h.studentName || 'Unspecified'}</div>
                        {h.registrationId && (
                          <div className="font-mono text-[10px] text-blue-300 font-semibold">{h.registrationId}</div>
                        )}
                      </td>
                      <td className="p-3.5 max-w-xs truncate">
                        <a
                          href={h.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-slate-400 hover:text-blue-300 text-[11px] truncate block"
                        >
                          {h.publicUrl}
                        </a>
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-200">
                        {h.coursesDetected}
                      </td>
                      <td className="p-3.5 text-center font-bold text-purple-300">
                        {h.certificatesDetected}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          h.statusBadge === 'VERIFIED PUBLIC SIDH DATA' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          h.statusBadge === 'PRIVATE / UNVERIFIED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {h.statusBadge}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 text-xs">
                        {h.errorMessage ? (
                          <span className="text-rose-400 text-[11px] font-semibold">{h.errorMessage}</span>
                        ) : h.changesDetected && h.changesDetected.length > 0 ? (
                          <span className="text-indigo-300 text-[11px] font-bold">{h.changesDetected.length} update(s) synced</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Synced up to date</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => {
                            setProfileUrl(h.publicUrl);
                            if (h.registrationId) setStudentRegisterNumber(h.registrationId);
                            setActiveSubTab('verify');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Re-Sync
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. BULK SYNC MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-black text-white">Bulk SIDH Public Digital CV Sync</h3>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Paste multiple official SIDH public Digital CV URLs (one per line). The verifier will process and sync each public profile in sequence.
            </p>

            <textarea
              rows={6}
              placeholder="https://www.skillindiadigital.gov.in/user/digital-cv-preview/public/...\nhttps://www.skillindiadigital.gov.in/user/digital-cv-preview/public/..."
              value={bulkUrlsInput}
              onChange={(e) => setBulkUrlsInput(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />

            {bulkResults && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 max-h-48 overflow-y-auto space-y-2">
                <div className="text-xs font-bold text-slate-300">Bulk Verification Results:</div>
                {bulkResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/80">
                    <span className="font-mono text-slate-300 truncate max-w-xs">{r.profileUrl}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      r.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {r.success ? `${r.courses?.length || 0} Courses Verified` : 'Access Blocked / Private'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Close
              </button>

              <button
                type="button"
                disabled={bulkProcessing || !bulkUrlsInput.trim()}
                onClick={handleBulkSync}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {bulkProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Batch...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>Start Bulk Verification</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
