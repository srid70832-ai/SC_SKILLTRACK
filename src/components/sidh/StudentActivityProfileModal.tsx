import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Clock, 
  FileText, 
  FileCheck,
  Award, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  UserCheck, 
  Send, 
  Download, 
  ExternalLink,
  ChevronRight,
  Eye,
  Hash,
  Filter,
  RefreshCw
} from 'lucide-react';
import { 
  SIDHStudentComputedSummary, 
  SIDHCourseRecord, 
  SIDHEvidenceRecord, 
  SIDHActivityTimelineEvent, 
  SIDHVerificationRequest, 
  SIDHStaffReview 
} from '../../types';

interface StudentActivityProfileModalProps {
  registerNumber: string;
  onClose: () => void;
  onRequestUpdate?: (regNum: string) => void;
  onOpenStaffReview?: (evidenceId: string) => void;
  onEvidenceUpdated?: () => void;
}

export const StudentActivityProfileModal: React.FC<StudentActivityProfileModalProps> = ({
  registerNumber,
  onClose,
  onRequestUpdate,
  onOpenStaffReview
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'certificates' | 'evidence' | 'timeline' | 'reviews' | 'requests'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studentData, setStudentData] = useState<{
    student: any;
    statusSummary: SIDHStudentComputedSummary;
    courses: SIDHCourseRecord[];
    certificates: SIDHCourseRecord[];
    evidence: SIDHEvidenceRecord[];
    timeline: SIDHActivityTimelineEvent[];
    verificationHistory: any[];
    staffReviews: SIDHStaffReview[];
    actionRequests: SIDHVerificationRequest[];
  } | null>(null);

  const fetchStudentProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sidh/student-activity/${encodeURIComponent(registerNumber)}`);
      const data = await res.json();
      if (res.ok && data.student) {
        setStudentData(data);
      } else {
        setError(data.error || 'Failed to load student activity profile.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching student profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (registerNumber) {
      fetchStudentProfile();
    }
  }, [registerNumber]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-md w-full shadow-2xl">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <h3 className="text-lg font-bold text-white">Loading Verified Activity Profile...</h3>
          <p className="text-xs text-slate-400">Fetching verified SIDH evidence, courses, and audit timeline for {registerNumber}</p>
        </div>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 max-w-md w-full shadow-2xl">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Profile Unavailable</h3>
          <p className="text-xs text-slate-400">{error || 'Student not found in master database.'}</p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { student, statusSummary, courses, certificates, evidence, timeline, staffReviews, actionRequests } = studentData;

  const renderStatusPill = (status: string) => {
    switch (status) {
      case 'VERIFIED ACTIVE':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">🟢 VERIFIED ACTIVE</span>;
      case 'RECENTLY SYNCED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-500/30">🔵 RECENTLY SYNCED</span>;
      case 'ACTION REQUIRED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/30">🟡 ACTION REQUIRED</span>;
      case 'NOT VERIFIED':
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-400 border border-rose-500/30">🔴 NOT VERIFIED</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-800 text-slate-400 border border-slate-700">⚪ NO ACTIVITY</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-900/90">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {renderStatusPill(statusSummary.status)}
              <span className="text-xs text-slate-400 font-mono">ID: {student.registerNumber}</span>
              {statusSummary.evidenceAgeDays !== null && (
                <span className="text-xs text-slate-400">
                  • Evidence Age: <strong className="text-slate-200">{statusSummary.evidenceAgeDays} days</strong>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              {student.studentName || student.name}
            </h2>
            <p className="text-xs text-slate-400">
              Department of {student.department || 'AI & DS'} • {student.year || 'I Year'} - Sec {student.section || 'A'} • Mentor: {student.mentorName || 'Mrs. B. Padmapriya'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onRequestUpdate && (
              <button
                onClick={() => onRequestUpdate(student.registerNumber)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Send update request"
              >
                <Send className="w-3.5 h-3.5" /> Request Update
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 flex gap-2 overflow-x-auto bg-slate-900/50 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> 1. Overview & Freshness
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'courses'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> 2. Verified Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'certificates'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" /> 3. Certificates ({certificates.length})
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> 4. Evidence Files ({evidence.length})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" /> 5. Activity Timeline ({timeline.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" /> 6. Staff Reviews ({staffReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" /> 7. Action Requests ({actionRequests.length})
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-950/40">
          
          {/* TAB 1: OVERVIEW & EVIDENCE FRESHNESS */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Student Master Info Grid */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Student Master Information</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Student Name</span>
                    <span className="font-bold text-white">{student.studentName || student.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Register Number</span>
                    <span className="font-mono font-bold text-blue-400">{student.registerNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Roll Number</span>
                    <span className="font-bold text-slate-200">{student.rollNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SIDH Profile ID</span>
                    <span className="font-mono text-purple-400">{student.sidhStudentId || `SIDH-${student.registerNumber}`}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Department</span>
                    <span className="font-semibold text-slate-200">{student.department || 'AI & DS'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Year & Section</span>
                    <span className="font-semibold text-slate-200">{student.year || 'I Year'} - {student.section || 'A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Faculty Mentor</span>
                    <span className="font-semibold text-slate-200">{student.mentorName || 'Mrs. B. Padmapriya'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Email Address</span>
                    <span className="text-slate-300 truncate block">{student.email || `${student.registerNumber?.toLowerCase()}@kitcbe.edu.in`}</span>
                  </div>
                </div>
              </div>

              {/* Status & Freshness Meter */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. SIDH Verification Status & Evidence Freshness</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-semibold block">Official Status</span>
                    <div className="mt-1">{renderStatusPill(statusSummary.status)}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-semibold block">Last Verified Evidence</span>
                    <div className="text-sm font-bold text-white mt-1">
                      {statusSummary.lastVerifiedAt 
                        ? new Date(statusSummary.lastVerifiedAt).toLocaleString()
                        : 'No Verified Evidence'
                      }
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-semibold block">Evidence Age</span>
                    <div className="text-sm font-bold text-slate-200 mt-1">
                      {statusSummary.evidenceAgeDays !== null ? `${statusSummary.evidenceAgeDays} Calendar Days` : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Freshness Status Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Evidence Freshness Status:</span>
                    <span className="font-semibold text-slate-200">
                      {statusSummary.evidenceAgeDays === null 
                        ? 'No Evidence Submitted'
                        : statusSummary.evidenceAgeDays <= 14 
                          ? '🟢 Fresh (<= 14 Days)' 
                          : statusSummary.evidenceAgeDays <= 30 
                            ? '🟡 Expiring (15-30 Days)' 
                            : '🔴 Stale (> 30 Days)'
                      }
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full transition-all ${
                        statusSummary.evidenceAgeDays === null ? 'w-0' :
                        statusSummary.evidenceAgeDays <= 14 ? 'w-full bg-emerald-500' :
                        statusSummary.evidenceAgeDays <= 30 ? 'w-2/3 bg-amber-500' :
                        'w-1/3 bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Summary Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold">Total Verified Courses</div>
                  <div className="text-2xl font-black text-white mt-1">{courses.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold">Completed Courses</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {courses.filter(c => c.status === 'COMPLETED').length}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold">Verified Certificates</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">{certificates.length}</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold">Evidence Archives</div>
                  <div className="text-2xl font-black text-blue-400 mt-1">{evidence.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFIED COURSES */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Verified Courses from Official Evidence ({courses.length})
                </h4>
              </div>

              {courses.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No Verified Courses Found</p>
                  <p className="text-xs text-slate-500">Student has not submitted verified SIDH course records or exports.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Course Name & ID</th>
                        <th className="py-3 px-4">Provider</th>
                        <th className="py-3 px-4">Status & Progress</th>
                        <th className="py-3 px-4">Completion Date</th>
                        <th className="py-3 px-4">Certificate ID</th>
                        <th className="py-3 px-4">Evidence Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                      {courses.map(course => (
                        <tr key={course.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{course.courseName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{course.courseId}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-300">{course.provider || 'SIDH'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                              course.status === 'COMPLETED' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {course.status}
                            </span>
                            {course.progress && <div className="text-[10px] text-slate-500 mt-0.5">{course.progress}</div>}
                          </td>
                          <td className="py-3 px-4 text-slate-300">{course.completionDate || 'In Progress'}</td>
                          <td className="py-3 px-4 font-mono text-amber-400">
                            {course.certificateId || (course.certificateStatus === 'AVAILABLE' ? 'Verified' : 'None')}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-400">
                            {course.source}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VERIFIED CERTIFICATES */}
          {activeTab === 'certificates' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Verified Certificates ({certificates.length})
              </h4>

              {certificates.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <Award className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No Verified Certificates Available</p>
                  <p className="text-xs text-slate-500">Official course completion certificates have not yet been submitted or verified.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {certificates.map(cert => (
                    <div key={cert.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-white">{cert.courseName}</div>
                          <div className="text-[11px] text-slate-400">Provider: {cert.provider}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          ✓ Verified
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                        <div className="text-slate-400 text-[10px]">CERTIFICATE ID</div>
                        <div className="text-amber-300 font-bold">{cert.certificateId || `CERT-${cert.id}`}</div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Completed: {cert.completionDate || 'Verified'}</span>
                        {cert.certificateUrl && (
                          <a 
                            href={cert.certificateUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                          >
                            View Proof <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EVIDENCE FILES & ARCHIVES */}
          {activeTab === 'evidence' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Evidence Archives ({evidence.length})
              </h4>

              {evidence.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No Evidence Records</p>
                  <p className="text-xs text-slate-500">Student has not submitted any official SIDH exports or proof files.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {evidence.map(ev => (
                    <div key={ev.evidence_id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-blue-400" />
                            {ev.original_filename || ev.source}
                          </div>
                          <div className="text-xs text-slate-400">
                            Source: <strong className="text-slate-200">{ev.source}</strong> • ID: {ev.evidence_id}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            ev.verification_status === 'VERIFIED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : ev.verification_status === 'PENDING_REVIEW'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {ev.verification_status}
                          </span>

                          {onOpenStaffReview && ev.verification_status === 'PENDING_REVIEW' && (
                            <button
                              onClick={() => onOpenStaffReview(ev.evidence_id)}
                              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                            >
                              Review Now
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded-xl bg-slate-950/60">
                          <span className="text-slate-500 text-[10px] block">COURSES INCLUDED</span>
                          <span className="font-bold text-white">{ev.courses_count}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/60">
                          <span className="text-slate-500 text-[10px] block">COMPLETED</span>
                          <span className="font-bold text-emerald-400">{ev.completed_count}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/60">
                          <span className="text-slate-500 text-[10px] block">SUBMITTED DATE</span>
                          <span className="text-slate-300">{new Date(ev.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/60">
                          <span className="text-slate-500 text-[10px] block">MATCH CONFIDENCE</span>
                          <span className="font-bold text-blue-400">{ev.confidence || 95}%</span>
                        </div>
                      </div>

                      {ev.file_hash && (
                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Hash className="w-3 h-3" /> SHA-256: {ev.file_hash.slice(0, 32)}...
                        </div>
                      )}

                      {ev.review_notes && (
                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300">
                          <span className="text-slate-500 font-semibold text-[10px] block">REVIEW NOTES:</span>
                          {ev.review_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ACTIVITY TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Activity Timeline ({timeline.length})
              </h4>

              {timeline.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <History className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No Timeline Events</p>
                  <p className="text-xs text-slate-500">Activity events will be recorded as evidence is submitted or verified.</p>
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                  {timeline.map((evt, idx) => (
                    <div key={evt.id || idx} className="flex items-start gap-4 relative">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 shrink-0 ${
                        evt.status === 'GREEN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                        evt.status === 'BLUE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                        evt.status === 'YELLOW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        •
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex-1 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="text-xs font-bold text-white">{evt.title}</div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(evt.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{evt.description}</p>
                        {evt.details && (
                          <div className="text-[11px] text-slate-400 font-mono pt-1">
                            {evt.details}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 pt-1">
                          Source: <span className="text-slate-400">{evt.source}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: STAFF REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Staff Manual Review Log ({staffReviews.length})
              </h4>

              {staffReviews.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <UserCheck className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No Staff Reviews Logged</p>
                  <p className="text-xs text-slate-500">Staff review decisions will appear here once manual verification is performed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {staffReviews.map(rev => (
                    <div key={rev.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white">{rev.reviewerName}</div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          rev.decision === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {rev.decision}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{rev.notes || 'No review notes provided.'}</p>
                      <div className="text-[10px] text-slate-500">Reviewed at: {new Date(rev.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: ACTION REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Staff Evidence Update Requests ({actionRequests.length})
                </h4>
                {onRequestUpdate && (
                  <button
                    onClick={() => onRequestUpdate(student.registerNumber)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Send New Request
                  </button>
                )}
              </div>

              {actionRequests.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <Send className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No Update Requests Sent</p>
                  <p className="text-xs text-slate-500">Staff has not requested evidence updates for this student.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actionRequests.map(reqItem => (
                    <div key={reqItem.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white">Requested by {reqItem.requestedBy}</div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          reqItem.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {reqItem.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">"{reqItem.message}"</p>
                      <div className="text-[10px] text-slate-500">Sent at: {new Date(reqItem.requestedAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-500">
          <span>SC SkillTrack Verified SIDH Evidence System</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
