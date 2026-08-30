import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  ShieldCheck, 
  Users, 
  Database,
  ArrowRight,
  Download
} from 'lucide-react';
import { SIDHEvidenceRecord } from '../../types';

interface SIDHExportImportPanelProps {
  onImportComplete?: () => void;
}

export const SIDHExportImportPanel: React.FC<SIDHExportImportPanelProps> = ({
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setStatusMessage({ type: 'info', text: `File selected: ${selected.name} (${Math.round(selected.size / 1024)} KB)` });
    setImportResult(null);

    // Try reading preview if text/json/csv
    if (selected.name.endsWith('.json') || selected.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          if (selected.name.endsWith('.json')) {
            const parsed = JSON.parse(content);
            setPreviewData(Array.isArray(parsed) ? parsed : (parsed.courses || parsed.data || []));
          } else {
            // Simple CSV preview lines
            const lines = content.split('\n').filter(l => l.trim().length > 0);
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const rows = lines.slice(1, 6).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
              const obj: any = {};
              headers.forEach((h, i) => { obj[h] = values[i] || ''; });
              return obj;
            });
            setPreviewData(rows);
          }
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsText(selected);
    }
  };

  const handleExecuteImport = async () => {
    if (!file && !previewData) {
      setStatusMessage({ type: 'error', text: 'Please select an official SIDH export file first.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: 'Uploading and parsing official SIDH export...' });

    try {
      const formData = new FormData();
      if (file) {
        formData.append('exportFile', file);
      }
      formData.append('importedBy', 'Official SIDH Portal Export Coordinator');

      const res = await fetch('/api/sidh/evidence/import-export', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setImportResult(data);
        setStatusMessage({
          type: 'success',
          text: `Successfully processed export: ${data.recordsImported} verified courses imported across ${data.evidenceCreated} student evidence record(s)!`
        });
        if (onImportComplete) onImportComplete();
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to process official export file.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error processing SIDH export.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateCSV = `Student Name,Register Number,Department,Course Name,Course ID,Provider,Enrollment Date,Completion Date,Status,Certificate Status,Certificate ID\nAnanya Sharma,711524AD001,AI & DS,Python for Data Science,CRS-PY-DS-01,Skill India Digital Hub,2025-01-10,2025-02-15,COMPLETED,AVAILABLE,CERT-SIDH-2025-001\nBalaji V,711524AD002,AI & DS,Cloud Computing Basics,CRS-CC-02,Skill India Digital Hub,2025-01-15,,IN PROGRESS,NOT AVAILABLE,`;
    const blob = new Blob([templateCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Official_SIDH_Export_Format.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Official Institutional SIDH Batch Ingestion</span>
            </div>
            <h3 className="text-xl font-black text-white">Import Official SIDH Portal Export</h3>
            <p className="text-xs text-slate-400">
              Upload official CSV, Excel, or JSON reports exported directly from the Skill India Digital Hub administrator or student portal.
            </p>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 shrink-0 transition-colors"
          >
            <Download className="w-4 h-4 text-blue-400" /> Download Format Template
          </button>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="p-8 rounded-3xl bg-slate-900 border-2 border-dashed border-slate-800 hover:border-slate-700 transition-colors text-center space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.json,.xlsx,.xls"
          className="hidden"
        />

        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
          <FileSpreadsheet className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">
            {file ? file.name : 'Select or drop official SIDH export file'}
          </h4>
          <p className="text-xs text-slate-400">
            Accepts official exports (.CSV, .XLSX, .JSON) with student IDs, course titles, completion dates, and certificate numbers.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-colors border border-slate-700"
          >
            <Upload className="w-4 h-4" /> Browse File
          </button>

          {file && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isProcessing}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting & Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Import & Commit Verified Evidence
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs flex items-start gap-3 border ${
          statusMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : statusMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <FileText className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <span className="font-semibold">{statusMessage.text}</span>
          </div>
        </div>
      )}

      {/* Result Metrics */}
      {importResult && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Import Verification Summary</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">COURSES INGESTED</span>
              <span className="text-2xl font-black text-white mt-1 block">{importResult.recordsImported}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">STUDENTS UPDATED</span>
              <span className="text-2xl font-black text-blue-400 mt-1 block">{importResult.evidenceCreated}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">TOTAL VERIFIED COURSES</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">{importResult.totalVerifiedCourses}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">FILE SHA-256</span>
              <span className="font-mono text-slate-400 text-[10px] truncate block mt-2">
                {importResult.auditEntry?.fileHash || 'Verified'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
