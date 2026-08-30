import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, CheckCircle2, Clock, XCircle, Plus, Eye, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { InternalRegistration, UserSession, Opportunity } from '../../types';
import InternalRegistrationModal from './InternalRegistrationModal';

interface StudentInternalRegistrationsListProps {
  session: UserSession;
  onOpenNewRegistrationModal?: () => void;
}

export default function StudentInternalRegistrationsList({ session }: StudentInternalRegistrationsListProps) {
  const [registrations, setRegistrations] = useState<InternalRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const rollNumber = session.username || session.studentRollNumber || '';

  const fetchMyRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/opportunity-registrations?registerNumber=${rollNumber}`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
      }
    } catch (e) {
      console.error('Error fetching my internal registrations:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRegistrations();
  }, [rollNumber]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-indigo-600 font-extrabold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>My Submitted Opportunities & Internal Registrations</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Submitted Opportunity Status</h2>
          <p className="text-xs text-slate-500">Track registration IDs, proof verification, and mentor approval status.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Internal Submit</span>
        </button>
      </div>

      {/* List / Cards Container */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-2">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold">Loading your internal registrations...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-slate-50 p-12 text-center rounded-3xl border border-slate-200 space-y-4">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Submissions Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't submitted any internal opportunity registrations yet. Click "New Internal Submit" above to record your participation.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Registration Proof</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {registrations.map((r) => {
            const statusLower = (r.verificationStatus || '').toLowerCase();
            const isVerified = ['verified', 'approved'].includes(statusLower);
            const isRejected = statusLower === 'rejected';

            return (
              <motion.div
                key={r.id}
                whileHover={{ y: -3 }}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative overflow-hidden"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                      {r.category}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">{r.opportunityName}</h3>
                    <p className="text-xs text-slate-500 font-medium">Host: {r.organizer}</p>
                  </div>

                  <div>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-full text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-300 font-bold px-2.5 py-1 rounded-full text-[11px]">
                        <XCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Rejected</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 rounded-full text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>Pending</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Grid Details */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 font-bold block">Registration ID</span>
                    <span className="font-mono font-extrabold text-indigo-950">{r.officialRegistrationId || 'Not Provided'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Submission Date</span>
                    <span className="font-semibold text-slate-800">{r.submissionDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Team / Individual</span>
                    <span className="font-semibold text-slate-800">{r.teamName || 'Individual'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Assigned Mentor</span>
                    <span className="font-semibold text-slate-800">{r.mentorName}</span>
                  </div>
                </div>

                {/* Remarks if any */}
                {r.remarks && (
                  <div className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                    <span className="font-bold text-amber-900">Staff Note:</span> {r.remarks}
                  </div>
                )}

                {/* Proof Action */}
                {r.uploadedProofUrl && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Proof File Uploaded</span>
                    <a
                      href={r.uploadedProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Proof</span>
                    </a>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Internal Registration Modal */}
      {showModal && (
        <InternalRegistrationModal
          session={session}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchMyRegistrations();
          }}
        />
      )}
    </div>
  );
}
