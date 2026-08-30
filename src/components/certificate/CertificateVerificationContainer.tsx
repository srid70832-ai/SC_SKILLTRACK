import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Upload, 
  History, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  RefreshCw, 
  ExternalLink, 
  Award, 
  Clock, 
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Eye,
  Download,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CertificateVerificationRecord } from '../../types';
import { CertificateUploadZone } from './CertificateUploadZone';
import { CertificateAnalysisResultView } from './CertificateAnalysisResultView';
import { CertificateAuditLogModal } from './CertificateAuditLogModal';
import { exportSingleCertificateToPdf, exportBatchCertificatesToPdf, exportCertificatesToExcel } from '../../lib/certificateExportUtils';

interface CertificateVerificationContainerProps {
  initialStudentReg?: string;
  initialStudentName?: string;
  currentUserRole?: 'Student' | 'Mentor' | 'Coordinator' | 'Admin' | 'Staff';
  currentUserId?: string;
}

export const CertificateVerificationContainer: React.FC<CertificateVerificationContainerProps> = ({
  initialStudentReg = '',
  initialStudentName = '',
  currentUserRole = 'Student',
  currentUserId = 'USER'
}) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'HISTORY'>('UPLOAD');
  const [currentCertificate, setCurrentCertificate] = useState<CertificateVerificationRecord | null>(null);
  const [certificates, setCertificates] = useState<CertificateVerificationRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedAuditCertId, setSelectedAuditCertId] = useState<string | null>(null);
  const [exportingExcel, setExportingExcel] = useState<boolean>(false);

  const fetchCertificates = async () => {
    setLoadingHistory(true);
    try {
      const studentParam = currentUserRole === 'Student' && initialStudentReg ? `studentId=${encodeURIComponent(initialStudentReg)}` : '';
      const res = await fetch(`/api/certificate/list?${studentParam}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.certificates)) {
        setCertificates(data.certificates);
      }
    } catch (err) {
      console.error('Failed to fetch certificate history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [initialStudentReg, currentUserRole]);

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const res = await fetch('/api/certificate/export-excel', { method: 'POST' });
      const data = await res.json();

      if (!data.success || !Array.isArray(data.records) || data.records.length === 0) {
        alert('No verified certificate records available to export.');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data.records);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Verified_Certificates');

      // Auto-fit column widths
      const maxProps = Object.keys(data.records[0] || {});
      worksheet['!cols'] = maxProps.map(key => ({
        wch: Math.max(key.length, 16)
      }));

      XLSX.writeFile(workbook, `SC_SkillTrack_Verified_Certificates_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Failed to export Excel:', err);
      alert('Failed to export verified certificates to Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch = 
      cert.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.registerNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.extractedData?.courseName?.value?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || cert.analysisStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              SC SkillTrack Certificate Verification Engine
            </h2>
            <p className="text-xs text-slate-400">
              Evidence-Based Gemini AI Analysis • Firebase Storage & Audit Trail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('UPLOAD')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'UPLOAD'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload & Verify
          </button>
          <button
            onClick={() => {
              setActiveTab('HISTORY');
              fetchCertificates();
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Verification History ({certificates.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'UPLOAD' ? (
        <div className="space-y-6">
          {currentCertificate ? (
            <CertificateAnalysisResultView
              certificate={currentCertificate}
              currentUserRole={currentUserRole}
              currentUserId={currentUserId}
              onUpdate={() => {
                fetchCertificates();
              }}
              onNewUpload={() => setCurrentCertificate(null)}
            />
          ) : (
            <CertificateUploadZone
              studentRegisterNumber={initialStudentReg}
              studentName={initialStudentName}
              onAnalysisComplete={(record) => {
                setCurrentCertificate(record);
                fetchCertificates();
              }}
            />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* History Controls */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student, course, or certificate ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="All">All Statuses</option>
                <option value="VERIFIED">Verified</option>
                <option value="ANALYZED">Analyzed</option>
                <option value="REVIEW_REQUIRED">Review Required</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={fetchCertificates}
                disabled={loadingHistory}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
                title="Refresh List"
              >
                <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => exportBatchCertificatesToPdf(filteredCertificates.length > 0 ? filteredCertificates : certificates)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5"
                title="Export Batch Verification Summary to PDF"
              >
                <FileText className="w-4 h-4" />
                Export Dossier (.pdf)
              </button>

              <button
                onClick={handleExportExcel}
                disabled={exportingExcel}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                title="Export Verified Certificates to Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Certificate Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            {loadingHistory ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm">Loading certificate verification logs...</p>
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Award className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No verified certificates found.</p>
                <p className="text-xs text-slate-500">
                  Upload a certificate or adjust search filters to view records.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Doc ID</th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Course Title</th>
                      <th className="px-4 py-3">Provider</th>
                      <th className="px-4 py-3">Confidence</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Uploaded</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredCertificates.map((cert) => {
                      const ext = cert.extractedData;
                      return (
                        <tr key={cert.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-mono text-cyan-400">{cert.id}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{cert.studentName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{cert.registerNumber}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-white line-clamp-1 max-w-xs">
                              {ext?.courseName?.value !== 'Not Available' ? ext?.courseName?.value : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-300">
                            {ext?.issuingOrganization?.value || ext?.platform?.value || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-semibold text-cyan-400">
                              {Math.round((cert.overallConfidence || 0) * 100)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              cert.analysisStatus === 'VERIFIED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : cert.analysisStatus === 'REJECTED'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}>
                              {cert.verificationStatus || cert.analysisStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-[11px]">
                            {new Date(cert.uploadedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setCurrentCertificate(cert);
                                  setActiveTab('UPLOAD');
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white transition-colors"
                                title="View Certificate Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => exportSingleCertificateToPdf(cert)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 transition-colors"
                                title="Download PDF Verification Dossier"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => exportCertificatesToExcel([cert], `SC_SkillTrack_${cert.registerNumber || 'Certificate'}`)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-900/50 text-emerald-400 hover:text-emerald-200 transition-colors"
                                title="Export Certificate Data to Excel"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSelectedAuditCertId(cert.id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                title="View Audit Trail"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Audit Modal */}
      {selectedAuditCertId && (
        <CertificateAuditLogModal
          certificateId={selectedAuditCertId}
          isOpen={!!selectedAuditCertId}
          onClose={() => setSelectedAuditCertId(null)}
        />
      )}
    </div>
  );
};
