import React from 'react';
import { 
  Trophy, Users, CheckCircle2, Clock, AlertCircle, Award, 
  Sparkles, Layers, ArrowUpRight, Flame, BarChart3, Target, ShieldCheck
} from 'lucide-react';
import { Hackathon, HackathonRegistration, UserSession } from '../../types';

interface HackathonDashboardProps {
  session: UserSession;
  hackathons: Hackathon[];
  registrations: HackathonRegistration[];
  onNavigateTab: (tab: string) => void;
  onOpenInternalSubmission?: (hackathon: Hackathon) => void;
}

export default function HackathonDashboard({ 
  session, 
  hackathons, 
  registrations, 
  onNavigateTab,
  onOpenInternalSubmission 
}: HackathonDashboardProps) {
  const isStaff = session.role === 'Staff';

  const totalHackathons = hackathons.length;
  const liveCount = hackathons.filter(h => h.status === 'Live').length;
  const closedCount = hackathons.filter(h => h.status === 'Closed').length;

  const totalRegistrations = registrations.length;
  const pendingVerification = registrations.filter(r => r.status === 'Pending Verification').length;
  const verifiedRegistrations = registrations.filter(r => r.status === 'Verified').length;

  // Round progression stats
  const round1Count = registrations.filter(r => r.currentRound === 'Round 1 Qualified').length;
  const round2Count = registrations.filter(r => r.currentRound === 'Round 2 Qualified').length;
  const round3Count = registrations.filter(r => r.currentRound === 'Round 3 Qualified').length;
  const semiFinalistsCount = registrations.filter(r => r.currentRound === 'Semi Finalist').length;
  const finalistsCount = registrations.filter(r => r.currentRound === 'Finalist').length;
  const winnersCount = registrations.filter(r => r.currentRound === 'Winner').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-amber-100">
              <Trophy className="w-3.5 h-3.5" /> Official Hackathon Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight">
              SC Hackathon Hub 🏆
            </h1>
            <p className="text-amber-100 text-sm max-w-2xl leading-relaxed font-medium">
              Discover national & global hackathons, complete official registration externally, submit your proof internally, and track your complete journey from Round 1 to Grand Finale Winners!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('upcoming')}
              className="px-5 py-2.5 bg-white text-amber-900 hover:bg-amber-50 text-sm font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Explore Hackathons</span>
            </button>
            <button
              onClick={() => onNavigateTab(isStaff ? 'admin' : 'my_hackathons')}
              className="px-5 py-2.5 bg-amber-900/40 hover:bg-amber-900/60 border border-white/20 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{isStaff ? 'Manage Submissions' : 'My Hackathons'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Staff/Student Dashboard Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Events</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalHackathons}</div>
          <div className="text-[11px] font-semibold text-amber-600 mt-1">{liveCount} Currently Live</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Open Regs</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{liveCount}</div>
          <div className="text-[11px] font-semibold text-slate-500 mt-1">{closedCount} Closed</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Registrations</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalRegistrations}</div>
          <div className="text-[11px] font-semibold text-blue-600 mt-1">Student Submissions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Verify</span>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-orange-600">{pendingVerification}</div>
          <div className="text-[11px] font-semibold text-orange-600 mt-1">Awaiting Review</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Verified Regs</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600">{verifiedRegistrations}</div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-1">Approved by Staff</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Winners</span>
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{winnersCount}</div>
          <div className="text-[11px] font-semibold text-amber-600 mt-1">Champions 🏆</div>
        </div>
      </div>

      {/* Round Breakdown Funnel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Student Hackathon Progression Funnel</h2>
              <p className="text-xs text-slate-500">Live count of students progressing through hackathon rounds</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigateTab('results')} 
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            View Leaderboard &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Round 1</span>
            <span className="text-xl font-black text-slate-800">{round1Count}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Qualified</span>
          </div>
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-center">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Round 2</span>
            <span className="text-xl font-black text-blue-800">{round2Count}</span>
            <span className="text-[10px] text-blue-500 block mt-0.5">Qualified</span>
          </div>
          <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl text-center">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">Round 3</span>
            <span className="text-xl font-black text-indigo-800">{round3Count}</span>
            <span className="text-[10px] text-indigo-500 block mt-0.5">Qualified</span>
          </div>
          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-center">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Semi Finalists</span>
            <span className="text-xl font-black text-purple-800">{semiFinalistsCount}</span>
            <span className="text-[10px] text-purple-500 block mt-0.5">Stage</span>
          </div>
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-center">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Finalists</span>
            <span className="text-xl font-black text-amber-900">{finalistsCount}</span>
            <span className="text-[10px] text-amber-600 block mt-0.5">Stage</span>
          </div>
          <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-500 text-white rounded-xl text-center shadow-sm">
            <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wider block">Winners</span>
            <span className="text-xl font-black text-white">{winnersCount}</span>
            <span className="text-[10px] text-amber-100 block mt-0.5">🏆 Champions</span>
          </div>
        </div>
      </div>

      {/* Featured Hackathons Preview & Quick Internal Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Featured Active Hackathons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 font-display flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <span>Featured Active Hackathons</span>
            </h3>
            <button
              onClick={() => onNavigateTab('upcoming')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
            >
              View All ({hackathons.length}) &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hackathons.slice(0, 4).map(h => (
              <div 
                key={h.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative h-32 overflow-hidden bg-slate-900">
                  <img 
                    src={h.bannerUrl} 
                    alt={h.title} 
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-sm">
                    <img src={h.logoUrl} alt={h.organizer} className="w-7 h-7 object-cover rounded-lg" />
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-black uppercase rounded-full tracking-wider shadow-sm">
                      {h.prizePool}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">{h.organizer}</span>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">{h.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{h.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={h.officialWebsiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                    >
                      Official Site <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => onOpenInternalSubmission ? onOpenInternalSubmission(h) : onNavigateTab('internal_submission')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      Internal Submission
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right col: Quick AI Helper & Recent Activity */}
        <div className="space-y-6">
          {/* AI Helper Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" /> AI Hackathon Copilot
            </div>
            <h3 className="text-lg font-extrabold font-display">Need Project Ideas or PPT Outline?</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Generate jury-ready pitch decks, READMEs, problem statements, and AI project ideas instantly with our AI Assistant!
            </p>
            <button
              onClick={() => onNavigateTab('ai_assistant')}
              className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch AI Copilot</span>
            </button>
          </div>

          {/* Recent Internal Submissions Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 font-display mb-3 flex items-center justify-between">
              <span>Recent Registrations</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{registrations.length} Total</span>
            </h3>

            {registrations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No internal registrations submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {registrations.slice(0, 4).map(r => (
                  <div key={r.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 line-clamp-1">{r.hackathonTitle}</span>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                        r.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                        r.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{r.studentName} ({r.studentRollNumber})</span>
                      <span className="font-semibold text-amber-600">{r.currentRound}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
