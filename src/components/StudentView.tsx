import React, { useState, useEffect } from 'react';
import { LogOut, User, CheckCircle2, Bookmark, Clock, ArrowRight, HelpCircle, Trophy, Vote, Activity, Compass, Sparkles } from 'lucide-react';
import { UserSession, Poll } from '../types';
import HackathonHubContainer from './hackathon/HackathonHubContainer';
import CodeAnalyticsContainer from './analytics/CodeAnalyticsContainer';
import CareerOpportunitiesHub from './opportunities/CareerOpportunitiesHub';
import SIDHCourseTrackerContainer from './sidh/SIDHCourseTrackerContainer';
import ResumeBuilderContainer from './resume/ResumeBuilderContainer';
import { GraduationCap, FileText } from 'lucide-react';

interface StudentViewProps {
  session: UserSession;
  onLogout: () => void;
}

export default function StudentView({ session, onLogout }: StudentViewProps) {
  const [activeMainTab, setActiveMainTab] = useState<'polls' | 'opportunities' | 'hackathons' | 'analytics' | 'sidh' | 'resume'>('polls');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votedPolls, setVotedPolls] = useState<Record<string, string[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [votingStates, setVotingStates] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  const student = session.studentDetails;

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    if (!student) return;
    try {
      setLoading(true);
      // Fetch targeted polls
      const response = await fetch(`/api/polls/target/${student.rollNumber}`);
      if (response.ok) {
        const pollsData = await response.json();
        setPolls(pollsData);

        // Fetch user's existing response states for each poll
        const votedMap: Record<string, string[]> = {};
        const sRoll = (student.rollNumber || "").toLowerCase();
        const sReg = (student.registerNumber || "").toLowerCase();

        for (const p of pollsData) {
          try {
            const resp = await fetch(`/api/tracking/${p.id}`);
            if (resp.ok) {
              const data = await resp.json();
              if (data.responses && Array.isArray(data.responses)) {
                const myVote = data.responses.find((r: any) => {
                  const rId = (r.studentRollNumber || "").toLowerCase();
                  return rId === sRoll || rId === sReg || rId.endsWith(sRoll) || sReg.endsWith(rId);
                });

                if (myVote && myVote.selectedOptions) {
                  votedMap[p.id] = myVote.selectedOptions;
                }
              }
            }
          } catch (e) {
            console.error(`Error checking vote status for poll ${p.id}:`, e);
          }
        }

        setVotedPolls(votedMap);
        setSelectedOptions(votedMap);
      }
    } catch (e) {
      console.error("Error loading polls:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (pollId: string, option: string, isMultiple: boolean) => {
    const currentSelected = selectedOptions[pollId] || [];
    if (isMultiple) {
      if (currentSelected.includes(option)) {
        setSelectedOptions({
          ...selectedOptions,
          [pollId]: currentSelected.filter(o => o !== option)
        });
      } else {
        setSelectedOptions({
          ...selectedOptions,
          [pollId]: [...currentSelected, option]
        });
      }
    } else {
      setSelectedOptions({
        ...selectedOptions,
        [pollId]: [option]
      });
    }
  };

  const submitVote = async (pollId: string) => {
    if (!student) return;
    const selections = selectedOptions[pollId] || [];
    if (selections.length === 0) {
      alert("Please select at least one option to submit your vote.");
      return;
    }

    setVotingStates({ ...votingStates, [pollId]: true });

    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentRollNumber: student.rollNumber,
          selectedOptions: selections
        })
      });

      const data = await response.json();
      if (response.ok) {
        setMessages({
          ...messages,
          [pollId]: "Your response has been recorded successfully."
        });
        setVotedPolls({
          ...votedPolls,
          [pollId]: selections
        });
      } else {
        alert(data.error || "Failed to submit vote");
      }
    } catch (err) {
      alert("Unable to submit vote. Please try again.");
    } finally {
      setVotingStates({ ...votingStates, [pollId]: false });
    }
  };

  // We can fetch what the user voted by requesting `/api/tracking/:pollId`. Let's make sure we find if we voted.
  // To keep things super robust, let's fetch tracking for all polls and search for our vote.
  // We can also let the student see their vote if they just submitted it or if they reload, we search in the responded list.
  // Let's write a small effect that queries tracking data for all polls to check if current student already voted, and sets the voted state.
  useEffect(() => {
    if (polls.length === 0 || !student) return;

    const checkVotes = async () => {
      const updatedVoted: Record<string, string[]> = {};
      const updatedSelected: Record<string, string[]> = {};
      
      for (const poll of polls) {
        try {
          const res = await fetch(`/api/tracking/${poll.id}`);
          if (res.ok) {
            const data = await res.json();
            // Check if student roll number is in responded list
            const isVoted = data.respondedStudents.some((s: any) => s.rollNumber === student.rollNumber);
            if (isVoted) {
              // Wait, since tracking returns optionsStats, we can fetch the student's voted selection.
              // Let's check if the server tracking returns the responses list. We will update server.ts in the next tool call to return responses in tracking!
              // For now, let's load what's there.
              // Let's parse responses. We'll edit server.ts to include the raw poll_responses in the response body!
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    checkVotes();
  }, [polls]);

  // Let's create a trigger to load student responses
  const triggerCheckResponses = async () => {
    if (polls.length === 0 || !student) return;
    try {
      const updatedVoted: Record<string, string[]> = {};
      for (const p of polls) {
        const r = await fetch(`/api/tracking/${p.id}`);
        if (r.ok) {
          const track = await r.json();
          const sRoll = (student.rollNumber || "").toLowerCase();
          const sReg = (student.registerNumber || "").toLowerCase();

          if (track.responses) {
            const myResp = track.responses.find((resObj: any) => {
              const rId = (resObj.studentRollNumber || "").toLowerCase();
              return rId === sRoll || rId === sReg || rId.endsWith(sRoll) || sReg.endsWith(rId);
            });
            if (myResp) {
              updatedVoted[p.id] = myResp.selectedOptions;
            }
          } else {
            const hasVoted = track.respondedStudents.some((s: any) => {
              const sr = (s.rollNumber || "").toLowerCase();
              const srg = (s.registerNumber || "").toLowerCase();
              return sr === sRoll || srg === sReg;
            });
            if (hasVoted) {
              updatedVoted[p.id] = ["Recorded"];
            }
          }
        }
      }
      setVotedPolls(prev => ({ ...prev, ...updatedVoted }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    triggerCheckResponses();
  }, [polls]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 md:px-8 py-3 sm:py-6">
      {/* Student Details Header */}
      {student && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5 md:p-6 mb-4 sm:mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <User className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900 font-display truncate">{student.studentName}</h1>
              <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5 text-xs font-semibold">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">Roll: {student.rollNumber}</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">Reg: {student.registerNumber}</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">{student.department} - Year {student.year} - Sec {student.section}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Student Module Switcher Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-4 sm:mb-6 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveMainTab('polls')}
          className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeMainTab === 'polls'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Vote className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="truncate">Smart Polls</span>
        </button>

        <button
          onClick={() => setActiveMainTab('opportunities')}
          className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeMainTab === 'opportunities'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <Compass className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate">Career Hub</span>
        </button>

        <button
          onClick={() => setActiveMainTab('analytics')}
          className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeMainTab === 'analytics'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="truncate">Code Analytics</span>
        </button>

        <button
          onClick={() => setActiveMainTab('hackathons')}
          className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeMainTab === 'hackathons'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">Hackathon Hub</span>
        </button>

        <button
          onClick={() => setActiveMainTab('sidh')}
          className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeMainTab === 'sidh'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="truncate">SIDH Courses</span>
        </button>

        <button
          onClick={() => setActiveMainTab('resume')}
          className={`flex items-center justify-center space-x-1.5 sm:space-x-2 py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-w-0 ${
            activeMainTab === 'resume'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="truncate">AI Resume Builder</span>
        </button>
      </div>

      {/* Render Active View */}
      {activeMainTab === 'opportunities' ? (
        <CareerOpportunitiesHub session={session} />
      ) : activeMainTab === 'hackathons' ? (
        <HackathonHubContainer session={session} />
      ) : activeMainTab === 'analytics' ? (
        <CodeAnalyticsContainer key={session.username} session={session} />
      ) : activeMainTab === 'sidh' ? (
        <SIDHCourseTrackerContainer key={session.username} session={session} />
      ) : activeMainTab === 'resume' ? (
        <ResumeBuilderContainer session={session} />
      ) : (
        /* Main Polls Section */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 font-display flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-blue-600" />
            <span>Assigned Polls ({polls.filter(p => p.status === 'Active').length})</span>
          </h2>
          <span className="text-xs text-slate-500 font-semibold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
            Realtime updates
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-sm text-slate-500">Loading your assigned polls...</p>
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-md font-bold text-slate-900">No active polls assigned to you</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              Staff has not created or scheduled any polls for your department ({student?.department}), year ({student?.year}), or section ({student?.section}) yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {polls.map((poll) => {
              const isVoted = votedPolls[poll.id] !== undefined;
              const userSelection = votedPolls[poll.id] || [];
              const isClosed = poll.status === 'Closed';
              
              return (
                <div 
                  key={poll.id} 
                  className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                    isVoted 
                      ? 'border-emerald-300 bg-emerald-50/5 shadow-xs' 
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-xs'
                  }`}
                >
                  {/* Top Bar Status */}
                  <div className={`px-6 py-3 border-b text-xs font-semibold flex justify-between items-center ${
                    isVoted 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                      : 'bg-gray-50 text-gray-600 border-gray-100'
                  }`}>
                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Deadline: {poll.deadline}</span>
                    </span>
                    <span className="uppercase tracking-wider px-2 py-0.5 rounded-sm bg-white border font-bold">
                      {poll.type === 'Multiple' ? 'Multiple Choice' : 'Single Choice'}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 font-display">
                      {poll.title}
                    </h3>
                    <p className="mt-2 text-md text-gray-700 font-medium">
                      {poll.question}
                    </p>

                    {/* Voted success banner */}
                    {(isVoted || messages[poll.id]) && (
                      <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center space-x-2 text-sm font-semibold">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>{messages[poll.id] || "Your response has been recorded successfully."}</span>
                      </div>
                    )}

                    {/* Options list */}
                    <div className="mt-6 space-y-3">
                      {poll.options.map((option, optIdx) => {
                        const isSelected = (selectedOptions[poll.id] || []).includes(option);
                        const isVotedOption = userSelection.includes(option) || userSelection.includes("Recorded");
                        const disabled = isVoted || isClosed;

                        return (
                          <label
                            key={optIdx}
                            className={`flex items-center p-4 border rounded-lg transition-all ${
                              disabled 
                                ? isVotedOption 
                                  ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900 font-semibold'
                                  : 'border-gray-100 bg-gray-50 text-gray-400'
                                : isSelected
                                  ? 'border-blue-500 bg-blue-50/40 text-blue-900 ring-2 ring-blue-500/20 font-medium cursor-pointer'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 cursor-pointer'
                            }`}
                          >
                            <input
                              type={poll.type === 'Multiple' ? 'checkbox' : 'radio'}
                              name={`poll-${poll.id}`}
                              disabled={disabled}
                              checked={isVoted ? isVotedOption : isSelected}
                              onChange={() => handleOptionSelect(poll.id, option, poll.type === 'Multiple')}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-3 text-sm">{option}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Submit Section */}
                    {!isVoted && !isClosed && (
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => submitVote(poll.id)}
                          disabled={votingStates[poll.id] || (selectedOptions[poll.id] || []).length === 0}
                          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                        >
                          {votingStates[poll.id] ? (
                            <span>Submitting...</span>
                          ) : (
                            <>
                              <span>Submit Vote</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {isClosed && !isVoted && (
                      <div className="mt-6 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center space-x-2 text-sm">
                        <HelpCircle className="w-5 h-5 text-red-500" />
                        <span>This poll is closed. You did not participate.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
