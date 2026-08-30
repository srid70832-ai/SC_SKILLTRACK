import React, { useState } from 'react';
import { 
  Search, CheckCircle2, Clock, AlertCircle, ShieldCheck, 
  Trophy, MessageSquare, ArrowRight, User, Calendar 
} from 'lucide-react';
import { HackathonRegistration, UserSession, RoundStatus } from '../../types';

interface StatusTrackingTabProps {
  session: UserSession;
  registrations: HackathonRegistration[];
}

export default function StatusTrackingTab({ session, registrations }: StatusTrackingTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  const filtered = registrations.filter(r => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      !query ||
      r.studentRollNumber.toLowerCase().includes(query) ||
      r.studentName.toLowerCase().includes(query) ||
      r.externalRegId.toLowerCase().includes(query) ||
      r.hackathonTitle.toLowerCase().includes(query) ||
      r.teamName.toLowerCase().includes(query);

    const matchesStatus = selectedStatusFilter === 'All' || r.status === selectedStatusFilter;

    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <h2 className="text-xl font-extrabold text-slate-900 font-display flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-amber-500" />
          <span>Real-Time Hackathon Status Tracking & Verification</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Search any student's registration proof by Roll Number, Register ID, or Hackathon title to view official staff approval status and round qualifications.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by Roll Number, Register ID (e.g. DEV-99218), Student Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedStatusFilter}
          onChange={(e) => setSelectedStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer w-full md:w-auto"
        >
          <option value="All">All Statuses</option>
          <option value="Pending Verification">Pending Verification</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
          <option value="Resubmission Requested">Resubmission Requested</option>
        </select>
      </div>

      {/* Results Table / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <Search className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No matching registrations found</h3>
          <p className="text-xs text-slate-400">Try adjusting your search query or status filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((reg) => (
            <div 
              key={reg.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{reg.hackathonTitle}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400">Reg ID: <strong className="font-mono text-slate-800">{reg.externalRegId || 'Not Provided'}</strong></span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {reg.studentName} <span className="text-slate-400 font-normal">({reg.studentRollNumber})</span> — <span className="text-slate-600">{reg.department} ({reg.year} Year)</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg ${
                    reg.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                    reg.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    ● {reg.status}
                  </span>
                  <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg shadow-xs">
                    {reg.currentRound}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Team Info</span>
                  <span className="font-bold text-slate-800">{reg.teamName}</span>
                  <span className="text-slate-500 block text-[11px]">Leader: {reg.teamLeader}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Staff Remarks</span>
                  <span className="font-semibold text-slate-800">{reg.remarks || "Under review by staff."}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Timestamps</span>
                  <span className="text-slate-600 block">Submitted: {new Date(reg.submittedAt).toLocaleDateString()}</span>
                  <span className="text-slate-600 block">Updated: {new Date(reg.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
