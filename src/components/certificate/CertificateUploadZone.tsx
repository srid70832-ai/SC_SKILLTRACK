import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  Database, 
  Eye, 
  Lock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { CertificateVerificationRecord } from '../../types';

interface CertificateUploadZoneProps {
  studentRegisterNumber?: string;
  studentName?: string;
  onAnalysisComplete: (record: CertificateVerificationRecord) => void;
}

const ANALYSIS_PIPELINE_STEPS = [
  { id: 'upload', title: 'File Ingestion', desc: 'Securely uploading document buffer' },
  { id: 'storage', title: 'Firebase Storage', desc: 'Partitioning document path & audit trail' },
  { id: 'vision', title: 'Gemini Vision AI', desc: 'Analyzing visible text & certificate markers' },
  { id: 'anti_hallucinate', title: 'Anti-Hallucination Filter', desc: 'Validating observable evidence per field' },
  { id: 'match', title: 'Registry Matching', desc: 'Matching student profile & curriculum database' },
  { id: 'complete', title: 'Verification Ready', desc: 'Compiling structured report with confidence' }
];

export const CertificateUploadZone: React.FC<CertificateUploadZoneProps> = ({
  studentRegisterNumber = '',
  studentName = '',
  onAnalysisComplete
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!validExtensions.includes(extension)) {
      setErrorMessage(`Invalid file format. Supported formats: PDF, PNG, JPG, JPEG.`);
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrorMessage(`File size exceeds limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed: 10MB.`);
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setCurrentStepIndex(0);
    setErrorMessage('');

    // Advance step indicators smoothly
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < ANALYSIS_PIPELINE_STEPS.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    try {
      // Convert file to Base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(selectedFile);
      });

      const payload = {
        fileName: selectedFile.name,
        fileType: selectedFile.type || (selectedFile.name.endsWith('.pdf') ? 'application/pdf' : 'image/png'),
        fileSize: selectedFile.size,
        fileBase64,
        studentId: studentRegisterNumber || 'STUDENT',
        studentName: studentName || '',
        studentRegisterNumber: studentRegisterNumber || '',
        actorRole: 'Student'
      };

      const res = await fetch('/api/certificate/upload-and-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      clearInterval(interval);

      const responseText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error(`Server returned HTTP ${res.status}: ${responseText.slice(0, 160) || res.statusText || 'Analysis failed'}`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze certificate.');
      }

      setCurrentStepIndex(ANALYSIS_PIPELINE_STEPS.length - 1);
      setTimeout(() => {
        setIsAnalyzing(false);
        onAnalysisComplete(data.certificate);
      }, 600);

    } catch (err: any) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setErrorMessage(err.message || 'An error occurred while analyzing the certificate.');
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Policy Mandate Header */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/20 flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white tracking-tight">Zero-Hallucination Gemini AI Certificate Analysis</h4>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-semibold border border-cyan-500/30">
              STRICT EVIDENCE ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Extracts <strong>only observable, visible data</strong> directly supported by the uploaded document. Missing or unverified fields return <code className="text-cyan-300 font-mono">Not Available</code> with zero simulated data.
          </p>
        </div>
      </div>

      {/* Upload Box / Drag & Drop */}
      {!selectedFile && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer group ${
            dragActive 
              ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01]' 
              : 'border-slate-700/80 bg-slate-900/50 hover:border-cyan-500/50 hover:bg-slate-900/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300 shadow-lg shadow-cyan-500/5">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <p className="text-base font-semibold text-white">
                Drag & Drop certificate here, or <span className="text-cyan-400 underline underline-offset-2">Browse file</span>
              </p>
              <p className="text-xs text-slate-400">
                Supports official PDF certificates, PNG, JPG, or JPEG scanned documents (up to 10 MB)
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-mono text-slate-300">
                .PDF
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-mono text-slate-300">
                .PNG
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] font-mono text-slate-300">
                .JPG / .JPEG
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-[11px] font-mono text-cyan-300">
                Max: 10MB
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Selected File Card & Actions */}
      {selectedFile && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                {selectedFile.type.startsWith('image/') ? (
                  <ImageIcon className="w-6 h-6" />
                ) : (
                  <FileText className="w-6 h-6" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">
                  {selectedFile.name}
                </h4>
                <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-0.5">
                  <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span className="uppercase font-mono text-cyan-400">
                    {selectedFile.name.split('.').pop()}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> File Staged
                  </span>
                </div>
              </div>
            </div>

            {!isAnalyzing && (
              <button
                onClick={handleRemoveFile}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Remove / Change
              </button>
            )}
          </div>

          {/* Optional Image Thumbnail Preview */}
          {previewUrl && !isAnalyzing && (
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-56 flex items-center justify-center">
              <img 
                src={previewUrl} 
                alt="Certificate Preview" 
                className="object-contain max-h-56 w-auto"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Real-time Analysis Progress Pipeline */}
          {isAnalyzing ? (
            <div className="p-6 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-semibold text-white">Analyzing Certificate Evidence...</span>
                </div>
                <span className="text-xs font-mono text-cyan-400">
                  Step {currentStepIndex + 1} of {ANALYSIS_PIPELINE_STEPS.length}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                  style={{ width: `${((currentStepIndex + 1) / ANALYSIS_PIPELINE_STEPS.length) * 100}%` }}
                />
              </div>

              {/* Step checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {ANALYSIS_PIPELINE_STEPS.map((step, idx) => {
                  const isDone = idx < currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div 
                      key={step.id} 
                      className={`p-3 rounded-lg border flex items-start space-x-2.5 transition-colors ${
                        isDone 
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                          : isCurrent 
                          ? 'bg-cyan-950/30 border-cyan-500/50 text-white' 
                          : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isCurrent ? (
                          <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{step.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-xs text-slate-400">
                Ready to extract 20 structured verification fields with observable evidence.
              </p>
              <button
                onClick={handleAnalyze}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                Analyze Certificate with Gemini AI
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="flex-1">{errorMessage}</p>
        </div>
      )}
    </div>
  );
};
