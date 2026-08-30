import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Plus, Edit2, Trash2, CheckCircle2, XCircle, ShieldAlert, 
  Search, ShieldCheck, Trophy, Sparkles, Filter, AlertCircle, FileText 
} from 'lucide-react';
import { Hackathon, HackathonRegistration, UserSession, RoundStatus } from '../../types';

type VerificationStatus = HackathonRegistration['status'];

interface AdminManagementTabProps {
  session: UserSession;
  hackathons: Hackathon[];
  registrations: HackathonRegistration[];
  onRefreshData: () => void;
}

export default function AdminManagementTab({
  session,
  hackathons,
  registrations,
  onRefreshData
}: AdminManagementTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'submissions' | 'hackathons'>('submissions');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Pending Verification');

  // Modal for New/Edit Hackathon
  const [showHackathonModal, setShowHackathonModal] = useState(false);
  const [editingHackathonId, setEditingHackathonId] = useState<string | null>(null);

  // Hackathon Form State
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [category, setCategory] = useState('AI/ML');
  const [mode, setMode] = useState('Online');
  const [scope, setScope] = useState('National');
  const [prizePool, setPrizePool] = useState('₹5,000,000');
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-08-30');
  const [eventDate, setEventDate] = useState('2026-09-15');
  const [venue, setVenue] = useState('Online / Campus');
  const [officialWebsiteUrl, setOfficialWebsiteUrl] = useState('https://devfolio.co');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('Smart India & AI Innovation');
  const [eligibility, setEligibility] = useState('All B.E / B.Tech / M.Tech Students');
  const [bannerUrl, setBannerUrl] = useState('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80');
  const [status, setStatus] = useState('Live');

  // Submissions Verification Modal
  const [verifyingReg, setVerifyingReg] = useState<HackathonRegistration | null>(null);
  const [updateStatus, setUpdateStatus] = useState<VerificationStatus>('Verified');
  const [updateRound, setUpdateRound] = useState<RoundStatus>('Registered');
  const [remarks, setRemarks] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const openNewHackathonModal = () => {
    setEditingHackathonId(null);
    setTitle('');
    setOrganizer('');
    setDescription('');
    setShowHackathonModal(true);
  };

  const openEditHackathonModal = (h: Hackathon) => {
    setEditingHackathonId(h.id);
    setTitle(h.title);
    setOrganizer(h.organizer);
    setCategory(h.category);
    setMode(h.mode);
    setScope(h.scope);
    setPrizePool(h.prizePool);
    setMinTeamSize(h.minTeamSize);
    setMaxTeamSize(h.maxTeamSize);
    setRegistrationDeadline(h.registrationDeadline);
    setEventDate(h.eventDate);
    setVenue(h.venue);
    setOfficialWebsiteUrl(h.officialWebsiteUrl);
    setDescription(h.description);
    setTheme(h.theme);
    setEligibility(h.eligibility);
    setBannerUrl(h.bannerUrl);
    setLogoUrl(h.logoUrl);
    setStatus(h.status);
    setShowHackathonModal(true);
  };

  const handleSaveHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      organizer,
      category,
      mode,
      scope,
      prizePool,
      minTeamSize: Number(minTeamSize),
      maxTeamSize: Number(maxTeamSize),
      registrationDeadline,
      eventDate,
      venue,
      officialWebsiteUrl,
      description,
      theme,
      eligibility,
      bannerUrl,
      logoUrl,
      status
    };

    try {
      const url = editingHackathonId ? `/api/hackathons/${editingHackathonId}` : '/api/hackathons';
      const method = editingHackathonId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onRefreshData();
        setShowHackathonModal(false);
      }
    } catch (err) {
      console.error("Save hackathon error:", err);
    }
  };

  const handleDeleteHackathon = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this hackathon?")) return;
    try {
      const res = await fetch(`/api/hackathons/${id}`, { method: 'DELETE' });
      if (res.ok) onRefreshData();
    } catch (e) {
      console.error("Delete hackathon error:", e);
    }
  };

  const openVerifyModal = (reg: HackathonRegistration) => {
    setVerifyingReg(reg);
    setUpdateStatus(reg.status);
    setUpdateRound(reg.currentRound);
    setRemarks(reg.remarks || '');
  };

  const handleUpdateRegistrationStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingReg) return;

    setSavingStatus(true);
    try {
      const res = await fetch(`/api/hackathon/registrations/${verifyingReg.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: updateStatus,
          currentRound: updateRound,
          remarks,
          updatedBy: session.name || session.username || "Staff Coordinator"
        })
      });

      if (res.ok) {
        if (updateStatus === 'Verified' || updateRound.includes('Qualified') || updateRound.includes('Finalist') || updateRound === 'Winner') {
          try {
            confetti({
              particleCount: 150,
              spread: 90,
              origin: { y: 0.5 }
            });
          } catch (e) {
            // ignore confetti error
          }
        }
        onRefreshData();
        setVerifyingReg(null);
      }
    } catch (e) {
      console.error("Update registration status error:", e);
    } finally {
      setSavingStatus(false);
    }
  };

  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = 
      r.studentRollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.hackathonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.externalRegId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('submissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'submissions'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Review Student Submissions ({registrations.filter(r => r.status === 'Pending Verification').length} Pending)
          </button>
          <button
            onClick={() => setActiveSubTab('hackathons')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'hackathons'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Manage Active Hackathons ({hackathons.length})
          </button>
        </div>

        {activeSubTab === 'hackathons' && (
          <button
            onClick={openNewHackathonModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Hackathon</span>
          </button>
        )}
      </div>

      {/* Sub-Tab 1: Student Submissions Review */}
      {activeSubTab === 'submissions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by student name, roll number, or hackathon title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
              <option value="Resubmission Requested">Resubmission Requested</option>
            </select>
          </div>

          {filteredRegistrations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No student submissions matching filters</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRegistrations.map((reg) => (
                <div key={reg.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{reg.hackathonTitle}</span>
                      <h3 className="text-sm font-bold text-slate-900">
                        {reg.studentName} ({reg.studentRollNumber}) — {reg.department} ({reg.year} Year)
                      </h3>
                      <p className="text-xs text-slate-500">
                        External Reg ID: <strong className="font-mono text-slate-800">{reg.externalRegId || 'Not Provided'}</strong> • Email: {reg.externalRegEmail}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md ${
                        reg.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                        reg.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {reg.status}
                      </span>
                      <button
                        onClick={() => openVerifyModal(reg)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                      >
                        Verify & Update Status
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Team & Leader</span>
                      <span className="font-bold text-slate-800">{reg.teamName}</span>
                      <span className="text-slate-500 block text-[11px]">Leader: {reg.teamLeader}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Round</span>
                      <span className="font-bold text-amber-600">{reg.currentRound}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Registration Proof</span>
                      {reg.proofUrl ? (
                        <a href={reg.proofUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 font-bold hover:underline">
                          View Attachment &rarr;
                        </a>
                      ) : (
                        <span className="text-slate-400">No attachment provided</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Hackathons List & Management */}
      {activeSubTab === 'hackathons' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hackathons.map((h) => (
            <div key={h.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{h.organizer}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">{h.status}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{h.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{h.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Prize: {h.prizePool}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditHackathonModal(h)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteHackathon(h.id)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Verification Update */}
      {verifyingReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-display">Staff Review & Status Update</h3>
            <p className="text-xs text-slate-500">Updating registration for {verifyingReg.studentName} ({verifyingReg.studentRollNumber})</p>

            <form onSubmit={handleUpdateRegistrationStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Verification Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Resubmission Requested">Resubmission Requested</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Current Qualification Round</label>
                <select
                  value={updateRound}
                  onChange={(e) => setUpdateRound(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="Registered">Registered</option>
                  <option value="Verified">Verified</option>
                  <option value="Round 1 Qualified">Round 1 Qualified</option>
                  <option value="Round 2 Qualified">Round 2 Qualified</option>
                  <option value="Round 3 Qualified">Round 3 Qualified</option>
                  <option value="Semi Finalist">Semi Finalist</option>
                  <option value="Finalist">Finalist</option>
                  <option value="Winner">Winner 🏆</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Staff Remarks & Feedback</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Official comments for the student..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyingReg(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  Save Verification Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Post/Edit Hackathon */}
      {showHackathonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 font-display">
              {editingHackathonId ? 'Edit Hackathon Posting' : 'Post New Hackathon'}
            </h3>

            <form onSubmit={handleSaveHackathon} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Organizer *</label>
                  <input
                    type="text"
                    required
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="AI/ML">AI/ML</option>
                    <option value="Web3/Blockchain">Web3/Blockchain</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Mobile Apps">Mobile Apps</option>
                    <option value="IoT & Hardware">IoT & Hardware</option>
                    <option value="Open Innovation">Open Innovation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Mode</label>
                  <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Scope</label>
                  <select value={scope} onChange={(e) => setScope(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="National">National</option>
                    <option value="International">International</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Official Registration URL *</label>
                <input
                  type="url"
                  required
                  value={officialWebsiteUrl}
                  onChange={(e) => setOfficialWebsiteUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowHackathonModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl cursor-pointer">
                  Save Hackathon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
