import React, { useState, useEffect } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  Eye,
  Lock,
  Terminal,
  Layers,
  Database,
  GraduationCap,
  ClipboardCheck,
  ClipboardPaste,
  Download,
  Calendar,
  User,
  BookOpen,
  Bug,
  Info,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  extractVisibleSIDHDOM,
  validateExtractedSidhData,
  validateSidhStandardPayload,
  generateSidhBrowserBridgeScript,
  ExtractedSIDHProfilePayload,
  SidhStandardPayload,
  SidhStandardCourse,
  DomValidationResult,
  SidhExtractionDiagnostics
} from '../../lib/sidhDomExtractor';

interface SIDHBrowserSyncPanelProps {
  onSyncSuccess: () => Promise<void>;
  onNavigateTab: (tab: string) => void;
  sessionStudentName?: string;
  sessionRegisterNumber?: string;
  isStaff?: boolean;
}

export type SyncStage =
  | 'IDLE'
  | 'WAITING_FOR_SIDH'
  | 'PAGE_DETECTED'
  | 'READING_DATA'
  | 'EXTRACTING_COURSES'
  | 'VALIDATING'
  | 'PREVIEW'
  | 'SAVING'
  | 'SAVED_SUCCESS'
  | 'ERROR';

export interface SyncHistoryRecord {
  syncId: string;
  date: string;
  studentName: string;
  registerNumber: string;
  coursesFound: number;
  newCourses: number;
  completedCourses: number;
  duplicatesIgnored: number;
  status: string;
  source: string;
}

