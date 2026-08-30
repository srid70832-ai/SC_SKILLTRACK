import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, UserCheck, FileText, Hash, ShieldCheck } from 'lucide-react';
import { SIDHEvidenceRecord } from '../../types';

interface StaffReviewEvidenceModalProps {
  evidenceId: string;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export const StaffReviewEvidenceModal: React.FC<StaffReviewEvidenceModalProps> = ({
  evidenceId,
  onClose,
  onReviewSubmitted
}) => {
  const [evidence, setEvidence] = useState<SIDHEvidenceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [notes, setNotes] = useState('');
  const [reviewerName, setReviewerName] = useState('Faculty Coordinator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchEvidence = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/sidh/evidence?studentRegisterNumber=&source=All&status=All`);
        const data = await res.json();
        if (data.evidence) {
          const found = data.evidence.find((e: any) => e.evidence_id === evidenceId);
          if (found) {
            setEvidence(found);
            setNotes(found.review_notes || '');
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (evidenceId) fetchEvidence();
  }, [evidenceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/sidh/staff-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence_id: evidenceId,
          decision,
          notes,
          reviewerName
        })
      }).then(r => r.json());

      if (res.success) {
        setStatusMessage({ type: 'success', text: `Evidence decision recorded: ${decision}.` });
        setTimeout(() => {
          onReviewSubmitted();
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to submit review.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network communication error.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
          Loading evidence details...
        </div>
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <p className="text-xs text-slate-300">Evidence record not found.</p>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl my-auto">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-400" /> Staff Manual Evidence Review
            </h3>
            <p className="text-xs text-slate-400">
              Audit submitted proof against SC SkillTrack student master database.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Evidence Card Overview */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <div>
              <span className="text-slate-400 block">Student:</span>
              <strong className="text-white">{evidence.studentName}</strong> ({evidence.registerNumber})
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {evidence.source}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block">COURSES INCLUDED</span>
              <span className="font-bold text-white">{evidence.courses_count} course(s)</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">COMPLETED</span>
              <span className="font-bold text-emerald-400">{evidence.completed_count}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">SUBMITTED DATE</span>
              <span className="text-slate-300">{new Date(evidence.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">MATCH CONFIDENCE</span>
              <span className="font-bold text-blue-400">{evidence.confidence || 95}%</span>
            </div>
          </div>

          {evidence.file_hash && (
            <div className="text-[10px] font-mono text-slate-500 truncate flex items-center gap-1">
              <Hash className="w-3 h-3 shrink-0" /> Hash: {evidence.file_hash}
            </div>
          )}
        </div>

        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            statusMessage.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Staff Review Decision</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDecision('VERIFIED')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                  decision === 'VERIFIED'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Approve as VERIFIED
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border ${
                  decision === 'REJECTED'
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <AlertCircle className="w-4 h-4" /> Reject (Invalid Proof)
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Reviewer Name / Title</label>
            <input
              type="text"
              value={reviewerName}
              onChange={e => setReviewerName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Review Notes / Justification</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g., Certificate ID verified against SIDH portal; student name and register number match student master records."
              required
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-600/20"
            >
              {isSubmitting ? 'Saving Decision...' : 'Commit Review Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
