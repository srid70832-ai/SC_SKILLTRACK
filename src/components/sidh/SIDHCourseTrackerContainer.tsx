import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  GraduationCap, RefreshCw, Sparkles, Download, FileSpreadsheet, FileText, 
  Search, Filter, ShieldCheck, AlertCircle, CheckCircle2, Clock, BookOpen, 
  Award, Layers, User, Calendar, Upload, Settings, ShieldAlert, Activity,
  ChevronRight, ArrowRight, FileCheck, Layers3, X, HelpCircle, Lock, Edit3, Check, AlertTriangle,
  Users, ListFilter, ArrowUpDown, ExternalLink, Globe
} from 'lucide-react';
import { 
  SIDHCourseRecord, 
  SIDHConnectionConfig, 
  SIDHSyncAuditLog, 
  SIDHVerificationErrorLog,
  SIDHStudentComputedSummary,
  UserSession 
} from '../../types';
import StudentCourseProfileModal from './StudentCourseProfileModal';
import { StudentActivityProfileModal } from './StudentActivityProfileModal';
import { SIDHBrowserSyncPanel } from './SIDHBrowserSyncPanel';
import { SIDHCertificateProofUploadPanel } from './SIDHCertificateProofUploadPanel';
import { SIDHStaffEvidenceDashboard } from './SIDHStaffEvidenceDashboard';
import { SIDHStudentEvidenceCard } from './SIDHStudentEvidenceCard';
import { SIDHExportImportPanel } from './SIDHExportImportPanel';
import { SIDHPublicDigitalCVSyncPanel } from './SIDHPublicDigitalCVSyncPanel';
import { CertificateVerificationContainer } from '../certificate/CertificateVerificationContainer';
import { 
  exportSIDHCoursesToExcel, 
  exportSIDHCoursesToCSV, 
  exportSIDHCoursesToPDF,
  exportSIDHVerificationErrorsToExcel,
  validateSIDHDatasetForExport 
} from '../../lib/sidhExportUtil';

interface SIDHCourseTrackerContainerProps {
  session: UserSession;
}

