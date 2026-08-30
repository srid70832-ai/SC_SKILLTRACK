import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  Award, 
  BookOpen, 
  RefreshCw, 
  Upload, 
  Globe, 
  ChevronRight, 
  FileText,
  Info,
  Send
} from 'lucide-react';
import { SIDHStudentComputedSummary, SIDHEvidenceRecord, SIDHVerificationRequest } from '../../types';

interface SIDHStudentEvidenceCardProps {
  summary: SIDHStudentComputedSummary;
  evidenceList?: SIDHEvidenceRecord[];
  pendingRequests?: SIDHVerificationRequest[];
  onOpenUploadProof: () => void;
  onOpenImportExport: () => void;
  onOpenBrowserSync: () => void;
  onViewActivityDetails: () => void;
}

export const SIDHStudentEvidenceCard: React.FC<SIDHStudentEvidenceCardProps> = ({
  summary,
  evidenceList = [],
  pendingRequests = [],
  onOpenUploadProof,
  onOpenImportExport,
  onOpenBrowserSync,
  onViewActivityDetails
}) => {
  const getStatusBadge = () => {
    switch (summary.status) {
      case 'VERIFIED ACTIVE':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            🟢 VERIFIED ACTIVE (Fresh Evidence)
          </div>
        );
      case 'RECENTLY SYNCED':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            🔵 RECENTLY SYNCED (Within 7 Days)
          </div>
        );
      case 'ACTION REQUIRED':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            🟡 ACTION REQUIRED (Evidence Outdated)
          </div>
        );
      case 'NOT VERIFIED':
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs">
            <AlertCircle className="w-3.5 h-3.5" />
            🔴 NOT VERIFIED (Review Required)
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            ⚪ NO ACTIVITY (No Evidence Submitted)
          </div>
        );
    }
  };

  const getFreshnessDescription = () => {
    if (summary.evidenceAgeDays === null) {
      return "No official SIDH evidence has been submitted yet.";
    }
    if (summary.evidenceAgeDays === 0) {
      return "Evidence submitted and verified today.";
    }
    if (summary.evidenceAgeDays === 1) {
      return "Evidence verified 1 day ago.";
    }
    return `Evidence verified ${summary.evidenceAgeDays} days ago (${new Date(summary.lastVerifiedAt!).toLocaleDateString()}).`;
  };

  const activeRequest = pendingRequests.find(r => r.status === 'REQUEST_SENT' || r.status === 'REQUEST_PENDING');

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Verification Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Official Skill India Digital Hub (SIDH) Evidence Tracking</span>
          </div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            My SIDH Verification Status
          </h3>
          <p className="text-xs text-slate-400">
            Student: <span className="font-semibold text-slate-200">{summary.studentName}</span> ({summary.registerNumber})
          </p>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Active Staff Request Alert */}
      {activeRequest && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-amber-300">Staff Evidence Update Requested</div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                "{activeRequest.message}" — Requested by {activeRequest.requestedBy}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenUploadProof}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 shadow-sm"
          >
            Submit Proof Now
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Verified Courses
          </div>
          <div className="text-2xl font-black text-white">{summary.coursesCount}</div>
          <div className="text-[10px] text-slate-400">Registered in SIDH</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> Completed Courses
          </div>
          <div className="text-2xl font-black text-emerald-400">{summary.completedCount}</div>
          <div className="text-[10px] text-slate-400">100% finished</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" /> Verified Certificates
          </div>
          <div className="text-2xl font-black text-amber-400">{summary.certificatesCount}</div>
          <div className="text-[10px] text-slate-400">Official certificate IDs</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" /> Evidence Freshness
          </div>
          <div className="text-sm font-black text-slate-200">
            {summary.evidenceAgeDays !== null ? `${summary.evidenceAgeDays}d old` : 'None'}
          </div>
          <div className="text-[10px] text-slate-400">
            {summary.evidenceSource ? summary.evidenceSource.replace(/_/g, ' ') : 'Unverified'}
          </div>
        </div>
      </div>

      {/* Freshness & Information Footnote */}
      <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{getFreshnessDescription()}</span>
        </div>
        <button
          onClick={onViewActivityDetails}
          className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0 transition-colors"
        >
          View Full Activity Timeline <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action Buttons for Evidence Submission */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          onClick={onOpenUploadProof}
          className="flex-1 min-w-[170px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
        >
          <Upload className="w-4 h-4" /> Upload Certificate Proof
        </button>

        <button
          onClick={onOpenImportExport}
          className="flex-1 min-w-[170px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <FileText className="w-4 h-4 text-emerald-400" /> Import Official SIDH Export
        </button>

        <button
          onClick={onOpenBrowserSync}
          className="flex-1 min-w-[170px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Globe className="w-4 h-4 text-blue-400" /> Student Browser Sync
        </button>
      </div>
    </div>
  );
};
