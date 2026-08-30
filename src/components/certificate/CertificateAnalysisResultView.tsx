import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  Edit3, 
  History, 
  Eye, 
  Check, 
  X, 
  Info, 
  Tag, 
  Calendar, 
  Building, 
  Award, 
  User, 
  Hash, 
  Globe, 
  Percent, 
  Clock, 
  Layers,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  GraduationCap
} from 'lucide-react';
import { CertificateVerificationRecord, ExtractedCertificateData, ExtractedEvidenceField } from '../../types';
import { CertificateAuditLogModal } from './CertificateAuditLogModal';
import { exportSingleCertificateToPdf, exportCertificatesToExcel } from '../../lib/certificateExportUtils';

interface CertificateAnalysisResultViewProps {
  certificate: CertificateVerificationRecord;
  currentUserRole?: 'Student' | 'Mentor' | 'Coordinator' | 'Admin' | 'Staff';
  currentUserId?: string;
  onUpdate?: () => void;
  onNewUpload?: () => void;
}

export const CertificateAnalysisResultView: React.FC<CertificateAnalysisResultViewProps> = ({
  certificate,
  currentUserRole = 'Student',
  currentUserId = 'USER',
  onUpdate,
  onNewUpload
}) => {
  const [activeEvidenceField, setActiveEvidenceField] = useState<{ fieldName: string; field: ExtractedEvidenceField<any> } | null>(null);
  const [showRawTextModal, setShowRawTextModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<{ [key: string]: string }>({});
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const ext = certificate.extractedData;
  const isStaff = currentUserRole === 'Staff' || currentUserRole === 'Coordinator' || currentUserRole === 'Admin' || currentUserRole === 'Mentor';

  // Format confidence badge
  const renderConfidenceBadge = (confidence: number, isNotAvailable: boolean) => {
    if (isNotAvailable || confidence === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
          — Not Available
        </span>
      );
    }
    if (confidence >= 0.85) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          Verified ({Math.round(confidence * 100)}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-950/40 text-amber-300 border border-amber-500/30">
        <AlertCircle className="w-3 h-3 text-amber-400" />
        Review Required ({Math.round(confidence * 100)}%)
      </span>
    );
  };

  const handleStaffReview = async (action: 'APPROVE' | 'REJECT' | 'STAFF_CORRECTED') => {
    setActionLoading(true);
    setSuccessMessage('');
    try {
      const payload: any = {
        certificateId: certificate.id,
        action,
        actorId: currentUserId,
        actorRole: currentUserRole,
        reviewNotes: reviewNotes || `Certificate ${action.toLowerCase()} by ${currentUserRole}`
      };

      if (action === 'STAFF_CORRECTED') {
        payload.correctedFields = editForm;
      }

      const res = await fetch('/api/certificate/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccessMessage(data.message || 'Review action applied successfully.');
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (err: any) {
      alert(err.message || 'Review action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const initEditForm = () => {
    setEditForm({
      studentName: ext?.studentName?.value || '',
      courseName: ext?.courseName?.value || '',
      courseCategory: ext?.courseCategory?.value || '',
      issuingOrganization: ext?.issuingOrganization?.value || '',
      certificateId: ext?.certificateId?.value || '',
      completionDate: ext?.completionDate?.value || '',
      score: ext?.score?.value || '',
      grade: ext?.grade?.value || ''
    });
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {certificate.id}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                certificate.analysisStatus === 'VERIFIED'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : certificate.analysisStatus === 'REJECTED'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}>
                {certificate.verificationStatus || certificate.analysisStatus}
              </span>
              {certificate.source === 'STAFF_CORRECTED' && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Staff Corrected
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {ext?.courseName?.value !== 'Not Available' ? ext?.courseName?.value : 'Verified Certificate Record'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Document: <span className="text-slate-200 font-mono">{certificate.fileName}</span> • Uploaded: {new Date(certificate.uploadedAt).toLocaleString()}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportSingleCertificateToPdf(certificate)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5"
              title="Download Institutional Verification PDF Dossier"
            >
              <Download className="w-3.5 h-3.5" />
              Export PDF Dossier
            </button>
            <button
              onClick={() => exportCertificatesToExcel([certificate], `SC_SkillTrack_${certificate.registerNumber || 'Certificate'}`)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              title="Download Certificate Data in Excel format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Excel (.xlsx)
            </button>
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              Audit Trail
            </button>
            <button
              onClick={() => setShowRawTextModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              Raw OCR Evidence
            </button>
            {onNewUpload && (
              <button
                onClick={onNewUpload}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
              >
                Upload Another Certificate
              </button>
            )}
          </div>
        </div>

        {/* Student Master Profile Details & Match Linkage Card */}
        {certificate.matchedStudent && (
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {certificate.matchedStudent.studentName || certificate.studentName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {certificate.matchedStudent.registerNumber || certificate.registerNumber}
                  </span>
                  {certificate.matchedStudent.rollNumber && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      Roll: {certificate.matchedStudent.rollNumber}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                  <span>Dept: <strong className="text-slate-200">{certificate.matchedStudent.department || 'AI & DS'}</strong></span>
                  <span>Year/Sec: <strong className="text-slate-200">{certificate.matchedStudent.year || '2025-2029'} - {certificate.matchedStudent.section || 'A'}</strong></span>
                  <span>Mentor: <strong className="text-slate-200">{certificate.matchedStudent.mentorName || 'Mrs.V.Prema / Mrs.B.Padmapriya'}</strong></span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Registry Linked
              </span>
            </div>
          </div>
        )}

        {/* Confidence & Matching Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Overall Confidence */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Extraction Clarity</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold font-mono text-cyan-400">
                {Math.round(certificate.overallConfidence * 100)}%
              </span>
              <span className="text-xs text-slate-400">Overall confidence</span>
            </div>
          </div>

          {/* Student Matching */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Student Registry Match</p>
            <div className="flex items-center gap-2 mt-1">
              {certificate.studentMatchStatus === 'MATCHED' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> MATCHED ({certificate.studentName})
                </span>
              ) : certificate.studentMatchStatus === 'MISMATCH' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                  <AlertCircle className="w-4 h-4" /> MISMATCH (Review Required)
                </span>
              ) : (
                <span className="text-xs text-slate-400">Not Available</span>
              )}
            </div>
          </div>

          {/* Official Verification URL */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Online Verification Link</p>
            <div className="mt-1">
              {ext?.verificationUrl?.value && ext.verificationUrl.value !== 'Not Available' ? (
                <a
                  href={ext.verificationUrl.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 underline truncate max-w-full"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  {ext.verificationUrl.value}
                </a>
              ) : (
                <span className="text-xs text-slate-500">Not printed on document</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid of 20 Observable Evidence Fields */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Observable Certificate Verification Fields
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Click &quot;View Evidence&quot; on any field to view the exact text and location extracted from the document.
            </p>
          </div>

          {isStaff && !isEditing && (
            <button
              onClick={initEditForm}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              Edit / Correct Fields
            </button>
          )}
        </div>

        {/* Edit Form Modal or In-Line Fields */}
        {isEditing ? (
          <div className="p-5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold text-amber-300 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4" /> Staff Correction Mode (Audited)
              </h5>
              <span className="text-[11px] text-slate-400 font-mono">Changes will be logged in audit trail</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Student Name</label>
                <input
                  type="text"
                  value={editForm.studentName || ''}
                  onChange={(e) => setEditForm({ ...editForm, studentName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Course Name</label>
                <input
                  type="text"
                  value={editForm.courseName || ''}
                  onChange={(e) => setEditForm({ ...editForm, courseName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Issuing Body / Provider</label>
                <input
                  type="text"
                  value={editForm.issuingOrganization || ''}
                  onChange={(e) => setEditForm({ ...editForm, issuingOrganization: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Certificate ID</label>
                <input
                  type="text"
                  value={editForm.certificateId || ''}
                  onChange={(e) => setEditForm({ ...editForm, certificateId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Completion Date</label>
                <input
                  type="text"
                  value={editForm.completionDate || ''}
                  onChange={(e) => setEditForm({ ...editForm, completionDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Score / Percentage</label>
                <input
                  type="text"
                  value={editForm.score || ''}
                  onChange={(e) => setEditForm({ ...editForm, score: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Staff Review Notes / Justification</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Reason for correcting fields..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStaffReview('STAFF_CORRECTED')}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                Save Staff Corrections
              </button>
            </div>
          </div>
        ) : null}

        {/* Structured Field Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'Student Name', icon: <User className="w-4 h-4 text-cyan-400" />, field: ext?.studentName, key: 'studentName' },
            { label: 'Course Name', icon: <Award className="w-4 h-4 text-indigo-400" />, field: ext?.courseName, key: 'courseName' },
            { label: 'Issuing Organization', icon: <Building className="w-4 h-4 text-blue-400" />, field: ext?.issuingOrganization, key: 'issuingOrganization' },
            { label: 'Platform', icon: <Layers className="w-4 h-4 text-purple-400" />, field: ext?.platform, key: 'platform' },
            { label: 'Certificate ID', icon: <Hash className="w-4 h-4 text-emerald-400" />, field: ext?.certificateId, key: 'certificateId' },
            { label: 'Credential ID', icon: <Hash className="w-4 h-4 text-teal-400" />, field: ext?.credentialId, key: 'credentialId' },
            { label: 'Registration ID', icon: <Hash className="w-4 h-4 text-slate-400" />, field: ext?.registrationId, key: 'registrationId' },
            { label: 'Completion Date', icon: <Calendar className="w-4 h-4 text-amber-400" />, field: ext?.completionDate, key: 'completionDate' },
            { label: 'Issue Date', icon: <Calendar className="w-4 h-4 text-yellow-400" />, field: ext?.issueDate, key: 'issueDate' },
            { label: 'Expiry Date', icon: <Calendar className="w-4 h-4 text-rose-400" />, field: ext?.expiryDate, key: 'expiryDate' },
            { label: 'Course Category', icon: <Tag className="w-4 h-4 text-cyan-400" />, field: ext?.courseCategory, key: 'courseCategory' },
            { label: 'Duration / Hours', icon: <Clock className="w-4 h-4 text-slate-400" />, field: ext?.duration, key: 'duration' },
            { label: 'Score', icon: <Percent className="w-4 h-4 text-emerald-400" />, field: ext?.score, key: 'score' },
            { label: 'Grade', icon: <Award className="w-4 h-4 text-amber-400" />, field: ext?.grade, key: 'grade' },
            { label: 'Percentage', icon: <Percent className="w-4 h-4 text-teal-400" />, field: ext?.percentage, key: 'percentage' },
            { label: 'Certificate Type', icon: <FileText className="w-4 h-4 text-blue-400" />, field: ext?.certificateType, key: 'certificateType' },
            { label: 'Issuer Website', icon: <Globe className="w-4 h-4 text-indigo-400" />, field: ext?.issuerWebsite, key: 'issuerWebsite' },
            { label: 'Online Verification URL', icon: <ExternalLink className="w-4 h-4 text-cyan-400" />, field: ext?.verificationUrl, key: 'verificationUrl' }
          ].map(({ label, icon, field, key }) => {
            const isNotAvailable = !field || field.value === 'Not Available' || field.value === '' || field.confidence === 0;

            return (
              <div 
                key={key} 
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      {icon}
                      {label}
                    </span>
                    {renderConfidenceBadge(field?.confidence || 0, isNotAvailable)}
                  </div>

                  <p className={`text-sm font-semibold truncate ${isNotAvailable ? 'text-slate-500 font-mono' : 'text-white'}`}>
                    {isNotAvailable ? 'Not Available' : String(field?.value)}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {isNotAvailable ? 'Zero visible evidence' : `${Math.round((field?.confidence || 0) * 100)}% clarity`}
                  </span>
                  
                  {field && (
                    <button
                      onClick={() => setActiveEvidenceField({ fieldName: label, field })}
                      className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
                    >
                      <Eye className="w-3 h-3" /> View Evidence
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Skills Extracted Section */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              Identified Skills / Technologies ({ext?.skills?.value?.length || 0})
            </h5>
            {renderConfidenceBadge(ext?.skills?.confidence || 0, !ext?.skills?.value || ext.skills.value.length === 0)}
          </div>

          {Array.isArray(ext?.skills?.value) && ext.skills.value.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {ext.skills.value.map((skill, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-cyan-950/40 text-cyan-300 border border-cyan-500/30"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-mono">No discrete skills explicitly listed on document.</p>
          )}
        </div>
      </div>

      {/* Staff Review Panel */}
      {isStaff && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Staff Verification & Approval Control</h4>
                <p className="text-xs text-slate-400">Approve to commit to verified SIDH course records, or Reject.</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              Role: {currentUserRole}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <input
              type="text"
              placeholder="Optional coordinator verification note..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleStaffReview('APPROVE')}
                disabled={actionLoading}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & Commit to Records
              </button>
              <button
                onClick={() => handleStaffReview('REJECT')}
                disabled={actionLoading}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Evidence Popover / Modal */}
      {activeEvidenceField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">
                  Field Evidence: {activeEvidenceField.fieldName}
                </h4>
              </div>
              <button 
                onClick={() => setActiveEvidenceField(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
                  Extracted Value
                </span>
                <p className="text-sm font-semibold text-white font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {Array.isArray(activeEvidenceField.field.value) 
                    ? activeEvidenceField.field.value.join(', ') 
                    : String(activeEvidenceField.field.value)}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block mb-1">
                  Observable Document Evidence
                </span>
                <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed font-mono">
                  &quot;{activeEvidenceField.field.evidence}&quot;
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">OCR Clarity Confidence</span>
                <span className="font-mono font-bold text-cyan-400">
                  {Math.round(activeEvidenceField.field.confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveEvidenceField(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Raw Extracted Text Modal */}
      {showRawTextModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Complete Raw Document OCR Evidence</h4>
              </div>
              <button 
                onClick={() => setShowRawTextModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-400">
                Below is the verbatim text parsed from the uploaded certificate document without alterations:
              </p>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {ext?.rawVisibleText || 'No raw text parsed.'}
              </pre>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setShowRawTextModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      <CertificateAuditLogModal
        certificateId={certificate.id}
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
    </div>
  );
};