export default function SIDHCourseTrackerContainer({ session }: SIDHCourseTrackerContainerProps) {
  const isStaff = session.role === 'Staff';
  const studentReg = session.studentDetails?.registerNumber || session.username;

  // Active Tab View - default to 'dashboard' (Student & Course Master)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'evidence-cockpit' | 'import' | 'proof' | 'public-url' | 'browser-sync' | 'errors' | 'history' | 'audit' | 'ai' | 'settings'>('dashboard');

  // Master View Mode: 'student-master' (1 row per student) or 'course-details' (1 row per course)
  const [viewMode, setViewMode] = useState<'student-master' | 'course-details'>('student-master');

  // Evidence System States
  const [studentSummary, setStudentSummary] = useState<SIDHStudentComputedSummary | null>(null);
  const [studentEvidenceList, setStudentEvidenceList] = useState<any[]>([]);
  const [studentRequests, setStudentRequests] = useState<any[]>([]);
  const [studentActivityModalReg, setStudentActivityModalReg] = useState<string | null>(null);

  // Data State
  const [courses, setCourses] = useState<SIDHCourseRecord[]>([]);
  const [config, setConfig] = useState<SIDHConnectionConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<SIDHSyncAuditLog[]>([]);
  const [verificationErrors, setVerificationErrors] = useState<SIDHVerificationErrorLog[]>([]);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [verificationIssues, setVerificationIssues] = useState<any[]>([]);
  const [studentProofs, setStudentProofs] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [sectionFilter, setSectionFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [mentorFilter, setMentorFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'reg-asc' | 'reg-desc' | 'courses-desc' | 'completed-desc'>('name-asc');

  // Proof Upload State
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofResult, setProofResult] = useState<{ success: boolean; message: string; data?: any; verificationStatus?: string; proofId?: string } | null>(null);

  // Proof Confirmation Form State
  const [proofConfirmForm, setProofConfirmForm] = useState({
    proofId: '',
    studentName: '',
    registerNumber: '',
    courseName: '',
    courseId: '',
    provider: 'Skill India Digital Hub',
    completionDate: '',
    certificateId: '',
    status: 'COMPLETED'
  });
  const [isEditingProofDetails, setIsEditingProofDetails] = useState(false);
  const [confirmingProof, setConfirmingProof] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState<string | null>(null);

  // Public URL Verification State (Optional fallback with 403 handling)
  const [publicUrl, setPublicUrl] = useState('');
  const [verifyingUrl, setVerifyingUrl] = useState(false);
  const [publicUrlResult, setPublicUrlResult] = useState<{ 
    success: boolean; 
    message: string; 
    status?: string; 
    httpStatus?: number;
    profileUrl?: string;
    courses?: any[] 
  } | null>(null);

  // Import Official Export State (Primary reliable method)
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedPreviewRecords, setParsedPreviewRecords] = useState<any[]>([]);
  const [importValidationSummary, setImportValidationSummary] = useState<{ total: number; matchedStudents: number; unmatchedStudents: number } | null>(null);
  const [rawImportJson, setRawImportJson] = useState('');
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Selected Student Profile Modal State
  const [selectedStudentRecord, setSelectedStudentRecord] = useState<{
    studentName: string;
    registerNumber: string;
    rollNumber?: string;
    department?: string;
    sidhId?: string;
    sidhProfileUrl?: string;
    section?: string;
    year?: string;
    mentorName?: string;
  } | null>(null);

  // Gemini AI Insights State
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  // Loading & Sync Message States
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState({
    apiUrl: '',
    autoSyncSchedule: 'Daily' as 'Daily' | 'Weekly' | 'Manual',
    autoSyncEnabled: false,
    apiKey: '',
    clientId: ''
  });

  // Pre-Export Validation Modal
  const [exportBlockedModal, setExportBlockedModal] = useState<{
    failedCount: number;
    errorMessages: string[];
  } | null>(null);

  // Load SIDH Data on Mount
  useEffect(() => {
    fetchSIDHData();
  }, [session.username]);

  const fetchSIDHData = async () => {
    setLoading(true);
    try {
      const query = !isStaff ? `?studentRegisterNumber=${encodeURIComponent(studentReg)}` : '';
      const [resCourses, resConfig, resAudit, resErrors, resHistory, resIssues, resProofs, resStudents] = await Promise.all([
        fetch(`/api/sidh/courses${query}`).then(r => r.json()).catch(() => ({})),
        fetch('/api/sidh/config').then(r => r.json()).catch(() => ({})),
        fetch('/api/sidh/audit-logs').then(r => r.json()).catch(() => ({})),
        fetch('/api/sidh/verification-errors').then(r => r.json()).catch(() => ({})),
        fetch('/api/sidh/import-history').then(r => r.json()).catch(() => ({})),
        fetch('/api/sidh/verification-issues').then(r => r.json()).catch(() => ({})),
        fetch('/api/sidh/student-proofs').then(r => r.json()).catch(() => ({})),
        fetch('/api/students').then(r => r.json()).catch(() => ([]))
      ]);

      if (resCourses.courses) setCourses(resCourses.courses);
      if (Array.isArray(resStudents)) setStudentsList(resStudents);
      if (resConfig.config) {
        setConfig(resConfig.config);
        setSettingsForm({
          apiUrl: resConfig.config.apiUrl || '',
          autoSyncSchedule: resConfig.config.autoSyncSchedule || 'Daily',
          autoSyncEnabled: resConfig.config.autoSyncEnabled || false,
          apiKey: resConfig.config.apiKey || '',
          clientId: resConfig.config.clientId || ''
        });
      }
      if (resAudit.auditLogs) setAuditLogs(resAudit.auditLogs);
      if (resErrors.verificationErrors) setVerificationErrors(resErrors.verificationErrors);
      if (resHistory.history) setImportHistory(resHistory.history);
      if (resIssues.issues) setVerificationIssues(resIssues.issues);
      if (resProofs.proofs) setStudentProofs(resProofs.proofs);

      // Fetch Evidence Summary for Student if student session
      if (!isStaff && studentReg) {
        try {
          const resActivity = await fetch(`/api/sidh/student-activity/${encodeURIComponent(studentReg)}`).then(r => r.json());
          if (resActivity.statusSummary) {
            setStudentSummary(resActivity.statusSummary);
            setStudentEvidenceList(resActivity.evidence || []);
            setStudentRequests(resActivity.actionRequests || []);
          }
        } catch (e) {
          console.error('[EVIDENCE ACTIVITY FETCH ERROR]', e);
        }
      }

    } catch (err) {
      console.error('[SIDH FETCH ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger Manual SIDH Sync
  const handleSyncSIDH = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/sidh/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggeredBy: session.name || session.username })
      }).then(r => r.json());

      if (res.status === 'SUCCESS' || res.status === 'PARTIAL') {
        setSyncMessage({
          type: 'success',
          text: res.message || `SIDH Sync completed! Checked ${res.audit.studentsChecked} students, verified ${res.audit.studentsVerified} enrolled courses.`
        });
        await fetchSIDHData();
      } else {
        setSyncMessage({
          type: 'error',
          text: res.message || 'SIDH sync failed. Preserved existing verified records.'
        });
      }
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: `Sync failed: ${err.message}` });
    } finally {
      setSyncing(false);
    }
  };

  // Generate Gemini AI Insights
  const handleGenerateAiInsights = async () => {
    setGeneratingAi(true);
    setAiInsights(null);
    try {
      const res = await fetch('/api/sidh/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }).then(r => r.json());

      if (res.summary) {
        setAiInsights(res.summary);
        setActiveTab('ai');
      }
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: `Failed to generate AI insights: ${err.message}` });
    } finally {
      setGeneratingAi(false);
    }
  };

  // File Parser for Official SIDH Export (.xlsx, .xls, .csv, .json)
  const handleSelectImportFile = async (file: File) => {
    setImportFile(file);
    setImportSuccess(null);
    setParsedPreviewRecords([]);
    setImportValidationSummary(null);

    try {
      let rawRecords: any[] = [];
      const fileNameLower = file.name.toLowerCase();

      if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls') || fileNameLower.endsWith('.csv')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        
        workbook.SheetNames.forEach(sheetName => {
          const ws = workbook.Sheets[sheetName];
          const sheetRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
          rawRecords = rawRecords.concat(sheetRows);
        });
      } else if (fileNameLower.endsWith('.json') || fileNameLower.endsWith('.txt')) {
        const text = await file.text();
        try {
          rawRecords = JSON.parse(text);
        } catch (e) {
          // Try line by line CSV
          const lines = text.trim().split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"/, '').replace(/"$/, ''));
          rawRecords = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/^"/, '').replace(/"$/, ''));
            const rowObj: any = {};
            headers.forEach((h, i) => { rowObj[h] = values[i] || ''; });
            return rowObj;
          });
        }
      }

      if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
        setSyncMessage({ type: 'error', text: 'No course records found in uploaded file.' });
        return;
      }

      // Normalize row headers case-insensitively
      const normalizedRecords = rawRecords.map(row => {
        const norm: any = {};
        Object.keys(row).forEach(key => {
          const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
          const val = String(row[key] || '').trim();

          if (cleanKey.includes('regis') || cleanKey === 'regno' || cleanKey === 'registernumber') norm.registerNumber = val;
          else if (cleanKey.includes('roll') || cleanKey === 'rollno' || cleanKey === 'rollnumber') norm.rollNumber = val;
          else if (cleanKey.includes('name') || cleanKey === 'student' || cleanKey === 'studentname') norm.studentName = val;
          else if (cleanKey.includes('coursename') || cleanKey.includes('coursetitle') || cleanKey === 'course') norm.courseName = val;
          else if (cleanKey.includes('courseid') || cleanKey === 'id' || cleanKey === 'crsid') norm.courseId = val;
          else if (cleanKey.includes('provider') || cleanKey.includes('partner')) norm.provider = val;
          else if (cleanKey.includes('status') || cleanKey === 'coursestatus') norm.status = val.toUpperCase();
          else if (cleanKey.includes('progress') || cleanKey === 'percentage') norm.progress = val;
          else if (cleanKey.includes('start') || cleanKey === 'startdate') norm.startDate = val;
          else if (cleanKey.includes('enroll') || cleanKey === 'enrolldate') norm.enrollmentDate = val;
          else if (cleanKey.includes('completion') || cleanKey === 'completedate' || cleanKey === 'enddate') norm.completionDate = val;
          else if (cleanKey.includes('certid') || cleanKey === 'certificateid') norm.certificateId = val;
          else if (cleanKey.includes('certstatus') || cleanKey === 'certificatestatus') norm.certificateStatus = val;
          else if (cleanKey.includes('certurl') || cleanKey === 'certificateurl') norm.certificateUrl = val;
          else if (cleanKey.includes('profile') || cleanKey === 'profileurl') norm.sidhProfileUrl = val;
          else if (cleanKey.includes('dept') || cleanKey === 'department') norm.department = val;
          else if (cleanKey.includes('sec') || cleanKey === 'section') norm.section = val;
          else if (cleanKey.includes('year')) norm.year = val;
          else norm[key] = val;
        });

        // Smart fallbacks
        if (!norm.provider) norm.provider = 'Skill India Digital Hub';
        if (!norm.status) norm.status = norm.completionDate ? 'COMPLETED' : 'ENROLLED';
        if (norm.status === 'COMPLETED' && !norm.certificateStatus) norm.certificateStatus = 'AVAILABLE';
        if (!norm.certificateStatus) norm.certificateStatus = 'NOT AVAILABLE';

        return norm;
      }).filter(r => r.courseName || r.registerNumber || r.studentName);

      setParsedPreviewRecords(normalizedRecords);

      // Pre-validation stats
      let matchedCount = 0;
      let unmatchedCount = 0;
      normalizedRecords.forEach(r => {
        const reg = (r.registerNumber || '').toUpperCase();
        const name = (r.studentName || '').toUpperCase();
        const found = studentsList.some(s => 
          (s.registerNumber && s.registerNumber.toUpperCase() === reg) ||
          (s.rollNumber && s.rollNumber.toUpperCase() === reg) ||
          (s.studentName && s.studentName.toUpperCase() === name)
        );
        if (found) matchedCount++;
        else unmatchedCount++;
      });

      setImportValidationSummary({
        total: normalizedRecords.length,
        matchedStudents: matchedCount,
        unmatchedStudents: unmatchedCount
      });

    } catch (err: any) {
      setSyncMessage({ type: 'error', text: `Failed to parse file: ${err.message}` });
    }
  };

  // Commit Official Import Data
  const handleCommitOfficialImport = async () => {
    let recordsToSend = parsedPreviewRecords;

    if (recordsToSend.length === 0 && rawImportJson.trim()) {
      try {
        recordsToSend = JSON.parse(rawImportJson.trim());
      } catch (e) {
        setSyncMessage({ type: 'error', text: 'Invalid JSON format in text area.' });
        return;
      }
    }

    if (recordsToSend.length === 0) {
      setSyncMessage({ type: 'error', text: 'Please select a file or paste JSON records to import.' });
      return;
    }

    setImporting(true);
    setImportSuccess(null);

    try {
      const res = await fetch('/api/sidh/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawRecords: recordsToSend,
          fileName: importFile?.name || 'Official_SIDH_Export.xlsx',
          triggeredBy: `Staff Import (${session.name || session.username})`
        })
      }).then(r => r.json());

      if (res.success) {
        setImportSuccess(`Official SIDH Data import verified and saved! ${res.audit.studentsVerified} student courses verified, ${res.audit.newCourses} new records created.`);
        setParsedPreviewRecords([]);
        setImportValidationSummary(null);
        setImportFile(null);
        setRawImportJson('');
        await fetchSIDHData();
        setActiveTab('dashboard');
      } else {
        setSyncMessage({ type: 'error', text: res.error || 'Import failed verification pipeline.' });
      }
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: `Import failed: ${err.message}` });
    } finally {
      setImporting(false);
    }
  };

  // Handle Student SIDH Proof Upload
  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) return;

    setUploadingProof(true);
    setProofResult(null);
    setConfirmSuccess(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(proofFile);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch('/api/sidh/upload-proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentRegisterNumber: studentReg,
            fileBase64: base64,
            fileName: proofFile.name,
            mimeType: proofFile.type
          })
        }).then(r => r.json());

        if (res.success) {
          const ext = res.extractedData || {};
          setProofResult({
            success: true,
            message: 'Proof document processed via Gemini AI OCR! Please review and confirm extracted details below.',
            data: ext,
            verificationStatus: res.proof?.verificationStatus || 'PROOF UPLOADED',
            proofId: res.proof?.id
          });
          setProofConfirmForm({
            proofId: res.proof?.id || `PROOF-${Date.now()}`,
            studentName: ext.studentName || res.proof?.studentName || '',
            registerNumber: ext.registerNumber || res.proof?.registerNumber || studentReg || '',
            courseName: ext.courseName || '',
            courseId: ext.courseId || '',
            provider: ext.provider || 'Skill India Digital Hub',
            completionDate: ext.completionDate || new Date().toISOString().slice(0, 10),
            certificateId: ext.certificateId || ext.sidhId || '',
            status: ext.status || 'COMPLETED'
          });
          setProofFile(null);
          await fetchSIDHData();
        } else {
          setProofResult({
            success: false,
            message: res.error || 'Failed to process SIDH proof upload.'
          });
        }
        setUploadingProof(false);
      };
    } catch (err: any) {
      setProofResult({
        success: false,
        message: `Proof upload error: ${err.message}`
      });
      setUploadingProof(false);
    }
  };

  // Confirm Extracted Proof Record
  const handleConfirmProofRecord = async () => {
    if (!proofConfirmForm.courseName || !proofConfirmForm.registerNumber) return;
    setConfirmingProof(true);
    setConfirmSuccess(null);
    try {
      const res = await fetch('/api/sidh/confirm-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proofConfirmForm)
      }).then(r => r.json());

      if (res.success) {
        setConfirmSuccess(`Proof record confirmed & promoted to VERIFIED course record!`);
        setProofResult(null);
        await fetchSIDHData();
      } else {
        setSyncMessage({ type: 'error', text: res.error || 'Failed to confirm proof record.' });
      }
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: `Confirmation error: ${err.message}` });
    } finally {
      setConfirmingProof(false);
    }
  };

  // Handle Public SIDH Profile URL Verification (Optional Fallback with 403 handling)
  const handleVerifyPublicUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicUrl.trim()) return;

    setVerifyingUrl(true);
    setPublicUrlResult(null);

    try {
      const res = await fetch('/api/sidh/verify-public-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileUrl: publicUrl.trim(),
          studentRegisterNumber: studentReg
        })
      }).then(r => r.json());

      if (res.success) {
        setPublicUrlResult({
          success: true,
          message: `Public SIDH profile verified! Extracted ${res.extractedCourses?.length || 0} course record(s).`,
          status: 'VERIFIED',
          profileUrl: publicUrl.trim(),
          courses: res.extractedCourses
        });
        await fetchSIDHData();
      } else {
        setPublicUrlResult({
          success: false,
          message: res.userMessage || res.message || 'SIDH automated access is restricted. Please use Official SIDH Export or Official SIDH Proof.',
          status: res.status || 'ACCESS BLOCKED',
          httpStatus: res.httpStatus || 403,
          profileUrl: publicUrl.trim()
        });
      }
    } catch (err: any) {
      setPublicUrlResult({
        success: false,
        message: 'SIDH automated access is restricted. Please use Official SIDH Export or Official SIDH Proof.',
        status: 'ACCESS BLOCKED',
        httpStatus: 403,
        profileUrl: publicUrl.trim()
      });
    } finally {
      setVerifyingUrl(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sidh/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      }).then(r => r.json());

      if (res.success) {
        setConfig(res.config);
        setSyncMessage({ type: 'success', text: 'SIDH connection settings saved successfully!' });
      }
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: `Failed to save settings: ${err.message}` });
    }
  };

  // Filtered Course Records
  const filteredCourses = courses.filter(c => {
    if (!isStaff && c.registerNumber.toUpperCase() !== studentReg.toUpperCase()) {
      return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = c.studentName?.toLowerCase().includes(q);
      const matchReg = c.registerNumber?.toLowerCase().includes(q);
      const matchSidh = c.sidhId?.toLowerCase().includes(q);
      const matchCourse = c.courseName?.toLowerCase().includes(q);
      const matchProv = c.provider?.toLowerCase().includes(q);
      const matchCourseId = c.courseId?.toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchSidh && !matchCourse && !matchProv && !matchCourseId) return false;
    }

    if (statusFilter !== 'All') {
      if (statusFilter === 'Certificate Available' && c.certificateStatus !== 'AVAILABLE' && c.certificateStatus !== 'ISSUED') return false;
      if (statusFilter !== 'Certificate Available' && c.status?.toUpperCase() !== statusFilter.toUpperCase()) return false;
    }

    if (departmentFilter !== 'All' && c.department && c.department.toUpperCase() !== departmentFilter.toUpperCase()) return false;
    if (yearFilter !== 'All' && c.year !== yearFilter) return false;
    if (sectionFilter !== 'All' && c.section !== sectionFilter) return false;
    if (mentorFilter !== 'All' && c.mentorName !== mentorFilter) return false;

    return true;
  });

  // Calculate Student Master List (Grouped by Student)
  const studentMasterMap = new Map<string, {
    studentName: string;
    registerNumber: string;
    rollNumber: string;
    department: string;
    year: string;
    section: string;
    sidhProfileId: string;
    sidhProfileUrl: string;
    mentorName: string;
    totalCourses: number;
    enrolledCourses: number;
    inProgressCourses: number;
    completedCourses: number;
    certificatesAvailable: number;
    verificationStatus: string;
    lastVerifiedDate: string;
    courses: SIDHCourseRecord[];
  }>();

  // Seed from Student Master
  studentsList.forEach(s => {
    const reg = (s.registerNumber || '').toUpperCase();
    if (!reg) return;
    studentMasterMap.set(reg, {
      studentName: s.studentName || 'Student',
      registerNumber: s.registerNumber,
      rollNumber: s.rollNumber || 'Not Available',
      department: s.department || 'Not Available',
      year: s.year || 'I',
      section: s.section || 'A',
      sidhProfileId: s.sidhProfileId || `SIDH-${s.registerNumber}`,
      sidhProfileUrl: s.sidhProfileUrl || '',
      mentorName: s.mentorName || 'Faculty Coordinator',
      totalCourses: 0,
      enrolledCourses: 0,
      inProgressCourses: 0,
      completedCourses: 0,
      certificatesAvailable: 0,
      verificationStatus: 'NOT ENROLLED',
      lastVerifiedDate: 'Not Available',
      courses: []
    });
  });

  // Aggregate verified courses
  courses.forEach(c => {
    const reg = (c.registerNumber || '').toUpperCase();
    let entry = studentMasterMap.get(reg);
    if (!entry) {
      entry = {
        studentName: c.studentName || 'Student',
        registerNumber: c.registerNumber,
        rollNumber: 'Not Available',
        department: c.department || 'Not Available',
        year: c.year || 'I',
        section: c.section || 'A',
        sidhProfileId: c.sidhId || `SIDH-${c.registerNumber}`,
        sidhProfileUrl: c.certificateUrl?.includes('skillindiadigital') ? c.certificateUrl : '',
        mentorName: c.mentorName || 'Faculty Coordinator',
        totalCourses: 0,
        enrolledCourses: 0,
        inProgressCourses: 0,
        completedCourses: 0,
        certificatesAvailable: 0,
        verificationStatus: 'VERIFIED',
        lastVerifiedDate: 'Not Available',
        courses: []
      };
      studentMasterMap.set(reg, entry);
    }

    entry.courses.push(c);
    entry.totalCourses++;
    if (c.status === 'COMPLETED') entry.completedCourses++;
    else if (c.status === 'IN PROGRESS') entry.inProgressCourses++;
    else entry.enrolledCourses++;

    if (c.certificateStatus === 'AVAILABLE' || c.certificateStatus === 'ISSUED') {
      entry.certificatesAvailable++;
    }

    if (c.lastVerifiedAt && entry.lastVerifiedDate === 'Not Available') {
      entry.lastVerifiedDate = new Date(c.lastVerifiedAt).toLocaleDateString();
    }
    entry.verificationStatus = 'VERIFIED';
  });

  // Filter Student Master List
  const filteredStudentsMaster = Array.from(studentMasterMap.values()).filter(st => {
    if (!isStaff && st.registerNumber.toUpperCase() !== studentReg.toUpperCase()) {
      return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = st.studentName.toLowerCase().includes(q);
      const matchReg = st.registerNumber.toLowerCase().includes(q);
      const matchRoll = st.rollNumber.toLowerCase().includes(q);
      const matchSidh = st.sidhProfileId.toLowerCase().includes(q);
      const matchCourse = st.courses.some(c => c.courseName.toLowerCase().includes(q));
      if (!matchName && !matchReg && !matchRoll && !matchSidh && !matchCourse) return false;
    }

    if (departmentFilter !== 'All' && st.department.toUpperCase() !== departmentFilter.toUpperCase()) return false;
    if (yearFilter !== 'All' && st.year !== yearFilter) return false;
    if (sectionFilter !== 'All' && st.section !== sectionFilter) return false;
    if (mentorFilter !== 'All' && st.mentorName !== mentorFilter) return false;

    if (statusFilter !== 'All') {
      if (statusFilter === 'COMPLETED' && st.completedCourses === 0) return false;
      if (statusFilter === 'IN PROGRESS' && st.inProgressCourses === 0) return false;
      if (statusFilter === 'ENROLLED' && st.enrolledCourses === 0) return false;
      if (statusFilter === 'Certificate Available' && st.certificatesAvailable === 0) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'name-asc') return a.studentName.localeCompare(b.studentName);
    if (sortBy === 'name-desc') return b.studentName.localeCompare(a.studentName);
    if (sortBy === 'reg-asc') return a.registerNumber.localeCompare(b.registerNumber);
    if (sortBy === 'reg-desc') return b.registerNumber.localeCompare(a.registerNumber);
    if (sortBy === 'courses-desc') return b.totalCourses - a.totalCourses;
    if (sortBy === 'completed-desc') return b.completedCourses - a.completedCourses;
    return 0;
  });

  // Calculate Primary Metrics
  const totalVerifiedStudents = new Set(courses.map(c => c.registerNumber)).size;
  const totalCoursesCount = courses.length;
  const completedCount = courses.filter(c => c.status === 'COMPLETED').length;
  const certificatesCount = courses.filter(c => c.certificateStatus === 'AVAILABLE' || c.certificateStatus === 'ISSUED').length;
  const verificationErrorsCount = verificationErrors.length + verificationIssues.length;

  // Trigger Excel Export (3 Sheets: STUDENT MASTER, COURSE DETAILS, VERIFICATION REPORT)
  const triggerExcelExport = (reportType: 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'REGISTERED' | 'ERRORS' = 'ALL') => {
    let datasetToExport = courses;
    if (reportType === 'COMPLETED') datasetToExport = courses.filter(c => c.status === 'COMPLETED');
    else if (reportType === 'IN_PROGRESS') datasetToExport = courses.filter(c => c.status === 'IN PROGRESS');
    else if (reportType === 'REGISTERED') datasetToExport = courses.filter(c => c.status === 'REGISTERED' || c.status === 'ENROLLED');

    const validation = validateSIDHDatasetForExport(datasetToExport, studentsList);
    if (!validation.isValid) {
      setExportBlockedModal({
        failedCount: validation.failedRecordsCount,
        errorMessages: validation.errorMessages
      });
      return;
    }

    exportSIDHCoursesToExcel(datasetToExport, {
      reportTitle: `SC SkillTrack - Student-wise SIDH Course Data (${reportType})`,
      filenamePrefix: `SC_SkillTrack_SIDH_Student_Courses_${reportType}`,
      students: studentsList,
      verificationErrors,
      auditLogs,
      publicUrlResult
    });
  };

  const selectedStudentCourses = selectedStudentRecord
    ? courses.filter(c => c.registerNumber.toUpperCase() === selectedStudentRecord.registerNumber.toUpperCase())
    : [];

  return (
    <div className="space-y-6">
      {/* Primary Module Header */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-7 bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white border border-slate-800 shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> OFFICIAL INSTITUTION MODULE
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                SOURCE: SIDH ✓
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-display flex items-center gap-2.5">
              🎓 SIDH COURSE TRACKER
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Student-wise course tracking, enrollment verification, completion auditing, and certificate validation for Skill India Digital Hub (SIDH).
            </p>
          </div>

          {/* Action Toolbar with Required Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Export Student Excel Button (Generates 3-Sheet Workbook) */}
            <button
              onClick={() => triggerExcelExport('ALL')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-emerald-600/30 border border-emerald-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              title="Export Student-wise 3-Sheet Excel (Student Master, Course Details, Verification Report)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>📥 Export Student Excel</span>
            </button>

            {/* Import Official SIDH Export Button */}
            {isStaff && (
              <button
                onClick={() => setActiveTab('import')}
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'import'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg'
                    : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-200 border-emerald-700/60'
                }`}
              >
                <Upload className="w-4 h-4 text-emerald-300" />
                <span>📁 Import Official SIDH Export</span>
              </button>
            )}

            {/* Upload Official SIDH Proof Button */}
            <button
              onClick={() => setActiveTab('proof')}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'proof'
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg'
                  : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-200 border-amber-700/60'
              }`}
            >
              <FileCheck className="w-4 h-4 text-amber-300" />
              <span>📄 Upload Official SIDH Proof</span>
            </button>

            {/* Download Student Report (PDF) */}
            <button
              onClick={() => exportSIDHCoursesToPDF(
                filteredCourses,
                'SC SkillTrack - SIDH Verified Student Courses Report',
                studentsList
              )}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs sm:text-sm font-bold border border-blue-500/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-300" />
              <span>📊 Download Student Report</span>
            </button>

            {/* Sync Button */}
            <button
              onClick={handleSyncSIDH}
              disabled={syncing}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Trigger SIDH Database Sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sync Status Notification */}
        {syncMessage && (
          <div className={`mt-4 p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
            syncMessage.type === 'success' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' :
            syncMessage.type === 'warning' ? 'bg-amber-950/60 text-amber-300 border-amber-800' :
            'bg-rose-950/60 text-rose-300 border-rose-800'
          }`}>
            <span className="flex items-center gap-2">
              {syncMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
              {syncMessage.text}
            </span>
            <button onClick={() => setSyncMessage(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Prominent Stat Cards (Total Students, Total Courses, Completed, Certificates, Verification Errors) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Students</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1.5">{totalVerifiedStudents}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Verified enrolled learners</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-blue-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Courses</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-300 mt-1.5">{totalCoursesCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Registered / Enrolled in SIDH</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Completed Courses</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-1.5">{completedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Passed final assessments</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Certificates</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300 mt-1.5">{certificatesCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Issued & downloadable</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Verification Errors</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300 mt-1.5">{verificationErrorsCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Flagged for staff review</div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {isStaff && (
          <button
            onClick={() => setActiveTab('evidence-cockpit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'evidence-cockpit'
                ? 'bg-blue-600 text-white shadow-md border border-blue-400 ring-2 ring-blue-500/30'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>🛡️ Staff Evidence Cockpit</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-md border border-blue-400 ring-2 ring-blue-500/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>🎓 Student & Course Master</span>
        </button>

        <button
          onClick={() => setActiveTab('browser-sync')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'browser-sync'
              ? 'bg-blue-600 text-white shadow-md border border-blue-400 ring-2 ring-blue-500/30'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Globe className="w-4 h-4 text-blue-400" />
          <span>🌐 Live Browser Sync (Zero Mock Data)</span>
        </button>

        {isStaff && (
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'import'
                ? 'bg-emerald-600 text-white shadow-md border border-emerald-400 ring-2 ring-emerald-500/30'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>📁 Import Official SIDH Export (Primary)</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('proof')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'proof'
              ? 'bg-amber-600 text-white shadow-md border border-amber-400'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4 text-amber-400" />
          <span>📄 Upload Official SIDH Proof</span>
        </button>

        <button
          onClick={() => setActiveTab('public-url')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'public-url'
              ? 'bg-indigo-600 text-white shadow-md border border-indigo-400'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>🔗 Public Digital CV Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('errors')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'errors'
              ? 'bg-rose-600 text-white shadow-md border border-rose-400'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>🔍 Verification Issues ({verificationErrorsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-slate-700 text-white shadow-md border border-slate-600'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-slate-400" />
          <span>📋 Import History</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-slate-700 text-white shadow-md border border-slate-600'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 text-slate-400" />
          <span>🔐 Sync Audit Log</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeTab === 'ai'
              ? 'bg-purple-600 text-white shadow-md border border-purple-400'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>📊 Gemini AI Insights</span>
        </button>

        {isStaff && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-slate-700 text-white shadow-md border border-slate-600'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>⚙️ Settings</span>
          </button>
        )}
      </div>

      {/* 0. STAFF EVIDENCE COCKPIT (VERIFIED EVIDENCE HUB) */}
      {activeTab === 'evidence-cockpit' && isStaff && (
        <SIDHStaffEvidenceDashboard />
      )}

      {/* 1. STUDENT & COURSE MASTER TRACKER TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {/* If Student Session and Computed Summary exists, show Evidence Card */}
          {!isStaff && studentSummary && (
            <SIDHStudentEvidenceCard
              summary={studentSummary}
              evidenceList={studentEvidenceList}
              pendingRequests={studentRequests}
              onOpenUploadProof={() => setActiveTab('proof')}
              onOpenImportExport={() => setActiveTab('import')}
              onOpenBrowserSync={() => setActiveTab('browser-sync')}
              onViewActivityDetails={() => setStudentActivityModalReg(studentReg)}
            />
          )}

          {/* Controls, Search, Filter & View Toggle Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search student name, register number, roll number, course title, course ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* View Mode Toggle: Student Master vs Course Details */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                <button
                  onClick={() => setViewMode('student-master')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'student-master'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>👥 Student Master View</span>
                </button>
                <button
                  onClick={() => setViewMode('course-details')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'course-details'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>📚 Course Details View</span>
                </button>
              </div>
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All">Dept: All</option>
                <option value="AI&DS">AI & DS</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="MECH">MECH</option>
                <option value="EEE">EEE</option>
                <option value="CIVIL">CIVIL</option>
              </select>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All">Year: All</option>
                <option value="I">Year I</option>
                <option value="II">Year II</option>
                <option value="III">Year III</option>
                <option value="IV">Year IV</option>
              </select>

              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All">Section: All</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="All">Status: All</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN PROGRESS">In Progress</option>
                <option value="ENROLLED">Enrolled</option>
                <option value="REGISTERED">Registered</option>
                <option value="Certificate Available">Certificate Available</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 sm:col-span-2 lg:col-span-2"
              >
                <option value="name-asc">Sort: Student Name (A-Z)</option>
                <option value="name-desc">Sort: Student Name (Z-A)</option>
                <option value="reg-asc">Sort: Register No (Ascending)</option>
                <option value="reg-desc">Sort: Register No (Descending)</option>
                <option value="courses-desc">Sort: Most Courses</option>
                <option value="completed-desc">Sort: Most Completed</option>
              </select>
            </div>
          </div>

          {/* VIEW 1: STUDENT MASTER VIEW (One Row per Student) */}
          {viewMode === 'student-master' && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">S.No</th>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5">Register Number</th>
                      <th className="px-4 py-3.5">Roll No</th>
                      <th className="px-4 py-3.5">Dept / Yr / Sec</th>
                      <th className="px-4 py-3.5 text-center">Total Courses</th>
                      <th className="px-4 py-3.5 text-center">Enrolled</th>
                      <th className="px-4 py-3.5 text-center">In Progress</th>
                      <th className="px-4 py-3.5 text-center">Completed</th>
                      <th className="px-4 py-3.5 text-center">Certificates</th>
                      <th className="px-4 py-3.5 text-center">Verification Status</th>
                      <th className="px-4 py-3.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-12 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                          Loading Student Master Records...
                        </td>
                      </tr>
                    ) : filteredStudentsMaster.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-12 text-center text-slate-400">
                          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                          <p className="font-bold text-sm text-slate-300">No student records found matching filters.</p>
                          <p className="text-xs text-slate-500 mt-1">Import official SIDH export files or upload certificates to sync student records.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredStudentsMaster.map((st, idx) => (
                        <tr
                          key={st.registerNumber}
                          onClick={() => setSelectedStudentRecord({
                            studentName: st.studentName,
                            registerNumber: st.registerNumber,
                            rollNumber: st.rollNumber,
                            department: st.department,
                            sidhId: st.sidhProfileId,
                            sidhProfileUrl: st.sidhProfileUrl,
                            section: st.section,
                            year: st.year,
                            mentorName: st.mentorName
                          })}
                          className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3.5 font-mono text-slate-500">{idx + 1}</td>
                          <td className="px-4 py-3.5 font-bold text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-300 flex items-center justify-center font-black text-xs shrink-0">
                              {st.studentName.charAt(0)}
                            </div>
                            <span className="truncate">{st.studentName}</span>
                          </td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-blue-300">
                            {st.registerNumber}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-400">
                            {st.rollNumber}
                          </td>
                          <td className="px-4 py-3.5 text-slate-300">
                            <span className="font-semibold">{st.department}</span> • Y{st.year} - Sec {st.section}
                          </td>
                          <td className="px-4 py-3.5 text-center font-black text-white">
                            {st.totalCourses}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-blue-400">
                            {st.enrolledCourses}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-amber-400">
                            {st.inProgressCourses}
                          </td>
                          <td className="px-4 py-3.5 text-center font-bold text-emerald-400">
                            {st.completedCourses}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {st.certificatesAvailable > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                🏅 {st.certificatesAvailable}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              st.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              st.verificationStatus === 'NOT ENROLLED' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                              'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {st.verificationStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentRecord({
                                  studentName: st.studentName,
                                  registerNumber: st.registerNumber,
                                  rollNumber: st.rollNumber,
                                  department: st.department,
                                  sidhId: st.sidhProfileId,
                                  sidhProfileUrl: st.sidhProfileUrl,
                                  section: st.section,
                                  year: st.year,
                                  mentorName: st.mentorName
                                });
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Courses
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setStudentActivityModalReg(st.registerNumber);
                              }}
                              className="ml-1 px-2 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold transition-colors cursor-pointer"
                              title="Open 9-Section SIDH Activity Profile"
                            >
                              Evidence
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

          {/* VIEW 2: COURSE DETAILS VIEW (One Row per Course) */}
          {viewMode === 'course-details' && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5">Register No</th>
                      <th className="px-4 py-3.5">Course Name & ID</th>
                      <th className="px-4 py-3.5">Provider</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-4 py-3.5 text-center">Progress</th>
                      <th className="px-4 py-3.5">Completion Date</th>
                      <th className="px-4 py-3.5 text-center">Certificate</th>
                      <th className="px-4 py-3.5 text-center">Source</th>
                      <th className="px-4 py-3.5 text-center">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                          Loading verified SIDH course records...
                        </td>
                      </tr>
                    ) : filteredCourses.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                          <GraduationCap className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                          <p className="font-bold text-sm text-slate-300">No verified SIDH course records found.</p>
                          <p className="text-xs text-slate-500 mt-1">Import official SIDH export files or upload proof certificates to populate courses.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCourses.map((course) => (
                        <tr
                          key={course.id}
                          onClick={() => setSelectedStudentRecord({
                            studentName: course.studentName,
                            registerNumber: course.registerNumber,
                            sidhId: course.sidhId,
                            section: course.section,
                            year: course.year,
                            mentorName: course.mentorName
                          })}
                          className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3.5 font-bold text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-300 flex items-center justify-center font-black text-xs shrink-0">
                              {course.studentName ? course.studentName.charAt(0) : '?'}
                            </div>
                            <span className="truncate">{course.studentName || 'Not Available'}</span>
                          </td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-blue-300">
                            {course.registerNumber || 'Not Available'}
                          </td>
                          <td className="px-4 py-3.5 max-w-xs">
                            <div className="font-semibold text-slate-100 truncate">{course.courseName || 'Not Available'}</div>
                            {course.courseId && <div className="text-[10px] font-mono text-slate-500">ID: {course.courseId}</div>}
                          </td>
                          <td className="px-4 py-3.5 text-slate-400">
                            {course.provider || 'Skill India Digital Hub'}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {course.status === 'COMPLETED' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                🟢 COMPLETED
                              </span>
                            ) : course.status === 'IN PROGRESS' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                🟡 IN PROGRESS
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                🔵 ENROLLED
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono text-slate-300 font-bold">
                            {course.progress ? `${course.progress}%` : (course.status === 'COMPLETED' ? '100%' : 'Not Available')}
                          </td>
                          <td className="px-4 py-3.5 text-slate-300 font-semibold">
                            {course.completionDate || 'Not Available'}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {course.certificateStatus === 'AVAILABLE' || course.certificateStatus === 'ISSUED' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                {course.certificateId ? `ID: ${course.certificateId}` : 'AVAILABLE'}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Not Available</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                              course.source?.includes('Proof') ? 'bg-amber-500/15 text-amber-300 border-amber-400/30' :
                              course.source?.includes('Profile') ? 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30' :
                              'bg-blue-500/15 text-blue-300 border border-blue-400/20'
                            }`}>
                              {course.source || 'SIDH Export'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              course.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {course.verificationStatus || 'VERIFIED'}
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
        </div>
      )}

      {/* 2. IMPORT OFFICIAL SIDH EXPORT TAB (PRIMARY RELIABLE METHOD) */}
      {activeTab === 'import' && isStaff && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    PRIMARY RELIABLE METHOD ✓
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    EXCEL / CSV / JSON
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Upload className="w-6 h-6 text-emerald-400" /> Import Official SIDH Export
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  Upload official Skill India Digital Hub exported files (.xlsx, .xls, .csv, .json). All records are parsed, verified against the SC SkillTrack student master database, and populated student-wise without inventing missing data.
                </p>
              </div>
            </div>

            {importSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-bold flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{importSuccess}</span>
              </div>
            )}

            {/* Drag & Drop File Upload Area */}
            <div className="p-8 rounded-3xl border-2 border-dashed border-slate-700 bg-slate-950 text-center space-y-4 hover:border-emerald-500/60 transition-colors">
              <FileSpreadsheet className="w-12 h-12 text-emerald-400 mx-auto" />
              <div>
                <div className="text-sm font-bold text-white">
                  {importFile ? importFile.name : 'Drag & drop Official SIDH Excel (.xlsx, .xls) or CSV file here'}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Supports multi-sheet official SIDH exports, student course sheets, and standard enrollment reports.
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.json,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSelectImportFile(f);
                  }}
                  className="hidden"
                  id="official-sidh-file-input"
                />
                <label
                  htmlFor="official-sidh-file-input"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg cursor-pointer transition-colors"
                >
                  {importFile ? 'Choose Another File' : 'Browse Files'}
                </label>
              </div>
            </div>

            {/* Validation & Preview Summary Banner */}
            {importValidationSummary && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400 font-medium">Parsed Records: <strong className="text-white font-bold">{importValidationSummary.total}</strong></span>
                  <span className="text-slate-400 font-medium">• Matched Students: <strong className="text-emerald-400 font-bold">{importValidationSummary.matchedStudents}</strong></span>
                  {importValidationSummary.unmatchedStudents > 0 && (
                    <span className="text-slate-400 font-medium">• New / Unmatched: <strong className="text-amber-400 font-bold">{importValidationSummary.unmatchedStudents}</strong></span>
                  )}
                </div>

                <button
                  onClick={handleCommitOfficialImport}
                  disabled={importing}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg border border-emerald-400/40 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>{importing ? 'Processing Verification Pipeline...' : '✓ Confirm & Import into Student Master'}</span>
                </button>
              </div>
            )}

            {/* Live Data Preview Table */}
            {parsedPreviewRecords.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" /> Parsed Records Preview (First {Math.min(parsedPreviewRecords.length, 10)} of {parsedPreviewRecords.length} rows)
                </h4>
                <div className="overflow-x-auto rounded-2xl bg-slate-950 border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase font-black">
                      <tr>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Register No</th>
                        <th className="p-3">Course Name</th>
                        <th className="p-3">Provider</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3">Completion Date</th>
                        <th className="p-3 text-center">Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {parsedPreviewRecords.slice(0, 10).map((r, i) => (
                        <tr key={i}>
                          <td className="p-3 font-bold text-white">{r.studentName || 'Not Available'}</td>
                          <td className="p-3 font-mono text-blue-300">{r.registerNumber || 'Not Available'}</td>
                          <td className="p-3 font-semibold text-slate-200">{r.courseName || 'Not Available'}</td>
                          <td className="p-3 text-slate-400">{r.provider || 'Skill India Digital Hub'}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300">
                              {r.status || 'COMPLETED'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{r.completionDate || 'Not Available'}</td>
                          <td className="p-3 text-center text-indigo-300">{r.certificateId || r.certificateStatus || 'Not Available'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. UPLOAD OFFICIAL SIDH PROOF TAB */}
      {activeTab === 'proof' && (
        <CertificateVerificationContainer 
          initialStudentReg={studentReg}
          initialStudentName={session.name || session.studentDetails?.studentName}
          currentUserRole={isStaff ? 'Staff' : 'Student'}
          currentUserId={studentReg || session.username}
        />
      )}

      {/* 4. VERIFY & SYNC PUBLIC SIDH DIGITAL CV TAB */}
      {activeTab === 'public-url' && (
        <SIDHPublicDigitalCVSyncPanel
          onSyncSuccess={fetchSIDHData}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
          initialRegNumber={studentReg}
          isStaff={isStaff}
        />
      )}

      {/* 2. LIVE USER-CONTROLLED BROWSER SYNC TAB */}
      {activeTab === 'browser-sync' && (
        <SIDHBrowserSyncPanel
          key={session.username}
          onSyncSuccess={fetchSIDHData}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
          sessionStudentName={session.name}
          sessionRegisterNumber={studentReg}
          isStaff={isStaff}
        />
      )}

      {/* 5. VERIFICATION ISSUES & ERRORS TAB */}
      {activeTab === 'errors' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" /> Verification Failures & Discrepancies Log
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Records flagged for manual coordinator review or formatting issues encountered during official imports.
              </p>
            </div>
            <button
              onClick={() => triggerExcelExport('ERRORS')}
              className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 text-xs font-bold border border-rose-500/40 cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Verification Report</span>
            </button>
          </div>

          {/* Verification Issues List */}
          {verificationIssues.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                Flagged Verification Issues ({verificationIssues.length})
              </h4>
              <div className="overflow-x-auto rounded-2xl bg-slate-950 border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-black">
                    <tr>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Register No</th>
                      <th className="p-3">Issue Reason</th>
                      <th className="p-3">Source</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Required Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {verificationIssues.map((iss) => (
                      <tr key={iss.id}>
                        <td className="p-3 font-bold text-white">{iss.studentName || 'Not Available'}</td>
                        <td className="p-3 font-mono text-blue-300">{iss.registerNumber || 'Not Available'}</td>
                        <td className="p-3 font-semibold text-rose-300">{iss.problem || iss.reason}</td>
                        <td className="p-3 text-slate-400">{iss.source}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300">
                            {iss.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{iss.requiredAction || 'Manual staff inspection required.'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* System Error Logs */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">
              Verification Engine Logs ({verificationErrors.length})
            </h4>
            {verificationErrors.length === 0 && verificationIssues.length === 0 ? (
              <div className="p-12 text-center text-slate-400 rounded-2xl bg-slate-950 border border-slate-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                <p className="font-bold text-slate-200">No verification failures or issues detected!</p>
                <p className="text-xs text-slate-500 mt-1">All processed SIDH records matched SC SkillTrack student master database.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {verificationErrors.map((err) => (
                  <div key={err.id} className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                      <span>Reason: {err.reason}</span>
                      <span className="text-slate-500">{new Date(err.timestamp).toLocaleString()}</span>
                    </div>
                    {err.rawRecord && (
                      <div className="text-[11px] font-mono text-slate-400 truncate">
                        Raw Record: {JSON.stringify(err.rawRecord)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. IMPORT HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> 📋 Official Import & Sync History
          </h3>

          <div className="overflow-x-auto rounded-2xl bg-slate-950 border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-black">
                <tr>
                  <th className="p-3">Import Date</th>
                  <th className="p-3">File Name</th>
                  <th className="p-3">Imported By</th>
                  <th className="p-3 text-center">Records Read</th>
                  <th className="p-3 text-center">Verified</th>
                  <th className="p-3 text-center">Rejected</th>
                  <th className="p-3 text-center">Duplicates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {importHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">No import history logs recorded yet.</td>
                  </tr>
                ) : (
                  importHistory.map((imp) => (
                    <tr key={imp.id}>
                      <td className="p-3 text-slate-400">{new Date(imp.importedDate).toLocaleString()}</td>
                      <td className="p-3 font-semibold text-slate-200">{imp.fileName}</td>
                      <td className="p-3 text-slate-300">{imp.importedBy}</td>
                      <td className="p-3 text-center font-bold text-white">{imp.recordsRead}</td>
                      <td className="p-3 text-center font-bold text-emerald-400">{imp.verified}</td>
                      <td className="p-3 text-center font-bold text-rose-400">{imp.rejected}</td>
                      <td className="p-3 text-center text-amber-400">{imp.duplicates}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. AUDIT LOG TAB */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" /> 🔐 SIDH Sync Audit Log
          </h3>

          <div className="overflow-x-auto rounded-2xl bg-slate-950 border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-black">
                <tr>
                  <th className="p-3">Sync ID</th>
                  <th className="p-3">Triggered By</th>
                  <th className="p-3">Started</th>
                  <th className="p-3">Completed</th>
                  <th className="p-3 text-center">Checked</th>
                  <th className="p-3 text-center">Verified</th>
                  <th className="p-3 text-center">New</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">No sync audit logs recorded yet.</td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.syncId}>
                      <td className="p-3 font-mono font-bold text-blue-300">{log.syncId}</td>
                      <td className="p-3 font-semibold text-slate-200">{log.triggeredBy}</td>
                      <td className="p-3 text-slate-400">{new Date(log.startedAt).toLocaleString()}</td>
                      <td className="p-3 text-slate-400">{new Date(log.completedAt).toLocaleString()}</td>
                      <td className="p-3 text-center">{log.studentsChecked}</td>
                      <td className="p-3 text-center text-emerald-400 font-bold">{log.studentsVerified}</td>
                      <td className="p-3 text-center text-blue-400 font-bold">{log.newCourses}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' :
                          log.status === 'PARTIAL' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-rose-500/20 text-rose-300'
                        }`}>
                          {log.status}
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

      {/* 8. GEMINI AI INSIGHTS TAB */}
      {activeTab === 'ai' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Gemini AI Analytics & Insights
            </h3>
            <span className="text-xs text-purple-300 font-semibold px-3 py-1 rounded-full bg-purple-950 border border-purple-800">
              AI ANALYSIS: Based strictly on verified SIDH data
            </span>
          </div>

          {!aiInsights ? (
            <div className="p-12 text-center text-slate-400">
              <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-3 animate-bounce" />
              <p className="font-bold text-slate-200">Click '📊 AI Analytics' above to generate an evaluation report.</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3 whitespace-pre-line bg-slate-950 p-6 rounded-2xl border border-slate-800">
              {aiInsights}
            </div>
          )}
        </div>
      )}

      {/* 9. SETTINGS TAB */}
      {activeTab === 'settings' && isStaff && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 max-w-2xl">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" /> SIDH API Connection & Schedule Settings
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Authorised SIDH API URL</label>
              <input
                type="text"
                placeholder="https://api.sidh.gov.in/v1"
                value={settingsForm.apiUrl}
                onChange={(e) => setSettingsForm({ ...settingsForm, apiUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Auto-Sync Schedule</label>
              <select
                value={settingsForm.autoSyncSchedule}
                onChange={(e) => setSettingsForm({ ...settingsForm, autoSyncSchedule: e.target.value as any })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200"
              >
                <option value="Daily">Daily Sync (Default)</option>
                <option value="Weekly">Weekly Sync</option>
                <option value="Manual">Manual Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoSyncCheck"
                checked={settingsForm.autoSyncEnabled}
                onChange={(e) => setSettingsForm({ ...settingsForm, autoSyncEnabled: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-blue-600"
              />
              <label htmlFor="autoSyncCheck" className="text-slate-300 font-bold">
                Enable Automatic Sync (Requires valid SIDH API connection)
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs cursor-pointer shadow-lg"
          >
            Save Settings
          </button>
        </form>
      )}

      {/* INDIVIDUAL STUDENT DETAILS DRAWER / MODAL */}
      {selectedStudentRecord && (
        <StudentCourseProfileModal
          student={selectedStudentRecord}
          courses={selectedStudentCourses}
          proofs={studentProofs}
          onClose={() => setSelectedStudentRecord(null)}
          onExportPDF={(reg) => {
            const stCourses = courses.filter(c => c.registerNumber.toUpperCase() === reg.toUpperCase());
            exportSIDHCoursesToPDF(
              stCourses,
              `SC SkillTrack - Student SIDH Course Report (${selectedStudentRecord.studentName})`,
              studentsList
            );
          }}
        />
      )}

      {/* 9-SECTION STUDENT ACTIVITY PROFILE & TIMELINE MODAL */}
      {studentActivityModalReg && (
        <StudentActivityProfileModal
          registerNumber={studentActivityModalReg}
          onClose={() => setStudentActivityModalReg(null)}
          onEvidenceUpdated={() => {
            fetchSIDHData();
          }}
        />
      )}

      {/* PRE-EXPORT VALIDATION BLOCK MODAL */}
      {exportBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-800 p-6 rounded-2xl max-w-lg w-full text-slate-100 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 font-black text-lg">
              <ShieldAlert className="w-6 h-6" /> EXPORT BLOCKED
            </div>
            <p className="text-xs text-slate-300">
              <span className="font-bold text-rose-300">{exportBlockedModal.failedCount} records</span> failed validation checks. SC SkillTrack prohibits exporting unverified student data to official Excel files.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-rose-300 space-y-1 max-h-32 overflow-y-auto">
              {exportBlockedModal.errorMessages.map((msg, i) => (
                <div key={i}>• {msg}</div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setExportBlockedModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Close & Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
