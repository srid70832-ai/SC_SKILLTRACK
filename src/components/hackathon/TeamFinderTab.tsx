import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Check, X, Sparkles, Search, Plus, 
  Code2, Tag, CheckCircle2, Shield, MessageSquare 
} from 'lucide-react';
import { Hackathon, HackathonTeam, UserSession } from '../../types';

interface TeamFinderTabProps {
  session: UserSession;
  hackathons: Hackathon[];
}

export default function TeamFinderTab({ session, hackathons }: TeamFinderTabProps) {
  const [teams, setTeams] = useState<HackathonTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHackathonFilter, setSelectedHackathonFilter] = useState('All');

  // Modal State for Team Creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hackathonId, setHackathonId] = useState(hackathons[0]?.id || '');
  const [teamName, setTeamName] = useState('');
  const [maxMembers, setMaxMembers] = useState(4);
  const [lookingForSkillsText, setLookingForSkillsText] = useState('React, Node.js, AI/ML, UI/UX');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const student = session.studentDetails;
  const studentRoll = student?.rollNumber || session.username || "25BAD004";
  const studentName = student?.studentName || session.name || "Student";
  const studentDept = student?.department || "AI&DS";

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hackathon/teams');
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (e) {
      console.error("Fetch teams error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setSubmitting(true);
    const selectedH = hackathons.find(h => h.id === hackathonId);

    const skills = lookingForSkillsText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      hackathonId,
      hackathonTitle: selectedH?.title || "Hackathon",
      teamName,
      leaderRollNumber: studentRoll,
      leaderName: studentName,
      leaderDepartment: studentDept,
      maxMembers,
      lookingForSkills: skills,
      description
    };

    try {
      const res = await fetch('/api/hackathon/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fetchTeams();
        setShowCreateModal(false);
        setTeamName('');
        setDescription('');
      }
    } catch (e) {
      console.error("Create team error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinRequest = async (teamId: string) => {
    try {
      const res = await fetch(`/api/hackathon/teams/${teamId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber: studentRoll,
          name: studentName,
          department: studentDept,
          role: 'Developer'
        })
      });

      if (res.ok) {
        fetchTeams();
      }
    } catch (e) {
      console.error("Join team error:", e);
    }
  };

  const handleMemberAction = async (teamId: string, memberRoll: string, action: 'Accepted' | 'Rejected') => {
    try {
      const res = await fetch(`/api/hackathon/teams/${teamId}/member`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: memberRoll, action })
      });

      if (res.ok) {
        fetchTeams();
      }
    } catch (e) {
      console.error("Member action error:", e);
    }
  };

  const filteredTeams = teams.filter(t => {
    const matchesSearch = 
      t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.hackathonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lookingForSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesHackathon = selectedHackathonFilter === 'All' || t.hackathonId === selectedHackathonFilter;

    return matchesSearch && matchesHackathon;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            <span>Hackathon Team Finder & Skill Matching</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Connect with peer developers, build cross-department teams, and collaborate for hackathons.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Team</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search team name, skills required (e.g. React, Python, UI/UX)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedHackathonFilter}
          onChange={(e) => setSelectedHackathonFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer w-full md:w-auto"
        >
          <option value="All">All Hackathons</option>
          {hackathons.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
        </select>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No open teams found</h3>
          <p className="text-xs text-slate-400">Be the first to create a team or adjust your search filters!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTeams.map((team) => {
            const isLeader = team.leaderRollNumber === studentRoll;
            const acceptedMembers = team.members.filter(m => m.status === 'Accepted');
            const pendingMembers = team.members.filter(m => m.status === 'Pending');
            const myMemberState = team.members.find(m => m.rollNumber === studentRoll);

            return (
              <div 
                key={team.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider line-clamp-1">
                      {team.hackathonTitle}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-md ${
                      team.status === 'Open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {acceptedMembers.length} / {team.maxMembers} Members
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 font-display">
                    {team.teamName}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {team.description}
                  </p>
                </div>

                {/* Skills Needed */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Looking For Skills:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {team.lookingForSkills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold rounded-lg">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Accepted Members List */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                    Accepted Members
                  </span>
                  <div className="space-y-1">
                    {acceptedMembers.map(m => (
                      <div key={m.rollNumber} className="flex items-center justify-between text-slate-800">
                        <span className="font-semibold">{m.name} ({m.department})</span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leader Pending Requests Approval Area */}
                {isLeader && pendingMembers.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-amber-900 uppercase tracking-wider block text-[10px] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Pending Join Requests ({pendingMembers.length})
                    </span>
                    <div className="space-y-2">
                      {pendingMembers.map(pm => (
                        <div key={pm.rollNumber} className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-200">
                          <div>
                            <span className="font-bold text-slate-900 block">{pm.name}</span>
                            <span className="text-[10px] text-slate-500">{pm.department} • {pm.role}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMemberAction(team.id, pm.rollNumber, 'Accepted')}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMemberAction(team.id, pm.rollNumber, 'Rejected')}
                              className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Join Button */}
                {!isLeader && (
                  <div className="pt-2">
                    {myMemberState ? (
                      <div className={`p-2.5 rounded-xl text-center text-xs font-bold ${
                        myMemberState.status === 'Accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {myMemberState.status === 'Accepted' ? '✓ You are in this team' : '⏳ Join Request Pending Leader Approval'}
                      </div>
                    ) : team.status === 'Open' ? (
                      <button
                        onClick={() => handleJoinRequest(team.id)}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Request to Join Team</span>
                      </button>
                    ) : (
                      <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl text-center text-xs font-bold">
                        Team Full
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating Team */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 font-display">Create Hackathon Team</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Select Hackathon</label>
                <select
                  value={hackathonId}
                  onChange={(e) => setHackathonId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {hackathons.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neural Cyber Squad"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Maximum Team Size</label>
                <input
                  type="number"
                  min={2}
                  max={6}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Skills Needed (Comma separated)</label>
                <input
                  type="text"
                  value={lookingForSkillsText}
                  onChange={(e) => setLookingForSkillsText(e.target.value)}
                  placeholder="React, FastAPI, Gemini API, UI/UX"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Team Description / Idea Pitch</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what your team plans to build and what member roles you need..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Publish Team Posting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
