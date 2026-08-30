import React, { useEffect, useState } from 'react';
import { 
  X, 
  History, 
  ShieldCheck, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Clock, 
  User, 
  FileText 
} from 'lucide-react';
import { CertificateAuditLogEntry } from '../../types';

interface CertificateAuditLogModalProps {
  certificateId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateAuditLogModal: React.FC<CertificateAuditLogModalProps> = ({
  certificateId,
  isOpen,
  onClose
}) => {
  const [logs, setLogs] = useState<CertificateAuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !certificateId) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/certificate/audit-logs?certificateId=${encodeURIComponent(certificateId)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.auditLogs)) {
          setLogs(data.auditLogs);
        }
      } catch (err) {
        console.error('Failed to fetch certificate audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [certificateId, isOpen]);

  if (!isOpen) return null;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'UPLOADED':
        return {
          icon: <Upload className="w-3.5 h-3.5 text-blue-400" />,
          label: 'File Uploaded',
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
        };
      case 'ANALYSIS_COMPLETED':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" />,
          label: 'Gemini Analysis Completed',
          bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
        };
      case 'APPROVED':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Verified & Approved',
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        };
      case 'REJECTED':
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Rejected',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        };
      case 'STAFF_CORRECTED':
        return {
          icon: <Edit3 className="w-3.5 h-3.5 text-amber-400" />,
          label: 'Staff Corrected',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        };
      default:
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />,
          label: action,
          bg: 'bg-slate-800 text-slate-300 border-slate-700'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Certificate Verification Audit Trail</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{certificateId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm">Loading verifiable audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No audit entries recorded yet.</p>
              <p className="text-xs text-slate-500 mt-1">Actions taken on this certificate will appear here.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {logs.map((log) => {
                const badge = getActionBadge(log.action);
                const formattedTime = new Date(log.timestamp).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });

                return (
                  <div key={log.id} className="relative group">
                    {/* Bullet marker */}
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-slate-900 border-2 border-cyan-400 ring-4 ring-slate-900" />
                    
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${badge.bg}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {formattedTime}
                        </span>
                      </div>

                      {log.notes && (
                        <p className="text-sm text-slate-300 mb-2 leading-relaxed">
                          {log.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-3 pt-2 mt-2 border-t border-slate-800/60 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          Actor: <strong className="text-slate-200 font-medium">{log.actorId}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {log.actorRole}
                        </span>
                        {log.previousStatus && log.newStatus && log.previousStatus !== log.newStatus && (
                          <span className="ml-auto text-slate-400 font-mono text-[11px]">
                            {log.previousStatus} &rarr; <span className="text-cyan-400 font-semibold">{log.newStatus}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
