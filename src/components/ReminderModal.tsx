import React, { useState, useEffect } from 'react';
import { 
  X, Copy, Check, Share2, AlertCircle, CheckCircle2, 
  Send, Users, Sparkles, MessageSquare, ShieldCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import { NotificationService, ReminderPayload } from '../services/notificationService';

interface StudentItem {
  rollNumber: string;
  registerNumber?: string;
  studentName: string;
  department?: string;
  section?: string;
  phoneNumber?: string;
  email?: string;
}

interface PollItem {
  id: string;
  title: string;
  question?: string;
  deadline: string;
  targetDepartment?: string;
  targetSection?: string;
}

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  poll: PollItem | null;
  pendingStudents: StudentItem[];
  onSuccessToast?: (msg: string) => void;
}

export default function ReminderModal({
  isOpen,
  onClose,
  poll,
  pendingStudents,
  onSuccessToast
}: ReminderModalProps) {
  const [copied, setCopied] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [showStudentList, setShowStudentList] = useState(false);
  const [dispatchMethod, setDispatchMethod] = useState<'whatsapp_web' | 'whatsapp_business_api' | 'sms_gateway'>('whatsapp_web');
  const [isSending, setIsSending] = useState(false);

  // Construct origin poll link
  const pollLink = poll ? `${window.location.origin}/?poll=${poll.id}` : '';

  // Generate reminder message when modal opens or poll/students change
  useEffect(() => {
    if (poll) {
      const payload: ReminderPayload = {
        pollId: poll.id,
        pollTitle: poll.title,
        deadline: poll.deadline,
        pollLink: pollLink,
        pendingStudents: pendingStudents
      };
      const formatted = NotificationService.formatReminderMessage(payload);
      setCustomMessage(formatted);
    }
  }, [poll, pendingStudents, pollLink]);

  if (!isOpen || !poll) return null;

  const noPending = pendingStudents.length === 0;

  const payload: ReminderPayload = {
    pollId: poll.id,
    pollTitle: poll.title,
    deadline: poll.deadline,
    pollLink: pollLink,
    pendingStudents: pendingStudents
  };

  const handleCopy = async () => {
    await NotificationService.dispatchReminder('clipboard', payload, customMessage);
    setCopied(true);
    if (onSuccessToast) onSuccessToast("Reminder message copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = async () => {
    setIsSending(true);
    try {
      await NotificationService.dispatchReminder(dispatchMethod, payload, customMessage);
      if (onSuccessToast) onSuccessToast("Opening WhatsApp share window...");
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-display">Send Poll Reminder</h3>
              <p className="text-xs text-slate-400">Review non-responders and initiate message dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* CASE 1: All students responded */}
          {noPending ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h4 className="text-base font-extrabold text-emerald-950 font-display">
                All students have already responded.
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                100% participation achieved for <strong className="text-emerald-950">{poll.title}</strong>! No pending reminders are required.
              </p>
            </div>
          ) : (
            /* CASE 2: Pending non-responders list & preview dialog */
            <>
              {/* Target Poll & Non-responders Badge */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Selected Poll
                  </span>
                  <span className="text-sm font-bold text-slate-900 line-clamp-1">{poll.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>{pendingStudents.length} Non-responder(s)</span>
                  </span>
                </div>
              </div>

              {/* Collapsible Pending Student Name List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setShowStudentList(!showStudentList)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  <span className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>View Non-Responding Student Names ({pendingStudents.length})</span>
                  </span>
                  {showStudentList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showStudentList && (
                  <div className="p-3 max-h-40 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {pendingStudents.map((st, i) => (
                      <div key={i} className="py-2 flex items-center justify-between">
                        <span className="font-semibold text-slate-800">{st.studentName}</span>
                        <span className="font-mono text-slate-500 text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                          {st.registerNumber || st.rollNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="reminderMessage" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Reminder Message Preview</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Editable review draft</span>
                </div>

                <textarea
                  id="reminderMessage"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-900 text-slate-100 font-mono text-xs rounded-2xl p-4 border border-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden leading-relaxed resize-none shadow-inner"
                />
              </div>

              {/* Dispatch Channel Options (Future Ready Architecture) */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-bold text-blue-950">Dispatch Integration</p>
                    <p className="text-[11px] text-blue-800">Ready for WhatsApp Web, WhatsApp Business API & SMS</p>
                  </div>
                </div>

                <select
                  value={dispatchMethod}
                  onChange={(e) => setDispatchMethod(e.target.value as any)}
                  className="bg-white border border-blue-200 text-xs font-bold text-blue-900 rounded-xl px-2.5 py-1.5 outline-hidden"
                >
                  <option value="whatsapp_web">WhatsApp Web</option>
                  <option value="whatsapp_business_api">WhatsApp Business API (Cloud)</option>
                  <option value="sms_gateway">SMS Gateway (Twilio)</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {!noPending && (
            <div className="flex items-center space-x-2">
              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Message</span>
                  </>
                )}
              </button>

              {/* WhatsApp / Direct Share Button */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                disabled={isSending}
                className="px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs rounded-xl transition-all flex items-center space-x-2 shadow-xs cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
