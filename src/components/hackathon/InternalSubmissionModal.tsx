import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, CheckCircle2, Upload, FileText, User, Mail, Phone, 
  Building, Calendar, ShieldCheck, AlertCircle, Plus, Trash2, Sparkles 
} from 'lucide-react';
import { Hackathon, UserSession, StudentProfileExtra } from '../../types';

interface InternalSubmissionModalProps {
  session: UserSession;
  hackathons: Hackathon[];
  selectedHackathon?: Hackathon | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InternalSubmissionModal({
  session,
  hackathons,
  selectedHackathon,
  onClose,
  onSuccess
}: InternalSubmissionModalProps) {
  const student = session.studentDetails;
  const studentRoll = student?.rollNumber || session.username || "25BAD004";

  // Form states
  const [hackathonId, setHackathonId] = useState<string>(selectedHackathon?.id || hackathons[0]?.id || '');
  const [externalRegId, setExternalRegId] = useState<string>('');
  const [externalRegEmail, setExternalRegEmail] = useState<string>(student?.email || '');
  const [teamName, setTeamName] = useState<string>('');
  const [teamLeader, setTeamLeader] = useState<string>(student?.studentName || session.name || '');
  const [teamMembersText, setTeamMembersText] = useState<string>(student?.studentName || session.name || '');
  const [proofUrl, setProofUrl] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // Permanent Student Details (Asked on First Time Only if not present)
  const [registerNumber, setRegisterNumber] = useState<string>(student?.registerNumber || '');
  const [department, setDepartment] = useState<string>(student?.department || 'AI&DS');
  const [year, setYear] = useState<string>(student?.year || 'I');
  const [section, setSection] = useState<string>(student?.section || 'A');
  const [phoneNumber, setPhoneNumber] = useState<string>(student?.phoneNumber || '+91');
  const [email, setEmail] = useState<string>(student?.email || '');

  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Load existing profile or check first time
  useEffect(() => {
    fetchProfile();
  }, [studentRoll]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/hackathon/student-profile/${studentRoll}`);
      if (res.ok) {
        const data = await res.json();
        setRegisterNumber(data.registerNumber || student?.registerNumber || '');
        setDepartment(data.department || student?.department || 'AI&DS');
        setYear(data.year || student?.year || 'I');
        setSection(data.section || student?.section || 'A');
        setPhoneNumber(data.phoneNumber || student?.phoneNumber || '+91');
        setEmail(data.email || student?.email || '');
        setIsFirstTime(false);
      } else {
        setIsFirstTime(true);
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
      setIsFirstTime(true);
    }
  };

  const currentHackathon = hackathons.find(h => h.id === hackathonId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hackathonId) {
      setErrorMsg("Please select a hackathon.");
      return;
    }
    if (isFirstTime && (!registerNumber.trim() || !department || !year || !section || !phoneNumber.trim())) {
      setErrorMsg("Please complete all student details for first-time registration setup.");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Parse team members list
    const membersList = teamMembersText
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    const payload = {
      hackathonId,
      hackathonTitle: currentHackathon?.title || "Hackathon",
      studentRollNumber: studentRoll,
      registerNumber,
      studentName: student?.studentName || session.name || teamLeader || studentRoll,
      department,
      year,
      section,
      email: email || externalRegEmail,
      phoneNumber,
      externalRegId,
      externalRegEmail,
      teamName: teamName || "Solo",
      teamLeader: teamLeader || student?.studentName || studentRoll,
      teamMembers: membersList.length > 0 ? membersList : [teamLeader],
      proofUrl: proofUrl || "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&q=80",
      additionalNotes
    };

    try {
      const response = await fetch('/api/hackathon/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        } catch (e) {
          // ignore confetti error if canvas not available
        }
        onSuccess();
        onClose();
      } else {
        const errData = await response.json();
        setErrorMsg(errData.error || "Failed to submit registration proof.");
      }
    } catch (err) {
      console.error("Submit registration error:", err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Mock File Upload Simulator
  const handleFileUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-yellow-500 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-display">Internal Registration Submission</h2>
              <p className="text-xs text-amber-100">Submit proof of official registration on Devfolio / Unstop / SIH</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* First Time Student Profile Collector Notice */}
          {isFirstTime && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>First Time Registration Setup — Auto-saves for future submissions!</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Register Number *</label>
                  <input
                    type="text"
                    required
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    placeholder="711525BAD004"
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Department *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-900"
                  >
                    <option value="AI&DS">AI & DS</option>
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Year *</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-900"
                  >
                    <option value="I">Year I</option>
                    <option value="II">Year II</option>
                    <option value="III">Year III</option>
                    <option value="IV">Year IV</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Section *</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-900"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@sctech.edu"
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Hackathon Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Hackathon *
            </label>
            <select
              value={hackathonId}
              onChange={(e) => setHackathonId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              {hackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title} ({h.organizer} — {h.scope})
                </option>
              ))}
            </select>
          </div>

          {/* External Registration ID & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Official Registration ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. SIH2026-TN-88219 or DEV-99218 (Optional)"
                value={externalRegId}
                onChange={(e) => setExternalRegId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Found on official confirmation email/dashboard (If available)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Registration Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="email used on Devfolio / Unstop"
                value={externalRegEmail}
                onChange={(e) => setExternalRegEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Team Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Team Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AI Cyber Innovators"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Team Leader Name *
              </label>
              <input
                type="text"
                required
                value={teamLeader}
                onChange={(e) => setTeamLeader(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Team Member Names (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. ABINAYA B V, ABOORVASRI V V, ADITHYA E"
              value={teamMembersText}
              onChange={(e) => setTeamMembersText(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Upload Proof */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Upload Official Registration Proof (PDF / PNG / JPG)
            </label>
            <div className="border-2 border-dashed border-slate-200 hover:border-amber-500 rounded-2xl p-6 text-center transition-all bg-slate-50/50">
              <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Click to upload confirmation screenshot or PDF</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG files</p>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUploadMock}
                className="mt-3 text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer mx-auto"
              />
            </div>

            {proofUrl && (
              <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800 font-semibold">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Proof Attached</span>
                <button type="button" onClick={() => setProofUrl('')} className="text-rose-600 hover:underline cursor-pointer">Remove</button>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Additional Notes / Track Problem Statement
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Registered under Ministry of Jal Shakti Track Problem Statement #1294"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Submit Registration Proof</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
