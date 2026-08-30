import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2, User } from 'lucide-react';

interface StaffRequestUpdateModalProps {
  registerNumber: string;
  studentName?: string;
  onClose: () => void;
  onRequestSent: () => void;
}

export const StaffRequestUpdateModal: React.FC<StaffRequestUpdateModalProps> = ({
  registerNumber,
  studentName,
  onClose,
  onRequestSent
}) => {
  const [message, setMessage] = useState("Please provide your latest official SIDH export or certificate.");
  const [requestedBy, setRequestedBy] = useState("Faculty Mentor / Department Coordinator");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/sidh/requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registerNumber,
          requestedBy,
          customMessage: message
        })
      }).then(r => r.json());

      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message || 'Evidence request dispatched successfully.' });
        setTimeout(() => {
          onRequestSent();
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to send verification request.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network communication failure.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-400" /> Request SIDH Evidence Update
            </h3>
            <p className="text-xs text-slate-400">
              Notify student to provide recent verified official SIDH proof or export.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student Target Summary */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="text-slate-400 block">Target Student:</span>
            <strong className="text-white">{studentName || 'Student'}</strong> ({registerNumber})
          </div>
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
            <label className="text-xs font-semibold text-slate-300">Requester Designation / Name</label>
            <input
              type="text"
              value={requestedBy}
              onChange={e => setRequestedBy(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Request Message to Student</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
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
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
