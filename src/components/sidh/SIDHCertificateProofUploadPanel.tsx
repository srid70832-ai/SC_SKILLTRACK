import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  FileCheck, 
  Edit3, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export type OCRState = 'IDLE' | 'FILE_SELECTED' | 'EXTRACTING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'SAVED';

interface ExtractedProofData {
  studentName: string;
  registerNumber: string;
  sidhId?: string;
  courseName: string;
  courseId: string;
  provider: string;
  completionDate: string;
  certificateId: string;
  certificateUrl?: string;
  status: string;
  certificateStatus: string;
  validationRemarks?: string;
}

interface SIDHCertificateProofUploadPanelProps {
  initialStudentReg?: string;
  onCertificateSaved?: () => Promise<void> | void;
}

const OCR_STEPS = [
  { id: 'upload', label: 'Uploading file' },
  { id: 'read', label: 'Reading document' },
  { id: 'extract', label: 'Gemini AI OCR' },
  { id: 'validate', label: 'Validating markers' },
  { id: 'ready', label: 'Ready for review' }
];

export const SIDHCertificateProofUploadPanel: React.FC<SIDHCertificateProofUploadPanelProps> = ({
  initialStudentReg = '',
  onCertificateSaved
}) => {
  // State Machine
  const [ocrState, setOcrState] = useState<OCRState>('IDLE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorType, setErrorType] = useState<string>('');
  
  // Extracted Data & Form
  const [extractedData, setExtractedData] = useState<ExtractedProofData | null>(null);
  const [formData, setFormData] = useState<ExtractedProofData>({
    studentName: 'Not Available',
    registerNumber: initialStudentReg || 'Not Available',
    courseName: 'Not Available',
    courseId: 'Not Available',
    provider: 'Skill India Digital Hub',
    completionDate: 'Not Available',
    certificateId: 'Not Available',
    certificateUrl: 'Not Available',
    status: 'COMPLETED',
    certificateStatus: 'AVAILABLE'
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [proofId, setProofId] = useState<string>('');
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // References for cancellation & timers
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setOcrState('FILE_SELECTED');
      setErrorMessage('');
      setErrorType('');
    }
  };

  // Handle Cancel Extraction
  const handleCancelExtraction = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    
    setOcrState(selectedFile ? 'FILE_SELECTED' : 'IDLE');
    setActiveStepIndex(0);
    setElapsedSeconds(0);
  };

  // Reset to Upload Another File
  const handleReset = () => {
    handleCancelExtraction();
    setSelectedFile(null);
    setExtractedData(null);
    setOcrState('IDLE');
    setErrorMessage('');
    setErrorType('');
    setSaveSuccessMessage('');
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Start OCR Extraction with 30s timeout and step simulation
  const handleStartExtraction = async () => {
    if (!selectedFile) return;

    setOcrState('EXTRACTING');
    setActiveStepIndex(0);
    setElapsedSeconds(0);
    setErrorMessage('');
    setErrorType('');

    // Setup 30s timeout and AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Elapsed counter
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
      if (elapsed >= 30) {
        // Trigger timeout state
        controller.abort();
        if (timerRef.current) clearInterval(timerRef.current);
        if (stepTimerRef.current) clearInterval(stepTimerRef.current);
        setOcrState('TIMEOUT');
        setErrorMessage('OCR extraction timed out after 30 seconds. Please try again.');
      }
    }, 1000);

    // Dynamic Step Progression
    stepTimerRef.current = setInterval(() => {
      setActiveStepIndex((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2200);

    try {
      // 1. Read file as Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read certificate file.'));
        reader.readAsDataURL(selectedFile);
      });

      // 2. Fetch OCR API
      const res = await fetch('/api/sidh/upload-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentRegisterNumber: initialStudentReg || '',
          fileBase64: base64Data,
          fileName: selectedFile.name,
          mimeType: selectedFile.type || 'application/pdf'
        }),
        signal: controller.signal
      });

      const data = await res.json();

      if (timerRef.current) clearInterval(timerRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);

      if (res.ok && data.success) {
        setActiveStepIndex(4); // Ready for review
        const ext = data.extractedData || {};
        const pid = data.proof?.id || `PROOF-${Date.now()}`;
        setProofId(pid);
        
        const cleanExt: ExtractedProofData = {
          studentName: ext.studentName || 'Not Available',
          registerNumber: ext.registerNumber || initialStudentReg || 'Not Available',
          sidhId: ext.sidhId || 'Not Available',
          courseName: ext.courseName || 'Not Available',
          courseId: ext.courseId || 'Not Available',
          provider: ext.provider || 'Skill India Digital Hub',
          completionDate: ext.completionDate || 'Not Available',
          certificateId: ext.certificateId || 'Not Available',
          certificateUrl: ext.certificateUrl || 'Not Available',
          status: ext.status || 'COMPLETED',
          certificateStatus: ext.certificateStatus || 'AVAILABLE',
          validationRemarks: ext.validationRemarks || ''
        };

        setExtractedData(cleanExt);
        setFormData(cleanExt);
        setOcrState('SUCCESS');
      } else {
        setOcrState('FAILED');
        setErrorType(data.errorType || 'OCR_FAILED');
        if (data.errorType === 'AI_UNAVAILABLE') {
          setErrorMessage('AI OCR service unavailable. Please check GEMINI_API_KEY configuration.');
        } else if (data.errorType === 'NOT_VERIFIED') {
          setErrorMessage('Certificate could not be verified from the uploaded document. Please upload an official SIDH certificate.');
        } else {
          setErrorMessage(data.error || 'Certificate extraction failed. Please try again with the original SIDH certificate PDF/image.');
        }
      }
    } catch (err: any) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);

      if (err.name === 'AbortError') {
        // If timed out, state was set to TIMEOUT
        // If cancelled by user, it handled separately
        return;
      }

      setOcrState('FAILED');
      setErrorMessage(`Certificate extraction failed: ${err.message || 'Network error'}`);
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Confirm and Save to Database
  const handleConfirmAndSave = async () => {
    if (!formData.courseName || formData.courseName === 'Not Available') {
      alert('Valid course name is required to save verified certificate.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/sidh/confirm-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofId: proofId || `PROOF-${Date.now()}`,
          studentName: formData.studentName,
          registerNumber: formData.registerNumber,
          courseName: formData.courseName,
          courseId: formData.courseId,
          provider: formData.provider,
          completionDate: formData.completionDate,
          certificateId: formData.certificateId,
          certificateUrl: formData.certificateUrl,
          status: formData.status,
          certificateStatus: formData.certificateStatus
        })
      });

      const result = await res.json();
      if (result.success) {
        setOcrState('SAVED');
        setSaveSuccessMessage(result.message || 'Certificate successfully confirmed, matched with student master, and saved!');
        if (onCertificateSaved) {
          await onCertificateSaved();
        }
      } else {
        alert(`Failed to save certificate: ${result.error || 'Unknown error'}`);
      }
    } catch (saveErr: any) {
      alert(`Save error: ${saveErr.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="sidh-certificate-proof-panel">
      {/* Main Container */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Official Proof Verification
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                Gemini AI OCR + PDF Text
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-400" /> Upload Official SIDH Course Certificate / Proof
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed mt-1">
              Upload PDF or image certificates (PNG/JPG) issued by Skill India Digital Hub, NSDC, or recognized partners. Gemini AI OCR extracts verifiable details with a 30s safety timeout.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
              ocrState === 'SUCCESS' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
              ocrState === 'SAVED' ? 'bg-indigo-950 text-indigo-300 border-indigo-800' :
              ocrState === 'EXTRACTING' ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse' :
              ocrState === 'FAILED' || ocrState === 'TIMEOUT' ? 'bg-rose-950 text-rose-300 border-rose-800' :
              'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {ocrState === 'SUCCESS' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {ocrState === 'SAVED' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
              {ocrState === 'EXTRACTING' && <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
              {(ocrState === 'FAILED' || ocrState === 'TIMEOUT') && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
              <span>State: {ocrState}</span>
            </span>
          </div>
        </div>

        {/* 1. IDLE & FILE_SELECTED STATE: Upload Area */}
        {(ocrState === 'IDLE' || ocrState === 'FILE_SELECTED') && (
          <div className="space-y-4 max-w-2xl">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center space-y-3 ${
                selectedFile 
                  ? 'border-amber-500/60 bg-amber-950/20' 
                  : 'border-slate-700 bg-slate-950 hover:border-slate-600 hover:bg-slate-900/60'
              }`}
            >
              <FileText className={`w-12 h-12 mx-auto ${selectedFile ? 'text-amber-400' : 'text-slate-500'}`} />
              
              <div>
                <div className="text-sm font-bold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Select or drag & drop SIDH Certificate (PDF, PNG, JPG)'}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedFile 
                    ? `File selected • ${(selectedFile.size / 1024).toFixed(1)} KB • ${selectedFile.type || 'Document'}` 
                    : 'Supported formats: Official SIDH PDF Certificate, JPG, PNG up to 10MB'}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
                id="sidh-proof-input-file"
              />

              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedFile ? 'Change Selected File' : 'Browse Certificate File'}</span>
                </span>
              </div>
            </div>

            {/* Action Buttons for FILE_SELECTED */}
            {selectedFile && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  id="extract-proof-btn"
                  onClick={handleStartExtraction}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-lg transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Extract via Gemini AI OCR</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
                >
                  Remove File
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. EXTRACTING STATE: Real Loading Indicator & Progress Steps */}
        {ocrState === 'EXTRACTING' && (
          <div className="p-6 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Extracting via Gemini AI OCR...</h4>
                  <p className="text-xs text-slate-400">
                    Processing {selectedFile?.name} (Max 30s safety timeout)
                  </p>
                </div>
              </div>

              {/* Live Timer and Cancel Button */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{elapsedSeconds}s / 30s</span>
                </div>

                <button
                  type="button"
                  id="cancel-ocr-btn"
                  onClick={handleCancelExtraction}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>

            {/* Visual Step Progress Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              {OCR_STEPS.map((step, idx) => {
                const isDone = idx < activeStepIndex;
                const isCurrent = idx === activeStepIndex;
                return (
                  <div
                    key={step.id}
                    className={`p-2.5 rounded-xl border text-center space-y-1 transition-all ${
                      isDone
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                        : isCurrent
                        ? 'bg-amber-950/50 border-amber-500 text-amber-300 animate-pulse'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider">
                      Step {idx + 1}
                    </div>
                    <div className="text-xs font-bold truncate">
                      {step.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. SUCCESS STATE: Review Extracted Details and Confirm & Save */}
        {ocrState === 'SUCCESS' && extractedData && (
          <div className="space-y-5">
            {/* Banner */}
            <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-black text-white">Certificate data extracted successfully</div>
                  <div className="text-[11px] text-emerald-300/90">
                    The uploaded document is the strict source of truth. Review fields before database commit.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isEditing ? 'Done Editing' : 'Review / Edit Extracted Data'}</span>
              </button>
            </div>

            {/* Verification Preview Table / Editable Form */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Official Certificate Verification Preview
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Student Name</label>
                    <input
                      type="text"
                      value={formData.studentName}
                      onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Register Number</label>
                    <input
                      type="text"
                      value={formData.registerNumber}
                      onChange={e => setFormData({ ...formData, registerNumber: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-blue-300 font-mono font-semibold focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Course Name</label>
                    <input
                      type="text"
                      value={formData.courseName}
                      onChange={e => setFormData({ ...formData, courseName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Course ID</label>
                    <input
                      type="text"
                      value={formData.courseId}
                      onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Provider</label>
                    <input
                      type="text"
                      value={formData.provider}
                      onChange={e => setFormData({ ...formData, provider: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Completion Date</label>
                    <input
                      type="text"
                      value={formData.completionDate}
                      onChange={e => setFormData({ ...formData, completionDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Certificate ID</label>
                    <input
                      type="text"
                      value={formData.certificateId}
                      onChange={e => setFormData({ ...formData, certificateId: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Certificate URL</label>
                    <input
                      type="text"
                      value={formData.certificateUrl}
                      onChange={e => setFormData({ ...formData, certificateUrl: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Certificate Status</label>
                    <select
                      value={formData.certificateStatus}
                      onChange={e => setFormData({ ...formData, certificateStatus: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:border-amber-500 outline-none"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="NOT AVAILABLE">NOT AVAILABLE</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 font-bold block text-[11px]">Student Name</span>
                    <span className="text-white font-black text-sm">{formData.studentName}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 font-bold block text-[11px]">Register Number</span>
                    <span className="text-blue-300 font-mono font-bold text-sm">{formData.registerNumber}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 font-bold block text-[11px]">Course Name</span>
                    <span className="text-amber-300 font-bold text-sm">{formData.courseName}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 font-bold block text-[11px]">Course ID</span>
                    <span className="text-slate-200">{formData.courseId}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 font-bold block text-[11px]">Provider</span>
                    <span className="text-slate-200">{formData.provider}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 font-bold block text-[11px]">Completion Date</span>
                    <span className="text-slate-200">{formData.completionDate}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 font-bold block text-[11px]">Certificate ID</span>
                    <span className="text-emerald-300 font-mono">{formData.certificateId}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 font-bold block text-[11px]">Certificate URL</span>
                    <span className="text-slate-300 truncate block">{formData.certificateUrl}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 font-bold block text-[11px]">Certificate Status</span>
                    <span className="text-emerald-400 font-bold">{formData.certificateStatus}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons: Confirm & Save */}
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  id="confirm-and-save-btn"
                  onClick={handleConfirmAndSave}
                  disabled={isSaving || !formData.courseName || formData.courseName === 'Not Available'}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Matching & Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Confirm & Save</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
                >
                  Upload Another File
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. FAILED or TIMEOUT STATE */}
        {(ocrState === 'FAILED' || ocrState === 'TIMEOUT') && (
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800/60 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-rose-300">
                  {ocrState === 'TIMEOUT' ? 'Extraction Timed Out' : 'Certificate extraction failed'}
                </h4>
                <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
                  {errorMessage || 'Please try again with the original SIDH certificate PDF/image.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Tip: Ensure the file is an official Skill India Digital Hub certificate with clear legible text or high-resolution image.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                id="try-again-btn"
                onClick={handleStartExtraction}
                disabled={!selectedFile}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                id="upload-another-btn"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer transition-colors"
              >
                Upload Another File
              </button>
            </div>
          </div>
        )}

        {/* 5. SAVED STATE */}
        {ocrState === 'SAVED' && (
          <div className="p-6 rounded-2xl bg-emerald-950/50 border border-emerald-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-300">Certificate Verified & Saved!</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {saveSuccessMessage || 'Matched with Student Master and certificate status updated.'}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Upload Another Certificate</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
