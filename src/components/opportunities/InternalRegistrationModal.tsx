import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Upload, CheckCircle2, AlertCircle, FileText, Building2, User, Mail, ShieldCheck, Users, Sparkles } from 'lucide-react';
import { UserSession, Opportunity } from '../../types';

interface InternalRegistrationModalProps {
  opportunity?: Opportunity | null;
  session: UserSession;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InternalRegistrationModal({
  opportunity,
  session,
  onClose,
  onSuccess
}: InternalRegistrationModalProps) {
  const student = session.studentDetails;

  const [opportunityName, setOpportunityName] = useState(opportunity?.title || '');
  const [category, setCategory] = useState<string>(opportunity?.category || 'Hackathon');
  const [organizer, setOrganizer] = useState(opportunity?.companyOrOrganizer || '');
  
  const [officialRegId, setOfficialRegId] = useState('');
  const [officialRegEmail, setOfficialRegEmail] = useState(session.username ? `${session.username.toLowerCase()}@sctech.edu` : '');
  const [teamName, setTeamName] = useState('');
  const [teamMembersText, setTeamMembersText] = useState('');
  
  // Student Profile details
  const [studentName, setStudentName] = useState(student?.studentName || session.name || '');
  const [registerNumber, setRegisterNumber] = useState(student?.registerNumber || session.username || '');
  const [department, setDepartment] = useState(student?.department || 'AI&DS');
  const [year, setYear] = useState(student?.year || 'I');
  const [section, setSection] = useState(student?.section || 'A');
  const [mentorName, setMentorName] = useState(student?.mentorName || 'Mrs.B.Padmapriya');

  // Proof File State
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Proof file size must be less than 5MB');
      return;
    }

    setProofFile(file);
    setProofFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opportunityName.trim()) {
      setErrorMsg('Please enter or select the Opportunity Name');
      return;
    }
    if (!officialRegEmail.trim()) {
      setErrorMsg('Official Registration Email is required');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const teamMembersArray = teamMembersText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (teamMembersArray.length === 0 && studentName) {
      teamMembersArray.push(studentName);
    }

    const payload = {
      opportunityId: opportunity?.id || '',
      opportunityName: opportunityName.trim(),
      category: category || 'Hackathon',
      organizer: organizer.trim() || 'Official Organizer',
      officialRegistrationId: officialRegId.trim(),
      officialRegistrationEmail: officialRegEmail.trim(),
      teamName: teamName.trim() || 'Individual',
      teamMembers: teamMembersArray,
      uploadedProofUrl: proofPreviewUrl || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=600&q=80',
      uploadedProofName: proofFileName || 'registration_proof.png',
      studentName: studentName || 'Student',
      registerNumber: registerNumber || '711525BAD157',
      studentRollNumber: registerNumber || '25BAD157',
      department: department || 'AI&DS',
      year: year || 'I',
      section: section || 'A',
      mentorName: mentorName || 'Mrs.B.Padmapriya',
      remarks: 'Submitted for staff verification'
    };

    try {
      const res = await fetch('/api/opportunity-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit internal registration');
      }

      setSubmittedSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-full transition-all cursor-pointer border border-slate-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center space-x-3 mb-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Internal Portal Submission
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight font-display text-white">
            Register Opportunity & Submit Proof
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            Record your official registration details for staff verification and academic tracking.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {submittedSuccess ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-12 text-center space-y-4"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">✅ Registration Submitted Successfully!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Your internal registration record has been saved and submitted to your Mentor & Department Staff for verification.
              </p>
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2 rounded-xl">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Auto-Notified Staff Portal
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-slate-800">
              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Opportunity Information Section */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" /> 1. Opportunity Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Opportunity Name *</label>
                    <input
                      type="text"
                      required
                      value={opportunityName}
                      onChange={(e) => setOpportunityName(e.target.value)}
                      placeholder="e.g. Smart India Hackathon 2026 / Google Cloud Arcade"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Hackathon">Hackathon</option>
                      <option value="Internship">Internship</option>
                      <option value="Competition">Competition</option>
                      <option value="Ideathon">Ideathon</option>
                      <option value="AI Competitions">AI Competitions</option>
                      <option value="Coding Challenges">Coding Challenges</option>
                      <option value="Smart India Hackathon">Smart India Hackathon</option>
                      <option value="CTF">Capture The Flag (CTF)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Organizer / Host</label>
                    <input
                      type="text"
                      value={organizer}
                      onChange={(e) => setOrganizer(e.target.value)}
                      placeholder="e.g. AICTE, TCS, Unstop, Devfolio"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Official Registration Details Section */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> 2. Official Registration Proof
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Official Registration ID (Optional)</label>
                    <input
                      type="text"
                      value={officialRegId}
                      onChange={(e) => setOfficialRegId(e.target.value)}
                      placeholder="e.g. SIH2026-98421 / REG-40192 (Optional)"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Official Registration Email *</label>
                    <input
                      type="email"
                      required
                      value={officialRegEmail}
                      onChange={(e) => setOfficialRegEmail(e.target.value)}
                      placeholder="e.g. student@sctech.edu"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Team Name (Optional)</label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Code Knights / Individual"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Team Members (Comma Separated)</label>
                    <input
                      type="text"
                      value={teamMembersText}
                      onChange={(e) => setTeamMembersText(e.target.value)}
                      placeholder="e.g. Saran Sai, Sarmila, Vetrivel"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* File Proof Upload */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Upload Registration Proof (PDF / JPG / PNG)</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-white text-center hover:border-blue-500 transition-all cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="proof-upload-input"
                      />
                      <label htmlFor="proof-upload-input" className="cursor-pointer block space-y-2">
                        <Upload className="w-8 h-8 text-blue-600 mx-auto" />
                        <div className="text-xs font-bold text-slate-700">
                          {proofFileName ? (
                            <span className="text-emerald-700 font-extrabold">{proofFileName} (Selected)</span>
                          ) : (
                            <span>Click or Drag & Drop Registration Email / Slip / Ticket (PDF or Image)</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">Supported Formats: PDF, PNG, JPG (Max 5MB)</p>
                      </label>
                    </div>

                    {proofPreviewUrl && proofPreviewUrl.startsWith('data:image') && (
                      <div className="mt-2 p-2 bg-slate-100 rounded-xl border border-slate-200">
                        <img src={proofPreviewUrl} alt="Proof Preview" className="h-32 object-contain mx-auto rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Identification Section */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" /> 3. Student Profile Verification
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block">Student Name</span>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block">Register Number</span>
                    <input
                      type="text"
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block">Department</span>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 font-bold block">Year / Section</span>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-1/2 p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                      />
                      <input
                        type="text"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        className="w-1/2 p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-slate-400 font-bold block">Assigned Mentor</span>
                    <input
                      type="text"
                      value={mentorName}
                      onChange={(e) => setMentorName(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Submitting Record...' : 'Internal Submit'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