export const SIDHBrowserSyncPanel: React.FC<SIDHBrowserSyncPanelProps> = ({
  onSyncSuccess,
  onNavigateTab,
  sessionStudentName,
  sessionRegisterNumber,
  isStaff
}) => {
  // Sync State Machine
  const [syncStage, setSyncStage] = useState<SyncStage>('IDLE');
  const [activeTab, setActiveTab] = useState<'sync' | 'history'>('sync');

  // Payload & Validation States
  const [validatedPayload, setValidatedPayload] = useState<SidhStandardPayload | null>(null);
  const [validationResult, setValidationResult] = useState<DomValidationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [diagnosticsData, setDiagnosticsData] = useState<SidhExtractionDiagnostics | null>(null);
  
  // UI & Action States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [showManualPaste, setShowManualPaste] = useState<boolean>(false);
  const [manualJsonText, setManualJsonText] = useState<string>('');
  const [syncSummary, setSyncSummary] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [selectedEvidenceCourse, setSelectedEvidenceCourse] = useState<SidhStandardCourse | null>(null);

  // Sync History
  const [syncHistory, setSyncHistory] = useState<SyncHistoryRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Generate bridge script
  const bridgeScript = generateSidhBrowserBridgeScript(typeof window !== 'undefined' ? window.location.origin : '');

  // Fetch sync history from backend
  const fetchSyncHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const query = !isStaff && sessionRegisterNumber ? `?studentRegisterNumber=${encodeURIComponent(sessionRegisterNumber)}` : '';
      const res = await fetch(`/api/sidh/browser-sync/history${query}`);
      if (!res.ok) {
        setSyncHistory([]);
        return;
      }
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success && Array.isArray(data.history)) {
          setSyncHistory(data.history);
        }
      }
    } catch (err) {
      console.warn('Failed to load sync history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    handleReset();
    fetchSyncHistory();
  }, [sessionRegisterNumber]);

  // Listen for window.postMessage from controlled SIDH tab
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate payload type
      if (event.data && event.data.type === 'SIDH_DOM_SYNC_PAYLOAD' && event.data.payload) {
        handleIncomingPayload(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Process and validate any incoming payload
  const handleIncomingPayload = (payloadObj: any) => {
    setIsProcessing(true);
    setSyncStage('PAGE_DETECTED');

    if (payloadObj.diagnostics) {
      setDiagnosticsData(payloadObj.diagnostics);
    }

    setTimeout(() => {
      setSyncStage('READING_DATA');

      setTimeout(() => {
        setSyncStage('EXTRACTING_COURSES');

        setTimeout(() => {
          setSyncStage('VALIDATING');
          const validation = validateSidhStandardPayload(payloadObj);
          setValidationResult(validation);

          if (validation.diagnostics) {
            setDiagnosticsData(validation.diagnostics);
          }

          if (
            validation.isValid && 
            validation.status === 'VERIFIED' && 
            validation.standardPayload && 
            Array.isArray(validation.standardPayload.courses) && 
            validation.standardPayload.courses.length > 0
          ) {
            setValidatedPayload(validation.standardPayload);
            setSyncStage('PREVIEW');
            setErrorMessage('');
          } else {
            setValidatedPayload(null);
            setSyncStage('ERROR');
            setErrorMessage(
              validation.errorMessage || 
              'No verified course records were found on the active SIDH page.'
            );
          }
          setIsProcessing(false);
        }, 300);
      }, 300);
    }, 300);
  };

  // Main Action: "Start SIDH Sync"
  const handleStartSidhSync = () => {
    setSyncStage('WAITING_FOR_SIDH');
    setErrorMessage('');
    setValidatedPayload(null);
    setValidationResult(null);

    // Open official SIDH portal in a new tab
    const sidhWindow = window.open('https://www.skillindiadigital.gov.in/user/my-courses', '_blank');
    if (!sidhWindow) {
      console.warn('Popup was blocked by browser. User can open SIDH manually.');
    }
  };

  // Option B: "Import Verified SIDH Data" from Clipboard
  const handleImportFromClipboard = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText && clipboardText.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(clipboardText);
            handleIncomingPayload(parsed);
            return;
          } catch (parseErr) {
            // Not valid JSON in clipboard, open manual paste modal
          }
        }
      }
      setShowManualPaste(true);
      setIsProcessing(false);
    } catch (err: any) {
      console.warn('Clipboard read error:', err);
      setShowManualPaste(true);
      setIsProcessing(false);
    }
  };

  // Handle Manual Paste Submission
  const handleManualPasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualJsonText.trim()) return;

    try {
      const parsed = JSON.parse(manualJsonText.trim());
      setShowManualPaste(false);
      handleIncomingPayload(parsed);
    } catch (err: any) {
      setSyncStage('ERROR');
      setErrorMessage('Invalid JSON format. Please make sure to copy the exact payload generated by the SIDH bridge script.');
    }
  };

  // Guarded Confirm & Save state
  const isConfirmDisabled = 
    isSaving ||
    !validatedPayload ||
    !validationResult ||
    !validationResult.isValid ||
    validationResult.status !== 'VERIFIED' ||
    !validatedPayload.courses ||
    validatedPayload.courses.length === 0 ||
    validatedPayload.source !== 'SIDH_VISIBLE_DOM' ||
    validatedPayload.courses.some(c => !c.courseName || c.courseName === 'Not Available' || !c.evidence || c.evidence.source !== 'SIDH_VISIBLE_DOM');

  // User explicitly clicks [✓ Confirm & Save]
  const handleConfirmAndSave = async () => {
    if (isConfirmDisabled || !validatedPayload) return;

    setIsSaving(true);
    setSyncStage('SAVING');

    const effectiveReg = sessionRegisterNumber || (validatedPayload.student as any)?.registerNumber || validatedPayload.student?.registrationId || validatedPayload.student?.studentId;
    const effectiveName = sessionStudentName || validatedPayload.student?.name;

    try {
      const res = await fetch('/api/sidh/browser-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'SIDH_VISIBLE_DOM',
          profileUrl: validatedPayload.profileUrl,
          sourceUrl: validatedPayload.profileUrl,
          extractedAt: validatedPayload.extractedAt,
          activeTab: validatedPayload.activeTab || 'Completed',
          confirmedByUser: true,
          confirmed_by_user: true,
          firebaseUid: effectiveReg,
          student: {
            ...validatedPayload.student,
            registerNumber: effectiveReg,
            name: effectiveName
          },
          courses: validatedPayload.courses
        })
      }).then(r => r.json());

      if (res.success) {
        setSyncStage('SAVED_SUCCESS');
        setSyncSummary(res.summary);
        await onSyncSuccess();
        fetchSyncHistory();
      } else {
        setSyncStage('ERROR');
        setErrorMessage(res.error || 'Server rejected synchronization payload.');
      }
    } catch (err: any) {
      setSyncStage('ERROR');
      setErrorMessage(err.message || 'Failed to transmit verified records to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSyncStage('IDLE');
    setValidatedPayload(null);
    setValidationResult(null);
    setErrorMessage('');
    setShowManualPaste(false);
    setManualJsonText('');
    setSyncSummary(null);
    setSelectedEvidenceCourse(null);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(bridgeScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  // Export Sync Records to Excel (.xlsx)
  const handleExportExcel = () => {
    if (syncHistory.length === 0) return;

    const dataToExport = syncHistory.map((item, idx) => ({
      'S.No': idx + 1,
      'Sync ID': item.syncId,
      'Date & Time': new Date(item.date).toLocaleString(),
      'Student Name': item.studentName,
      'Registration / ID': item.registerNumber,
      'Courses Found': item.coursesFound,
      'New Courses Added': item.newCourses,
      'Completed Courses': item.completedCourses,
      'Duplicates Updated': item.duplicatesIgnored,
      'Status': item.status,
      'Data Source': item.source
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SIDH Sync History');
    XLSX.writeFile(wb, `SIDH_Sync_History_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Security & Privacy Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                  Security & Privacy Guarantee
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Zero Mock Data Enforced
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  Active Tab & Live DOM Sync
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                SC SkillTrack reads <strong>only information visibly rendered</strong> in the active tab (e.g. Completed, Joined) of your authenticated SIDH session. Passwords, tokens, and private credentials are <strong>never accessed or stored</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab(activeTab === 'sync' ? 'history' : 'sync')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{activeTab === 'sync' ? 'View Sync History' : 'Back to Sync Panel'}</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'history' ? (
        /* Sync History View */
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                SIDH Browser Sync Audit & History
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Institutional log of all verified visible DOM sync sessions with zero mock data.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                disabled={syncHistory.length === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel (.xlsx)</span>
              </button>
              <button
                onClick={fetchSyncHistory}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                title="Refresh History"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {syncHistory.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <Database className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-400">No Browser Sync Sessions Recorded Yet</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Complete a verified visible SIDH browser sync session to log records in this institutional audit log.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-black">
                  <tr>
                    <th className="p-3.5">Sync Date</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Register / ID</th>
                    <th className="p-3.5 text-center">Courses Found</th>
                    <th className="p-3.5 text-center">New Added</th>
                    <th className="p-3.5">Source Type</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                  {syncHistory.map((item) => (
                    <tr key={item.syncId} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono text-slate-400">{new Date(item.date).toLocaleString()}</td>
                      <td className="p-3.5 font-bold text-white">{item.studentName}</td>
                      <td className="p-3.5 font-mono text-blue-300">{item.registerNumber}</td>
                      <td className="p-3.5 text-center font-bold text-slate-200">{item.coursesFound}</td>
                      <td className="p-3.5 text-center font-bold text-emerald-400">+{item.newCourses}</td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">{item.source}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Main Sync Execution Flow */
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          {/* Header & Main Trigger */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-400" />
                SC SkillTrack SIDH Browser Sync
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Connect your active Skill India Digital Hub session to extract and verify visibly enrolled and completed course records directly from the live DOM.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {syncStage !== 'IDLE' && (
                <button
                  onClick={handleReset}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Flow</span>
                </button>
              )}

              <button
                onClick={handleStartSidhSync}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg shadow-blue-900/40 flex items-center gap-2 cursor-pointer transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Start SIDH Sync</span>
              </button>

              <button
                onClick={handleImportFromClipboard}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-900/40 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Import Verified SIDH Data</span>
              </button>
            </div>
          </div>

          {/* Pipeline Step Tracker */}
          <div className="pt-3 pb-1 border-t border-slate-800">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {[
                { id: '1', title: '1. Waiting for SIDH', active: syncStage === 'WAITING_FOR_SIDH' || syncStage === 'IDLE', done: syncStage !== 'IDLE' && syncStage !== 'WAITING_FOR_SIDH' },
                { id: '2', title: '2. SIDH Page Detected', active: syncStage === 'PAGE_DETECTED', done: ['READING_DATA', 'EXTRACTING_COURSES', 'VALIDATING', 'PREVIEW', 'SAVING', 'SAVED_SUCCESS'].includes(syncStage) },
                { id: '3', title: '3. Reading Visible Data', active: syncStage === 'READING_DATA', done: ['EXTRACTING_COURSES', 'VALIDATING', 'PREVIEW', 'SAVING', 'SAVED_SUCCESS'].includes(syncStage) },
                { id: '4', title: '4. Extracting Courses', active: syncStage === 'EXTRACTING_COURSES', done: ['VALIDATING', 'PREVIEW', 'SAVING', 'SAVED_SUCCESS'].includes(syncStage) },
                { id: '5', title: '5. Validating Records', active: syncStage === 'VALIDATING', done: ['PREVIEW', 'SAVING', 'SAVED_SUCCESS'].includes(syncStage) },
                { id: '6', title: '6. Sync Ready / Saved', active: syncStage === 'PREVIEW' || syncStage === 'SAVED_SUCCESS', done: syncStage === 'SAVED_SUCCESS' }
              ].map((step) => {
                let pillClass = 'bg-slate-950 text-slate-500 border-slate-800';
                if (step.done) pillClass = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
                if (step.active) pillClass = 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/30 shadow-md font-black';

                return (
                  <div key={step.id} className={`p-2 rounded-xl border text-[11px] font-bold text-center truncate ${pillClass}`}>
                    {step.title}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workflow Guide & Bridge Script */}
          {syncStage === 'IDLE' || syncStage === 'WAITING_FOR_SIDH' ? (
            <div className="space-y-6">
              {/* How it works 4-step card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Recommended Synchronisation Workflow
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-extrabold text-blue-400">Step 1: Open SIDH</div>
                    <p className="text-slate-400">Click <strong>Start SIDH Sync</strong> to open Skill India Digital Hub.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-extrabold text-blue-400">Step 2: Go to Courses</div>
                    <p className="text-slate-400">Log in and open <strong>My Skill Courses → Completed</strong> (or Joined).</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-extrabold text-blue-400">Step 3: Run Bridge Script</div>
                    <p className="text-slate-400">Paste the script into Console (F12). It scans the active tab with live retries.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-extrabold text-emerald-400">Step 4: Preview & Confirm</div>
                    <p className="text-slate-400">Verify extracted courses with evidence and click <strong>Confirm & Save</strong>.</p>
                  </div>
                </div>
              </div>

              {/* 1-Click Bridge Script for Active Tab / DevTools */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-blue-400" />
                      SIDH Visible DOM Extraction Bridge Script
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      On your authenticated SIDH tab (e.g. <em>My Skill Courses → Completed</em>), press <strong>F12 → Console</strong>, paste this script, and press <strong>Enter</strong>:
                    </p>
                  </div>

                  <button
                    onClick={handleCopyScript}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                  >
                    {copiedScript ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Script'}</span>
                  </button>
                </div>

                <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-blue-300 max-h-36 overflow-y-auto whitespace-pre-wrap select-all">
                  {bridgeScript}
                </pre>
              </div>

              {/* Manual JSON Paste Area fallback */}
              {showManualPaste && (
                <form onSubmit={handleManualPasteSubmit} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-2">
                        <ClipboardPaste className="w-4 h-4 text-amber-400" />
                        Paste Verified SIDH Payload JSON
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Paste the JSON payload verified from your active SIDH page:
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowManualPaste(false)}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <textarea
                    rows={5}
                    required
                    placeholder='{"source": "SIDH_VISIBLE_DOM", "profileUrl": "https://www.skillindiadigital.gov.in/...", "activeTab": "Completed", "student": {...}, "courses": [...]}'
                    value={manualJsonText}
                    onChange={e => setManualJsonText(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />

                  <button
                    type="submit"
                    disabled={!manualJsonText.trim()}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Validate & Preview Records</span>
                  </button>
                </form>
              )}
            </div>
          ) : null}

          {/* Processing / In-Flight Status Indicator */}
          {['PAGE_DETECTED', 'READING_DATA', 'EXTRACTING_COURSES', 'VALIDATING'].includes(syncStage) && (
            <div className="p-8 rounded-2xl bg-slate-950 border-2 border-blue-500/50 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <div className="text-base font-black text-white">
                {syncStage === 'PAGE_DETECTED' && 'SIDH Page Detected...'}
                {syncStage === 'READING_DATA' && 'Reading Visible DOM Content...'}
                {syncStage === 'EXTRACTING_COURSES' && 'Extracting Visible Course Records...'}
                {syncStage === 'VALIDATING' && 'Verifying Schema & Enforcing Strict Data Integrity...'}
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Extracting student details and courses without guessing or fabricating any data.
              </p>
            </div>
          )}

          {/* SIDH SYNC PREVIEW (Preview Before Save) */}
          {syncStage === 'PREVIEW' && validatedPayload && (
            <div className="space-y-6">
              {/* Preview Header Card */}
              <div className="p-5 rounded-2xl bg-emerald-950/30 border-2 border-emerald-500/50 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      SIDH SYNC PREVIEW
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Source: {validatedPayload.source}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Active Section: {validatedPayload.activeTab || 'Completed'}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    Extracted: {new Date(validatedPayload.extractedAt).toLocaleString()}
                  </span>
                </div>

                {/* Extracted Student Summary Card */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Student Name</div>
                    <div className="text-sm font-black text-white">{validatedPayload.student.name}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Active Section</div>
                    <div className="text-sm font-black text-purple-300">{validatedPayload.activeTab || 'Completed'}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Registration ID</div>
                    <div className="text-sm font-mono font-bold text-emerald-300">{validatedPayload.student.studentId || validatedPayload.student.registrationId}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Visible Courses Found</div>
                    <div className="text-sm font-black text-blue-400">{validatedPayload.courses.length} Course(s)</div>
                  </div>
                </div>
              </div>

              {/* Verified Courses Table */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    Visible Course Records ({validatedPayload.courses.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Click <strong>View Evidence</strong> to inspect raw DOM proof for each field
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase font-black text-[11px]">
                      <tr>
                        <th className="p-3">Course</th>
                        <th className="p-3">Provider</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Certificate</th>
                        <th className="p-3 text-center">Evidence Proof</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {validatedPayload.courses.map((crs, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60">
                          <td className="p-3 font-bold text-white max-w-xs">{crs.courseName}</td>
                          <td className="p-3 text-slate-300">{crs.provider}</td>
                          <td className="p-3 text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                              {crs.category}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              crs.status === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {crs.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              crs.certificateAvailable === 'AVAILABLE'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : 'text-slate-500'
                            }`}>
                              {crs.certificateAvailable}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setSelectedEvidenceCourse(crs)}
                              className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1.5 mx-auto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Evidence</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Bar: Confirm & Save vs Cancel */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-0.5">
                  <div className="text-sm font-black text-white">Ready to save verified records?</div>
                  <p className="text-xs text-slate-400">
                    Records are saved directly to Firebase/Database with zero fabrication. Existing duplicates are automatically protected.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    id="sidh-confirm-and-save-btn"
                    onClick={handleConfirmAndSave}
                    disabled={isConfirmDisabled}
                    aria-disabled={isConfirmDisabled}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
                      isConfirmDisabled
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60 shadow-none pointer-events-none'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 cursor-pointer'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Confirm & Save</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Screen */}
          {syncStage === 'SAVED_SUCCESS' && (
            <div className="p-6 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <span>SIDH SYNC SUCCESSFUL</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-200">
                {syncSummary?.coursesFound || (validatedPayload ? validatedPayload.courses.length : 0)} verified course records have been recorded for <strong>{syncSummary?.studentName || validatedPayload?.student.name}</strong> ({syncSummary?.registerNumber || validatedPayload?.student.studentId}).
              </p>

              <div className="pt-2 flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => onNavigateTab('dashboard')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>View in Student & Course Master</span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>View Audit Log</span>
                </button>

                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  Sync Another Session
                </button>
              </div>
            </div>
          )}

          {/* Error / Not Verified Screen */}
          {syncStage === 'ERROR' && (
            <div className="p-6 rounded-2xl bg-rose-950/40 border-2 border-rose-600/80 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-rose-400 font-black text-base">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span>SIDH DATA NOT VERIFIED</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-rose-900/60 space-y-2.5 text-xs text-slate-300">
                <p className="font-semibold text-rose-300">
                  {errorMessage || "No verified course records were found on the active SIDH page."}
                </p>
                <div className="space-y-1.5 text-slate-400">
                  <p className="font-bold text-slate-300">Please make sure:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-300">
                    <li>You are logged into Skill India Digital Hub.</li>
                    <li>
                      You navigated to:
                      <ul className="list-disc list-inside pl-4 mt-0.5 space-y-0.5 text-slate-400">
                        <li>My Skill Courses → <strong>Completed</strong></li>
                        <li>My Skill Courses → <strong>Joined</strong></li>
                        <li>My Skill Courses → <strong>Online</strong></li>
                      </ul>
                    </li>
                    <li>Course cards have finished loading on screen.</li>
                    <li>Run the bridge script again in Console.</li>
                  </ol>
                </div>
              </div>

              {validationResult?.failedChecks && validationResult.failedChecks.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-900/30 border border-rose-800/60 space-y-1">
                  <div className="text-xs font-bold text-rose-300 uppercase">Integrity Check Failures:</div>
                  <ul className="text-xs text-rose-200 list-disc list-inside space-y-0.5">
                    {validationResult.failedChecks.map((fc, i) => (
                      <li key={i}>{fc}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleStartSidhSync}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Open SIDH and Retry</span>
                </button>

                <button
                  onClick={() => onNavigateTab('import')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Import Official SIDH Export</span>
                </button>

                <button
                  onClick={() => onNavigateTab('proof')}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Upload Official Proof</span>
                </button>
              </div>
            </div>
          )}

          {/* DEVELOPER EXTRACTION DIAGNOSTICS & DEBUG SECTION */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-purple-400" />
                <span>Developer Diagnostics & Extraction Audit</span>
                {diagnosticsData && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {diagnosticsData.validatedCourseCards} validated / {diagnosticsData.candidateContainersFound} candidates
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <span>{showDiagnostics ? 'Hide' : 'Inspect'}</span>
                {showDiagnostics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showDiagnostics && (
              <div className="space-y-4 pt-2 text-xs border-t border-slate-900">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">SIDH Page Detected</span>
                    <span className="font-bold text-emerald-400">{diagnosticsData?.sidhPageDetected ? 'YES' : 'NO'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Active Tab</span>
                    <span className="font-bold text-purple-400">{diagnosticsData?.activeTab || 'Completed'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Visible DOM Scanned</span>
                    <span className="font-bold text-emerald-400">{diagnosticsData?.visibleDomScanned ? 'YES' : 'NO'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Duration / Attempts</span>
                    <span className="font-bold text-blue-400">{diagnosticsData?.extractionDurationMs || 0}ms ({diagnosticsData?.scanAttempts || 1} att)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Candidates Found</span>
                    <span className="font-bold text-white">{diagnosticsData?.candidateContainersFound || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Validated Cards</span>
                    <span className="font-bold text-emerald-400">{diagnosticsData?.validatedCourseCards || 0}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Rejected Elements</span>
                    <span className="font-bold text-amber-400">{diagnosticsData?.rejectedElementsCount || 0}</span>
                  </div>
                </div>

                {diagnosticsData?.rejectedReasons && diagnosticsData.rejectedReasons.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400">Rejected Element Reasons:</div>
                    <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px]">
                      {diagnosticsData.rejectedReasons.map((rej, i) => (
                        <div key={i} className="text-slate-400 flex items-start gap-2">
                          <span className="text-amber-400 shrink-0">•</span>
                          <span><strong className="text-slate-300">{rej.element}:</strong> {rej.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW EVIDENCE MODAL */}
      {selectedEvidenceCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-white">Live DOM Evidence Verification</h3>
              </div>
              <button
                onClick={() => setSelectedEvidenceCourse(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Course Title</span>
                <span className="text-white font-bold">{selectedEvidenceCourse.courseName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Provider</span>
                <span className="text-slate-300 font-bold">{selectedEvidenceCourse.provider}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Category / Sector</span>
                <span className="text-blue-400 font-bold">{selectedEvidenceCourse.category}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-bold uppercase text-[10px] block">Status</span>
                <span className="text-emerald-400 font-bold">{selectedEvidenceCourse.status}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="text-slate-400 font-bold uppercase text-[10px] flex items-center justify-between">
                <span>Raw Visible DOM Text Evidence (Extracted Live from Card)</span>
                <span className="text-emerald-400 font-mono">Source: {selectedEvidenceCourse.evidence?.source || 'SIDH_VISIBLE_DOM'}</span>
              </div>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedEvidenceCourse.evidence?.text || selectedEvidenceCourse.courseName}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvidenceCourse(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
