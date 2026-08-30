import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Clock, ToggleLeft, ToggleRight, Trash2, Send, 
  Copy, Check, Share2, Users, CheckCircle, AlertCircle, RefreshCw,
  FileText, Download
} from 'lucide-react';
import ReminderModal from './ReminderModal';
import { downloadFullPollReportPDF } from '../services/pdfReportService';

interface Poll {
  id: string;
  title: string;
  question: string;
  options: string[];
  deadline: string;
  targetDepartment: string;
  targetYear: string;
  targetSection: string;
  status: 'Active' | 'Closed';
  type: 'Single' | 'Multiple';
  createdAt: string;
}

interface PollStats {
  totalStudents: number;
  respondedCount: number;
  pendingCount: number;
  participationRate: number;
}

interface TrackingData {
  poll: Poll;
  stats: PollStats;
  respondedStudents: any[];
  pendingStudents: any[];
  optionsStats: Record<string, number>;
}

export default function ActivePollsTab() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  useEffect(() => {
    fetchPolls(true);
    // Periodically sync list of polls every 5s
    const pollInterval = setInterval(() => {
      fetchPolls(false);
    }, 5000);
    return () => clearInterval(pollInterval);
  }, []);

  const fetchPolls = async (showInitialLoading = false) => {
    try {
      if (showInitialLoading) setLoading(true);
      const res = await fetch('/api/polls');
      if (res.ok) {
        const data = await res.json();
        setPolls(data);
        if (data.length > 0 && !selectedPollId) {
          setSelectedPollId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Error fetching polls:", e);
    } finally {
      if (showInitialLoading) setLoading(false);
    }
  };

  // Fetch stats and non-responders whenever selectedPollId changes and poll every 3 seconds for real-time updates
  useEffect(() => {
    if (!selectedPollId) {
      setTrackingData(null);
      return;
    }

    // Initial fetch with spinner
    fetchTracking(selectedPollId, true);

    // Real-time polling without UI spinner flicker
    const interval = setInterval(() => {
      fetchTracking(selectedPollId, false);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedPollId]);

  const fetchTracking = async (pollId: string, showLoadingSpinner = false) => {
    try {
      if (showLoadingSpinner) setTrackingLoading(true);
      const res = await fetch(`/api/tracking/${pollId}`);
      if (res.ok) {
        const data = await res.json();
        setTrackingData(data);
      }
    } catch (e) {
      console.error("Error fetching tracking details:", e);
    } finally {
      if (showLoadingSpinner) setTrackingLoading(false);
    }
  };

  const handleToggleStatus = async (pollId: string) => {
    try {
      const res = await fetch(`/api/polls/${pollId}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        // Refresh polls
        const updatedPolls = polls.map(p => {
          if (p.id === pollId) {
            return { ...p, status: p.status === 'Active' ? 'Closed' : 'Active' as any };
          }
          return p;
        });
        setPolls(updatedPolls);
        // Refresh tracking if it's the current selected poll
        if (selectedPollId === pollId) {
          fetchTracking(pollId);
        }
        showToast("Poll status toggled successfully.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm("Are you sure you want to delete this poll and all its responses?")) return;
    try {
      const res = await fetch(`/api/polls/${pollId}`, { method: 'DELETE' });
      if (res.ok) {
        setPolls(polls.filter(p => p.id !== pollId));
        if (selectedPollId === pollId) {
          setSelectedPollId(null);
          setTrackingData(null);
        }
        showToast("Poll deleted successfully.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReminder = () => {
    setReminderModalOpen(true);
  };

  const copyShareLink = (pollId: string) => {
    // Generate simple share link
    const link = `${window.location.origin}/?poll=${pollId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(pollId);
    setTimeout(() => setCopiedId(null), 2000);
    showToast("Share link copied to clipboard!");
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white font-bold py-3 px-5 rounded-lg shadow-xl flex items-center space-x-2 border border-emerald-500 animate-bounce">
          <CheckCircle className="w-5 h-5 text-white" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Active Polls List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="text-md font-bold text-slate-900 font-display">Active & Historical Polls</h3>
            <button onClick={() => fetchPolls()} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : polls.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No polls found. Create one first!</p>
          ) : (
            <div className="space-y-3">
              {polls.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPollId(p.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedPollId === p.id 
                      ? 'border-blue-500 bg-blue-50/10 shadow-xs ring-2 ring-blue-500/5' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{p.title}</h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider ${
                      p.status === 'Active' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-1 font-semibold">{p.question}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>Target: {p.targetDepartment} - {p.targetSection}</span>
                    <span className="flex items-center space-x-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{p.deadline}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Tracking Analytics, distribution and non-responders list */}
        <div className="lg:col-span-2 space-y-6">
          {trackingLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-slate-500 mt-4 font-medium">Calculating statistics and loading responder profiles...</p>
            </div>
          ) : trackingData ? (
            <>
              {/* Top Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Total Students</span>
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-900">{trackingData.stats.totalStudents}</p>
                  <span className="text-[10px] font-medium text-slate-500">Targeted Audience</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Responded</span>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-black text-emerald-600">{trackingData.stats.respondedCount}</p>
                  <span className="text-[10px] font-medium text-slate-500">Votes Received</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Pending</span>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-black text-amber-600">{trackingData.stats.pendingCount}</p>
                  <span className="text-[10px] font-medium text-slate-500">Awaiting Response</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Participation</span>
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-2xl font-black text-purple-600">{trackingData.stats.participationRate}%</p>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-purple-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(trackingData.stats.participationRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Poll Distribution and Option Statistics */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">
                  Live Voting Distribution results
                </h3>
                <p className="text-md font-semibold text-slate-800 mb-6">{trackingData.poll.question}</p>

                {trackingData.stats.respondedCount === 0 && (
                  <div className="mb-6 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                    <p className="text-slate-600 font-semibold text-sm">No responses received yet.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {trackingData.poll.options.map(opt => {
                    const count = trackingData.optionsStats[opt] || 0;
                    const percent = trackingData.stats.respondedCount > 0 
                      ? Math.round((count / trackingData.stats.respondedCount) * 100) 
                      : 0;

                    return (
                      <div key={opt} className="space-y-1">
                        <div className="flex justify-between text-sm font-medium">
                          <span className="text-slate-700">{opt}</span>
                          <span className="text-slate-500 font-bold">{count} vote(s) ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Non Responders and Pending list */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 flex-wrap gap-2">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>Non Responders ({trackingData.pendingStudents.length})</span>
                  </h3>
                  <button
                    onClick={handleSendReminder}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reminder</span>
                  </button>
                </div>

                {trackingData.pendingStudents.length === 0 ? (
                  <p className="text-sm text-emerald-600 font-semibold text-center py-6">
                    Perfect! 100% participation achieved. No pending students detected.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-500 border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-400 font-semibold uppercase">
                          <th className="py-2.5 px-3">Roll No</th>
                          <th className="py-2.5 px-3">Student Name</th>
                          <th className="py-2.5 px-3">Department</th>
                          <th className="py-2.5 px-3">Section</th>
                          <th className="py-2.5 px-3">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {trackingData.pendingStudents.map((st, idx) => (
                          <tr key={st.rollNumber} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{st.rollNumber}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{st.studentName}</td>
                            <td className="py-2.5 px-3">{st.department}</td>
                            <td className="py-2.5 px-3">{st.section}</td>
                            <td className="py-2.5 px-3 text-xs">{st.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Distribution & Share Controls */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">
                  Share & Status Actions
                </h3>

                <div className="flex flex-wrap gap-4 items-center justify-between">
                  {/* Share & Report buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => trackingData && downloadFullPollReportPDF(trackingData)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all"
                      title="Download PDF report for this poll"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" />
                      <span>Export PDF Report</span>
                    </button>

                    <button
                      onClick={() => copyShareLink(trackingData.poll.id)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedId === trackingData.poll.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy link</span>
                    </button>

                    <a
                      href={`https://api.whatsapp.com/send?text=Please vote in this poll: ${encodeURIComponent(trackingData.poll.title)} - ${encodeURIComponent(trackingData.poll.question)}! Submit your answer here: ${encodeURIComponent(`${window.location.origin}/?poll=${trackingData.poll.id}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:bg-[#20ba59] flex items-center space-x-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp Share</span>
                    </a>
                  </div>

                  {/* Toggle and Delete */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(trackingData.poll.id)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 flex items-center space-x-1.5 cursor-pointer"
                    >
                      {trackingData.poll.status === 'Active' ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-emerald-500" />
                          <span>Close Poll</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                          <span>Activate Poll</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeletePoll(trackingData.poll.id)}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-xl flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* QR Code */}
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(`${window.location.origin}/?poll=${trackingData.poll.id}`)}`}
                    alt="Poll QR Code"
                    className="w-24 h-24 bg-white p-1 rounded-md border border-slate-200 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Share via QR Code</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Display this QR Code in the classroom or presentation screen. Students can scan with their phone cameras to open and answer the poll instantly.
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center py-20 text-slate-400">
              Select a poll on the left to inspect live responder tracking and analytics.
            </div>
          )}
        </div>
      </div>

      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        poll={trackingData?.poll || null}
        pendingStudents={trackingData?.pendingStudents || []}
        onSuccessToast={showToast}
      />
    </div>
  );
}
