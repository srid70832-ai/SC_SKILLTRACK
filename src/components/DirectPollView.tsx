import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, User, AlertTriangle, RefreshCw, Send, Check, ShieldCheck, Edit2, LogOut, X, Phone, Mail, Smartphone, Sparkles, Building, Calendar, Bookmark } from 'lucide-react';
import { Poll } from '../types';
import { StorageService, StudentProfile } from '../services/studentStorage';

interface DirectPollViewProps {
  pollId: string;
  onBackToLogin?: () => void;
}

export default function DirectPollView({ pollId, onBackToLogin }: DirectPollViewProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  
  // First-time registration form state
  const [regInput, setRegInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [foundStudent, setFoundStudent] = useState<any | null>(null);
  
  // Custom manual fields if not in database
  const [manualName, setManualName] = useState('');
  const [manualDept, setManualDept] = useState('AI&DS');
  const [manualYear, setManualYear] = useState('I');
  const [manualSection, setManualSection] = useState('A');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Poll state
  const [loadingPoll, setLoadingPoll] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [votedOption, setVotedOption] = useState<string[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // On initial load, load student profile from Local Storage and fetch poll details
  useEffect(() => {
    const savedProfile = StorageService.getProfile();
    if (savedProfile) {
      setProfile(savedProfile);
      setEditPhone(savedProfile.phoneNumber || '');
      setEditEmail(savedProfile.email || '');
    }
    fetchPollDetails(savedProfile?.registerNumber || savedProfile?.rollNumber);
  }, [pollId]);

  const fetchPollDetails = async (activeRegisterNo?: string) => {
    try {
      setLoadingPoll(true);
      setErrorMsg(null);
      const res = await fetch(`/api/tracking/${pollId}`);
      if (res.ok) {
        const data = await res.json();
        setPoll(data.poll);

        // Check if student has already voted in this poll
        const searchReg = activeRegisterNo || profile?.registerNumber || profile?.rollNumber;
        if (searchReg) {
          const regLower = searchReg.trim().toLowerCase();
          const myVote = data.responses?.find((r: any) => 
            r.studentRollNumber?.toLowerCase() === regLower || 
            r.studentRollNumber?.toLowerCase().endsWith(regLower) ||
            regLower.endsWith(r.studentRollNumber?.toLowerCase())
          );
          
          if (myVote) {
            setVotedOption(myVote.selectedOptions);
            setSelectedOptions(myVote.selectedOptions);
          }
        }
      } else {
        setErrorMsg("This poll does not exist, or the link is invalid.");
      }
    } catch (err) {
      setErrorMsg("Unable to retrieve poll details. Please check your connection.");
    } finally {
      setLoadingPoll(false);
    }
  };

  // 1. First-Time Registration: Search / Lookup Student in DB
  const handleLookupStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regInput.trim()) {
      setLookupError("Please enter your Register Number or Roll Number.");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setFoundStudent(null);

    try {
      const res = await fetch(`/api/students/verify/${regInput.trim()}`);
      const data = await res.json();

      if (res.ok) {
        setFoundStudent(data);
        setManualName(data.studentName);
        setManualDept(data.department || 'AI&DS');
        setManualYear(data.year || 'I');
        setManualSection(data.section || 'A');
        setContactPhone(data.phoneNumber || '');
        setContactEmail(data.email || '');
      } else {
        // Not in database, allow entering details
        setFoundStudent({ isNew: true });
        setManualName('');
        setLookupError("Register number not pre-configured in standard student database. Please verify and complete your profile below.");
      }
    } catch (err) {
      setLookupError("Connection error while verifying register number.");
    } finally {
      setLookupLoading(false);
    }
  };

  // 2. Save First-Time Profile
  const handleSaveRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regInput.trim()) {
      setLookupError("Register Number is required.");
      return;
    }

    if (!manualName.trim()) {
      setLookupError("Student Name is required.");
      return;
    }

    const regNo = foundStudent?.registerNumber || foundStudent?.rollNumber || regInput.trim().toUpperCase();

    const created = StorageService.createProfileFromData({
      rollNumber: foundStudent?.rollNumber || regNo,
      registerNumber: regNo,
      studentName: manualName.trim().toUpperCase(),
      department: manualDept,
      year: manualYear,
      section: manualSection,
      phoneNumber: contactPhone.trim(),
      email: contactEmail.trim(),
      mentorName: foundStudent?.mentorName || ''
    });

    setProfile(created);
    setEditPhone(created.phoneNumber || '');
    setEditEmail(created.email || '');
    setSuccessMsg(`Welcome, ${created.studentName}! Your profile has been registered on this device.`);

    // Re-verify existing votes with this new profile
    fetchPollDetails(created.registerNumber);
  };

  // 3. Handle Option Selection
  const handleOptionSelect = (option: string) => {
    if (!poll) return;
    if (votedOption) return; // Locked if already voted

    if (poll.type === 'Multiple') {
      if (selectedOptions.includes(option)) {
        setSelectedOptions(selectedOptions.filter(o => o !== option));
      } else {
        setSelectedOptions([...selectedOptions, option]);
      }
    } else {
      setSelectedOptions([option]);
    }
  };

  // 4. Submit Poll Vote
  const handleSubmitVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poll || !profile) return;

    if (selectedOptions.length === 0) {
      setErrorMsg("Please choose at least one option to submit your response.");
      return;
    }

    // Check targeting match
    const deptMatch = poll.targetDepartment === "All" || poll.targetDepartment.toLowerCase() === profile.department.toLowerCase();
    const yearMatch = poll.targetYear === "All" || poll.targetYear.toLowerCase() === profile.year.toLowerCase();
    const secMatch = poll.targetSection === "All" || poll.targetSection.toLowerCase() === profile.section.toLowerCase();

    if (!deptMatch || !yearMatch || !secMatch) {
      setErrorMsg(`This poll is targeted specifically for ${poll.targetDepartment} • Year ${poll.targetYear} • Sec ${poll.targetSection}. Your profile (${profile.department} Yr ${profile.year} Sec ${profile.section}) is not targeted.`);
      return;
    }

    setSubmittingVote(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentRollNumber: profile.registerNumber || profile.rollNumber,
          selectedOptions: selectedOptions,
          studentId: profile.studentId,
          deviceIdentifier: profile.deviceIdentifier
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg("Your response has been recorded successfully!");
        setVotedOption(selectedOptions);
        // Refresh poll details
        setTimeout(() => {
          fetchPollDetails(profile.registerNumber);
        }, 1000);
      } else {
        if (data.error && data.error.includes("already submitted")) {
          setErrorMsg("You have already submitted your response.");
          setVotedOption(selectedOptions);
        } else {
          setErrorMsg(data.error || "Failed to record vote.");
        }
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmittingVote(false);
    }
  };

  // 5. Update Profile Contact Details
  const handleUpdateContact = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = StorageService.updateProfileContact(editPhone.trim(), editEmail.trim());
    if (updated) {
      setProfile(updated);
      setProfileSuccessMsg("Contact details updated successfully!");
      setTimeout(() => setProfileSuccessMsg(null), 3000);
    }
  };

  // 6. Reset profile for device change
  const handleUnlinkProfile = () => {
    if (confirm("Are you sure you want to unlink this profile from this device? You will need to re-verify your Register Number.")) {
      StorageService.clearProfile();
      setProfile(null);
      setFoundStudent(null);
      setRegInput('');
      setVotedOption(null);
      setSelectedOptions([]);
      setShowProfileModal(false);
    }
  };

  if (loadingPoll) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm font-bold text-slate-700 tracking-wide">Retrieving Smart Poll...</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl text-center shadow-xs">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 font-display">Poll Not Found or Link Expired</h3>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          The poll link you opened is invalid, or the administrator has removed this poll.
        </p>
        {onBackToLogin && (
          <button
            onClick={onBackToLogin}
            className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Staff Login Portal
          </button>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: FIRST TIME STUDENT REGISTRATION (If no profile saved on device)
  // =========================================================================
  if (!profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white">
            <div className="flex items-center space-x-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>One-Time Device Setup</span>
            </div>
            <h2 className="text-2xl font-extrabold font-display">Student Profile Verification</h2>
            <p className="text-xs text-blue-100 mt-2 leading-relaxed">
              Register your profile once on this device. Future poll links will open instantly without re-entering your details!
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {lookupError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs font-semibold flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{lookupError}</span>
              </div>
            )}

            {/* Step 1: Register Number Search */}
            {!foundStudent ? (
              <form onSubmit={handleLookupStudent} className="space-y-4">
                <div>
                  <label htmlFor="registerNumber" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Register Number / Roll Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="registerNumber"
                      type="text"
                      value={regInput}
                      onChange={(e) => setRegInput(e.target.value)}
                      placeholder="e.g. 711525BAD004 or BAD004"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-hidden uppercase tracking-wide"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Enter your college register number or roll number to auto-fetch your class record.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:bg-blue-400"
                >
                  {lookupLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Record...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-blue-200" />
                      <span>Find My Record</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Confirm or Edit Registration Details */
              <form onSubmit={handleSaveRegistration} className="space-y-5">
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">Register Number</span>
                    <span className="text-base font-extrabold text-blue-950 tracking-wider">
                      {foundStudent.registerNumber || foundStudent.rollNumber || regInput.toUpperCase()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFoundStudent(null)}
                    className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>

                <div>
                  <label htmlFor="studentName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Student Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="studentName"
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Enter Student Full Name"
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="deptSelect" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Dept
                    </label>
                    <select
                      id="deptSelect"
                      value={manualDept}
                      onChange={(e) => setManualDept(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="AI&DS">AI&DS</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="IT">IT</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="yearSelect" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Year
                    </label>
                    <select
                      id="yearSelect"
                      value={manualYear}
                      onChange={(e) => setManualYear(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="I">I</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="secSelect" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Section
                    </label>
                    <select
                      id="secSelect"
                      value={manualSection}
                      onChange={(e) => setManualSection(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label htmlFor="phoneInput" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      id="phoneInput"
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="emailInput" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      id="emailInput"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="student@sctech.edu"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800"
                    />
                  </div>
                </div>

                {foundStudent?.mentorName && (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <strong className="text-slate-700">Assigned Mentor:</strong> {foundStudent.mentorName}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Save Profile & Open Poll</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: RETURNING STUDENT DIRECT POLL VIEW
  // =========================================================================
  const isClosed = poll.status === 'Closed';

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Top Student Welcome Ribbon */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Device Profile Verified
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-white mt-0.5">
              Welcome back, {profile.studentName}
            </h3>
            <p className="text-xs text-blue-200/90 font-medium mt-0.5">
              Reg: <strong className="text-white">{profile.registerNumber}</strong> • {profile.department} (Yr {profile.year} Sec {profile.section})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-center">
          <button
            onClick={() => setShowProfileModal(true)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/15 transition-all cursor-pointer flex items-center space-x-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* Main Poll Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Header Ribbon */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-wrap justify-between items-center gap-2">
          <span className="text-[10px] uppercase font-extrabold tracking-wider bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">
            {poll.type === 'Multiple' ? 'Multiple Choice Poll' : 'Single Choice Poll'}
          </span>
          <div className="flex items-center text-xs text-slate-500 font-semibold space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Deadline: {poll.deadline}</span>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Poll Title & Question */}
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight leading-tight">
              {poll.title}
            </h2>
            <p className="text-md text-slate-700 font-medium mt-3 leading-relaxed">
              {poll.question}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start space-x-3 text-sm font-semibold">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center space-x-3 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Poll Options */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {poll.type === 'Multiple' ? 'Choose one or more options:' : 'Choose one option:'}
              </span>
              {votedOption && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Vote Recorded</span>
                </span>
              )}
            </div>

            <div className="space-y-3">
              {poll.options.map((option, idx) => {
                const isSelected = selectedOptions.includes(option);
                const isAlreadyVoted = votedOption?.includes(option);
                const showSelectedStyle = votedOption ? isAlreadyVoted : isSelected;

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(option)}
                    disabled={votedOption !== null || isClosed}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      showSelectedStyle
                        ? 'border-emerald-500 bg-emerald-50/30 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                        : votedOption !== null 
                          ? 'border-slate-100 bg-slate-50/30 text-slate-400 cursor-not-allowed'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 cursor-pointer text-slate-800 font-semibold'
                    }`}
                  >
                    <span className="text-sm">{option}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      showSelectedStyle
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 group-hover:border-slate-400 bg-white'
                    }`}>
                      {showSelectedStyle && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submission Action */}
          {!votedOption && !isClosed && (
            <form onSubmit={handleSubmitVote} className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submittingVote || selectedOptions.length === 0}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-colors"
              >
                {submittingVote ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Vote...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Response</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Already Voted Banner */}
          {votedOption && !isClosed && (
            <div className="pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-center">
              <p className="text-xs font-bold text-slate-700">
                You have already submitted your response.
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Your vote is permanently saved under Student ID <span className="font-mono font-bold text-slate-700">{profile.studentId}</span>.
              </p>
            </div>
          )}

          {/* Closed State */}
          {isClosed && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center text-xs text-red-800 font-semibold">
              This poll is closed. Responses are no longer accepted.
            </div>
          )}
        </div>
      </div>

      {/* Profile Management Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">Student Profile</h3>
                  <p className="text-xs text-slate-500">Saved on this device</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {/* Readonly Core Identifiers */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" /> Student ID:
                </span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {profile.studentId}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Register Number:
                </span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {profile.registerNumber}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Name:
                </span>
                <span className="font-bold text-slate-900">{profile.studentName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Dept / Class:
                </span>
                <span className="font-bold text-slate-900">{profile.department} • Yr {profile.year} Sec {profile.section}</span>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                <span>Device ID: {profile.deviceIdentifier}</span>
              </div>
            </div>

            {/* Editable Contact Info Form */}
            <form onSubmit={handleUpdateContact} className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Update Contact Information
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="student@sctech.edu"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleUnlinkProfile}
                  className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Unlink Profile</span>
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
