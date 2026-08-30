import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, AlertCircle, FileText, Upload, Trophy, 
  ArrowRight, ShieldCheck, MessageSquare, Award, Sparkles 
} from 'lucide-react';
import { HackathonRegistration, UserSession, RoundStatus } from '../../types';

interface MyHackathonsTabProps {
  session: UserSession;
  registrations: HackathonRegistration[];
  onOpenUploadCertificate?: (hackathonId: string, hackathonTitle: string) => void;
  onOpenInternalSubmissionModal?: () => void;
}

export default function MyHackathonsTab({
  session,
  registrations,
  onOpenUploadCertificate,
  onOpenInternalSubmissionModal
}: MyHackathonsTabProps) {
  const studentRoll = session.studentDetails?.rollNumber || session.username;

  // Filter registrations for current student
  const myRegistrations = registrations.filter(r => 
    (r.studentRollNumber || "").toLowerCase() === String(studentRoll).toLowerCase() ||
    (r.registerNumber || "").toLowerCase() === String(studentRoll).toLowerCase() ||
    (r.studentRollNumber || "").toLowerCase().endsWith(String(studentRoll).toLowerCase())
  );

  const roundSteps: RoundStatus[] = [
    'Registered',
    'Verified',
    'Round 1 Qualified',
    'Round 2 Qualified',
    'Round 3 Qualified',
    'Semi Finalist',
    'Finalist',
    'Winner'
  ];

  const getRoundIndex = (round: RoundStatus) => {
    return roundSteps.indexOf(round);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <span>My Registered Hackathons</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your internal verification status, round qualification milestones, and staff remarks in real time.
          </p>
        </div>

        <button
          onClick={onOpenInternalSubmissionModal}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Submission</span>
        </button>
      </div>

      {/* Registrations List */}
      {myRegistrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No hackathon submissions found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You haven't submitted any internal hackathon registration proofs yet. Register on official platforms and submit your proof to track your journey!
          </p>
          <button
            onClick={onOpenInternalSubmissionModal}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors"
          >
            Submit Hackathon Registration
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {myRegistrations.map((reg) => {
            const currentStepIdx = getRoundIndex(reg.currentRound);

            return (
              <div 
                key={reg.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 hover:shadow-md transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md ${
                        reg.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                        reg.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        ● {reg.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Submitted: {new Date(reg.submittedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 font-display">
                      {reg.hackathonTitle}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span>Team: <strong className="text-slate-900">{reg.teamName}</strong></span>
                      <span>Reg ID: <strong className="text-amber-600 font-mono">{reg.externalRegId || 'Not Provided'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenUploadCertificate && (
                      <button
                        onClick={() => onOpenUploadCertificate(reg.hackathonId, reg.hackathonTitle)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>Upload Certificate</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Visual Timeline Bar */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Hackathon Round Progression Timeline</span>
                    <span className="text-amber-600 font-extrabold uppercase">Current Status: {reg.currentRound}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                    {roundSteps.map((step, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div 
                          key={step} 
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isCurrent
                              ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-bold'
                              : isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          <div className="text-[10px] font-black uppercase tracking-wider block">
                            Step {idx + 1}
                          </div>
                          <div className="text-[11px] mt-0.5 font-bold line-clamp-1">
                            {step}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Staff Remarks & Proof Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" /> Staff Remarks / Feedback
                    </span>
                    <p className="text-slate-800 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
                      {reg.remarks || "Registration verified by college hackathon coordinators."}
                    </p>
                    {reg.updatedBy && (
                      <span className="text-[10px] text-slate-400 block mt-1">Verified By: {reg.updatedBy}</span>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-amber-600" /> Team Members & Submission Proof
                    </span>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <p className="text-slate-800 font-medium">
                        <strong>Members:</strong> {Array.isArray(reg.teamMembers) ? reg.teamMembers.join(', ') : reg.teamLeader}
                      </p>
                      {reg.proofUrl && (
                        <a 
                          href={reg.proofUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-amber-600 hover:underline font-bold inline-block mt-1"
                        >
                          View Official Registration Proof Screenshot &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
