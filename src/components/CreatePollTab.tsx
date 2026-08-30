import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, Send, Plus, Trash2, CheckCircle2, AlertTriangle, HelpCircle, RefreshCw, Code, X } from 'lucide-react';
import { Poll } from '../types';

interface CreatePollTabProps {
  onPollCreated?: () => void;
}

export interface PlatformTemplate {
  id: string;
  name: string;
  title: string;
  question: string;
  options: string[];
  category?: string;
  deadline?: string;
}

export const CODING_PLATFORMS: PlatformTemplate[] = [
  {
    id: 'CodeChef',
    name: 'CodeChef',
    title: 'CodeChef Daily Practice',
    question: 'How many CodeChef problems did you solve today?',
    options: ['0', '1', '2', '3', '4', '5+'],
    category: 'Coding Practice',
    deadline: 'Today 10:00 PM'
  },
  {
    id: 'LeetCode',
    name: 'LeetCode',
    title: 'LeetCode Daily Practice',
    question: 'How many LeetCode problems did you solve today?',
    options: ['0', '1', '2', '3', '4', '5+'],
    category: 'Coding Practice',
    deadline: 'Today 10:00 PM'
  },
  {
    id: 'HackerRank',
    name: 'HackerRank',
    title: 'HackerRank Practice',
    question: 'How many HackerRank problems did you solve today?',
    options: ['0', '1', '2', '3', '4', '5+'],
    category: 'Coding Practice',
    deadline: 'Today 10:00 PM'
  },
  {
    id: 'HackerEarth',
    name: 'HackerEarth',
    title: 'HackerEarth Practice',
    question: 'How many HackerEarth problems did you solve today?',
    options: ['0', '1', '2', '3', '4', '5+'],
    category: 'Coding Practice',
    deadline: 'Today 10:00 PM'
  },
  {
    id: 'Codeforces',
    name: 'Codeforces',
    title: 'Codeforces Practice',
    question: 'How many Codeforces problems did you solve today?',
    options: ['0', '1', '2', '3', '4', '5+'],
    category: 'Coding Practice',
    deadline: 'Today 10:00 PM'
  },
  {
    id: 'AtCoder',
    name: 'AtCoder',
    title: 'AtCoder Daily Practice',
    question: 'How many AtCoder problems did you solve today?',
    options: ['0', '1', '2', '3', '4', '5+'],
    category: 'Coding Practice',
    deadline: 'Today 10:00 PM'
  },
  {
    id: 'GeeksforGeeks',
    name: 'GeeksforGeeks',
    title: 'GeeksforGeeks Practice',
    question: 'How many GeeksforGeeks problems did you solve today?',
    options: ['0', '1', '2', '3', '4', '5+'],
    category: 'Coding Practice',
    deadline: 'Today 10:00 PM'
  },
  {
    id: 'Coding Ninjas',
    name: 'Coding Ninjas',
    title: 'Coding Ninjas Practice',
    question: 'How many Coding Ninjas problems did you solve today?',
    options: ['0', '1', '2', '3', '4', '5+'],
    category: 'Coding Practice',
    deadline: 'Today 10:00 PM'
  },
  {
    id: 'TopCoder',
    name: 'TopCoder',
    title: 'TopCoder Practice',
    question: 'How many TopCoder problems did you solve today?',
    options: ['0', '1', '2', '3', '4', '5+'],
    category: 'Coding Practice',
    deadline: 'Today 10:00 PM'
  },
  {
    id: 'SPOJ',
    name: 'SPOJ',
    title: 'SPOJ Practice',
    question: 'How many SPOJ problems did you solve today?',
    options: ['0', '1', '2', '3', '4', '5+'],
    category: 'Coding Practice',
    deadline: 'Today 10:00 PM'
  }
];

// Web Speech API interface definitions
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onend: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
}

