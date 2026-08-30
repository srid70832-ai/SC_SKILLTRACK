import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, GraduationCap, CheckCircle2, Clock, AlertCircle, Award, 
  ExternalLink, Calendar, BookOpen, ShieldCheck, User, Layers, FileText
} from 'lucide-react';
import { SIDHCourseRecord } from '../../types';

interface StudentCourseProfileModalProps {
  student: {
    studentName: string;
    registerNumber: string;
    rollNumber?: string;
    department?: string;
    sidhId?: string;
    sidhProfileUrl?: string;
    section?: string;
    year?: string;
    mentorName?: string;
  } | null;
  courses: SIDHCourseRecord[];
  proofs?: any[];
  onClose: () => void;
  onExportPDF?: (studentReg: string) => void;
}

export default function StudentCourseProfileModal({
  student,
  courses,
  proofs = [],
  onClose,
  onExportPDF
}: StudentCourseProfileModalProps) {
  if (!student) return null;

  const completedCount = courses.filter(c => c.status === 'COMPLETED').length;
  const inProgressCount = courses.filter(c => c.status === 'IN PROGRESS').length;
  const enrolledCount = courses.filter(c => c.status === 'ENROLLED' || c.status === 'REGISTERED').length;
  const certificateCount = courses.filter(c => c.certificateStatus === 'AVAILABLE' || c.certificateStatus === 'ISSUED').length;

  const studentProofs = proofs.filter(p => 
    p.registerNumber && student.registerNumber &&
    p.registerNumber.toUpperCase() === student.registerNumber.toUpperCase()
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-slate-100 my-auto"
        >
          {/* Header */}
          <div className="relative p-5 sm:p-7 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border-b border-slate-800">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg border border-blue-400/30">
                  {student.studentName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
                      {student.studentName}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" /> VERIFIED STUDENT
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-medium flex items-center gap-2 flex-wrap">
                    <span>Reg No: <strong className="text-blue-300">{student.registerNumber}</strong></span>
                    {student.rollNumber && <span>• Roll: <strong className="text-slate-200">{student.rollNumber}</strong></span>}
                    {student.department && <span>• Dept: <strong className="text-slate-200">{student.department}</strong></span>}
                    <span>• Year {student.year || 'I'}</span>
                    <span>• Section {student.section || 'A'}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  Mentor: {student.mentorName || 'Faculty Coordinator'}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  SIDH ID: {student.sidhId || `SIDH-${student.registerNumber}`}
                </span>
                {student.sidhProfileUrl && (
                  <a
                    href={student.sidhProfileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    SIDH Profile
                  </a>
                )}
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Verified Courses</div>
                <div className="text-xl font-black text-white mt-1">{courses.length}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">Completed</div>
                <div className="text-xl font-black text-emerald-300 mt-1">{completedCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">In Progress</div>
                <div className="text-xl font-black text-amber-300 mt-1">{inProgressCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/50">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">Certificates</div>
                <div className="text-xl font-black text-indigo-300 mt-1">{certificateCount}</div>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-7 space-y-6 max-h-[60vh] overflow-y-auto">
            <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" /> Verified Course History ({courses.length})
            </h3>

            {courses.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-850 border border-slate-800 text-slate-400">
                <GraduationCap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-300">No Verified SIDH Courses Found for this Student</p>
                <p className="text-xs text-slate-500 mt-1">Once courses are verified via SIDH sync or official import, they will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-blue-500/50 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-white">
                            {course.courseName}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            SOURCE: SIDH ✓
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Provider: <span className="text-slate-200 font-medium">{course.provider}</span> • Course ID: <span className="text-slate-300 font-mono">{course.courseId}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {course.status === 'COMPLETED' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> COMPLETED
                          </span>
                        ) : course.status === 'IN PROGRESS' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" /> IN PROGRESS
                          </span>
                        ) : course.status === 'ENROLLED' ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-blue-400" /> ENROLLED
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-700 text-slate-300 border border-slate-600">
                            {course.status}
                          </span>
                        )}

                        {course.certificateStatus === 'AVAILABLE' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                            <Award className="w-3 h-3 text-indigo-400" /> CERTIFICATE AVAILABLE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-700/50 text-xs text-slate-400">
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">Registration Date</span>
                        <span className="text-slate-200 font-medium">{course.registrationDate || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">Enrollment Date</span>
                        <span className="text-slate-200 font-medium">{course.enrollmentDate || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">Completion Date</span>
                        <span className="text-slate-200 font-medium">{course.completionDate || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">Last Verified</span>
                        <span className="text-slate-200 font-medium">
                          {course.lastVerifiedAt ? new Date(course.lastVerifiedAt).toISOString().slice(0, 10) : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Timeline */}
                    {course.timeline && course.timeline.length > 0 && (
                      <div className="pt-2">
                        <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">
                          Verification Audit Timeline
                        </div>
                        <div className="space-y-1.5 pl-3 border-l-2 border-slate-700 text-xs">
                          {course.timeline.map((t, idx) => (
                            <div key={idx} className="relative pl-3">
                              <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-blue-400" />
                              <div className="font-bold text-slate-200">{t.action} <span className="text-slate-400 font-normal">({t.date})</span></div>
                              <div className="text-slate-400 text-[11px]">{t.details}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Student Uploaded Proofs Section */}
            {studentProofs.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" /> Uploaded Official SIDH Proofs & Certificates ({studentProofs.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {studentProofs.map((proof: any) => (
                    <div key={proof.id} className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-200 truncate">{proof.fileName || 'SIDH_Certificate.pdf'}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300">
                          {proof.verificationStatus || 'VERIFIED'}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Extracted Course: <strong className="text-slate-200">{proof.extractedData?.courseName || 'Official Course Certificate'}</strong>
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        Uploaded: {proof.uploadedAt ? new Date(proof.uploadedAt).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> Verified directly from SC SkillTrack Database
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onExportPDF && (
                <button
                  onClick={() => onExportPDF(student.registerNumber)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Student Report</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