export default function CreatePollTab({ onPollCreated }: CreatePollTabProps) {
  // Coding Platform selection state
  const [selectedPlatform, setSelectedPlatform] = useState<string>('CodeChef');

  // Input fields for manual/AI verification
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['0', '1', '2', '3', '4', '5+']);
  const [deadline, setDeadline] = useState('Today 10:00 PM');
  const [targetDepartment, setTargetDepartment] = useState('AI&DS');
  const [targetYear, setTargetYear] = useState('I');
  const [targetSection, setTargetSection] = useState('A');
  const [type, setType] = useState<'Single' | 'Multiple'>('Single');

  // AI & Voice state
  const [promptText, setPromptText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Apply template helper
  const applyPlatformTemplate = (platformId: string) => {
    setSelectedPlatform(platformId);
    try {
      localStorage.setItem('last_selected_platform', platformId);
    } catch (e) {
      console.error(e);
    }

    if (platformId === 'custom') {
      setTitle('');
      setQuestion('');
      setOptions(['', '']);
      setDeadline('Today 10:00 PM');
      setSuccessMsg('Form cleared for Custom Poll manual entry.');
      return;
    }

    const tpl = CODING_PLATFORMS.find(p => p.id === platformId);
    if (tpl) {
      setTitle(tpl.title);
      setQuestion(tpl.question);
      setOptions([...tpl.options]);
      if (tpl.deadline) setDeadline(tpl.deadline);
      setSuccessMsg(`Auto-filled poll template for ${tpl.name}! You can edit any field before publishing.`);
    }
  };

  // Load last remembered platform or default to CodeChef on page load
  useEffect(() => {
    let saved = 'CodeChef';
    try {
      const stored = localStorage.getItem('last_selected_platform');
      if (stored) {
        saved = stored;
      }
    } catch (e) {
      console.error(e);
    }

    applyPlatformTemplate(saved);
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPromptText(transcript);
        // Automatically parse using AI after transcription completes!
        parseWithAI(transcript);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition error:", e);
        setIsListening(false);
        
        let customMsg = "Voice input was not captured. Please speak clearly or type your prompt manually.";
        if (e.error === 'not-allowed') {
          customMsg = "Microphone permission is blocked. Please allow microphone access in your browser settings, or click the 'Open in New Tab' icon to try again.";
        } else if (e.error === 'no-speech') {
          customMsg = "No voice was detected. Please speak clearly into your microphone or type your prompt manually.";
        } else if (e.error === 'audio-capture') {
          customMsg = "No audio capture device was found. Please check your microphone connection.";
        }
        setErrorMsg(customMsg);
      };

      setRecognition(rec);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please type your prompt.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setErrorMsg(null);
      setSuccessMsg(null);
      recognition.start();
    }
  };

  const parseWithAI = async (textToParse: string) => {
    const query = textToParse || promptText;
    if (!query.trim()) {
      setErrorMsg("Please say something or type a prompt first.");
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/ai/parse-poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query })
      });

      const data = await response.json();
      if (response.ok && data.poll) {
        // Populate form with AI extracted properties!
        const p = data.poll;
        setTitle(p.title || '');
        setQuestion(p.question || '');
        setOptions(p.options && p.options.length >= 2 ? p.options : ['', '']);
        setDeadline(p.deadline || 'Tonight 10 PM');
        setTargetDepartment(p.targetDepartment || 'AI&DS');
        setTargetYear(p.targetYear || 'III');
        setTargetSection(p.targetSection || 'A');
        setType(p.type || 'Single');
        
        setSuccessMsg("AI successfully generated your poll details! You can review and edit them below before publishing.");
      } else {
        setErrorMsg(data.error || "AI was unable to parse the prompt. Please try typing standard sentences.");
      }
    } catch (e) {
      setErrorMsg("Unable to connect to AI server. Please fill manually.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmitPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate inputs
    if (!title.trim() || !question.trim()) {
      setErrorMsg("Poll Title and Question are required.");
      return;
    }

    const filteredOptions = options.map(o => o.trim()).filter(o => o !== '');
    if (filteredOptions.length < 2) {
      setErrorMsg("A poll must contain at least 2 non-empty options.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/polls/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          question: question.trim(),
          options: filteredOptions,
          deadline: deadline.trim(),
          targetDepartment,
          targetYear,
          targetSection,
          type
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMsg(`Poll "${title}" published successfully! Redirecting you to Live Tracking...`);
        // Reset form
        setTitle('');
        setQuestion('');
        setOptions(['', '']);
        setPromptText('');

        if (onPollCreated) {
          setTimeout(() => {
            onPollCreated();
          }, 1500);
        }
      } else {
        setErrorMsg(data.error || "Failed to create poll.");
      }
    } catch (err) {
      setErrorMsg("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Voice to Poll & Text to Poll Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-900 font-display flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <span>AI "Voice to Poll" / "Text to Poll" Generator</span>
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Say or type your poll idea. The AI will instantly generate the Title, Question, Options, Target Group, and Deadline.
        </p>

        {/* Recording & Input controls */}
        <div className="mt-5 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={toggleListening}
              className={`p-4 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-200' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
              title={isListening ? "Stop listening" : "Click to speak"}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <div className="flex-1 relative">
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={isListening ? "Listening closely... Speak now!" : "e.g., Create a poll for AI&DS A section. How many CodeChef problems did you solve today? Options 0 1 2 3 4. Deadline tonight 10 PM."}
                className="w-full h-full pl-4 pr-28 py-3 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                onClick={() => parseWithAI('')}
                disabled={isParsing || !promptText.trim()}
                className="absolute right-2 top-2 px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1 cursor-pointer"
              >
                <span>Generate</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span>Supported via Chrome Web Speech API & Gemini Flash</span>
            <span className="text-blue-600 font-semibold cursor-pointer" onClick={() => setPromptText("Create attendance poll for AI&DS A section. Options: Present, Absent.")}>
              Try Demo Text: "Attendance Poll"
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-r-xl flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-semibold">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-xl flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Poll Creation / Verification Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display flex items-center space-x-2">
              <Code className="w-5 h-5 text-blue-600" />
              <span>Poll Details & Publishing Form</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a Coding Platform template or build a custom poll for your students.
            </p>
          </div>
        </div>

        {/* Coding Platform Selector Banner */}
        <div className="bg-gradient-to-r from-blue-50/90 via-slate-50 to-indigo-50/80 border border-blue-200/80 rounded-2xl p-5 mb-8 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Coding Platform Template</span>
              </label>
              <p className="text-xs text-slate-600">
                Instantly prefill title, question, and options with standard platform templates.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={selectedPlatform}
                onChange={(e) => applyPlatformTemplate(e.target.value)}
                className="bg-white border-2 border-blue-300 hover:border-blue-400 text-slate-900 text-sm font-bold rounded-xl px-4 py-2.5 shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-[220px]"
              >
                <optgroup label="Preloaded Coding Platforms">
                  {CODING_PLATFORMS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} Template
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Manual Entry">
                  <option value="custom">⚡ Custom Poll (Clear / Blank Entry)</option>
                </optgroup>
              </select>

              {selectedPlatform !== 'custom' && (
                <button
                  type="button"
                  onClick={() => applyPlatformTemplate('custom')}
                  className="text-xs font-semibold px-3 py-2.5 text-slate-600 hover:text-red-600 bg-white border border-slate-200 hover:bg-red-50 rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
                  title="Clear fields for Custom Poll"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Custom</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile-friendly Quick Selection Chips */}
          <div className="mt-4 pt-3 border-t border-blue-200/60 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mr-1">Quick Select:</span>
            {CODING_PLATFORMS.map(p => {
              const isSelected = selectedPlatform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPlatformTemplate(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs scale-105'
                      : 'bg-white text-slate-700 hover:bg-blue-100 hover:text-blue-700 border border-slate-200/80'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => applyPlatformTemplate('custom')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedPlatform === 'custom'
                  ? 'bg-slate-800 text-white shadow-xs scale-105'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              Custom Poll
            </button>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmitPoll}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Poll Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CodeChef Daily Poll"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Deadline</label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="e.g. Tonight 10 PM, 23rd October 4 PM"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Poll Question</label>
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. How many problems did you solve today?"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Options input */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-slate-700">Poll Options</label>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-bold w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Target details and Single/Multiple choice selection */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-1">
              <span>Target Distribution & Settings</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                <select
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Departments</option>
                  <option value="AI&DS">AI&DS</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Year</label>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Years</option>
                  <option value="I">I Year</option>
                  <option value="II">II Year</option>
                  <option value="III">III Year</option>
                  <option value="IV">IV Year</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Section</label>
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Sections</option>
                  <option value="A">A Section</option>
                  <option value="B">B Section</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Answer Choice Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-semibold text-blue-700"
                >
                  <option value="Single">Single Choice (Radio)</option>
                  <option value="Multiple">Multiple Choice (Checkboxes)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isParsing || isSubmitting}
              className="px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-xs transition-colors cursor-pointer flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <span>Publish Active Poll</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
