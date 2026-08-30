import React, { useState } from 'react';
import { ResumeData, ResumeAtsAnalysis } from '../../types/resume';
import { Target, Sparkles, CheckCircle2, AlertTriangle, Info, BarChart3, Search, RefreshCw } from 'lucide-react';

interface JobMatchAnalyzerViewProps {
  resume: ResumeData;
  onUpdateAnalysis: (analysis: ResumeAtsAnalysis, jdText: string) => void;
}

export default function JobMatchAnalyzerView({ resume, onUpdateAnalysis }: JobMatchAnalyzerViewProps) {
  const [jobDescription, setJobDescription] = useState(resume.jobDescription || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [targetRole, setTargetRole] = useState(resume.targetJobTitle || '');

  const analysis = resume.atsAnalysis;

  const handleAnalyzeJob = async () => {
    if (!jobDescription.trim()) {
      alert("Please paste a Job Description to analyze match compatibility.");
      return;
    }

    try {
      setIsAnalyzing(true);
      const resp = await fetch('/api/resume/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: resume,
          jobDescription: jobDescription.trim()
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.atsAnalysis) {
          onUpdateAnalysis(data.atsAnalysis, jobDescription.trim());
        }
      }
    } catch (err) {
      console.error("Job analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-400/30 text-blue-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold font-display">
              🎯 Job Description Optimization Mode
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Paste a target job posting to compute your <strong className="text-amber-300">SC SkillTrack ATS Compatibility Estimate</strong> and identify skill gaps.
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
            Target Job Role / Title (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Associate Software Engineer, AI/ML Intern, Data Analyst"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
            Paste Job Description (JD)
          </label>
          <textarea
            rows={6}
            placeholder="Paste complete job description requirements, responsibilities, and qualifications here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full text-xs sm:text-sm p-3.5 bg-slate-50 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
          />
        </div>

        <button
          onClick={handleAnalyzeJob}
          disabled={isAnalyzing || !jobDescription.trim()}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Job Match...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" /> Analyze Job Match & Recalculate ATS Score
            </>
          )}
        </button>
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-6">
          {/* Score Header Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ATS Score Card */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Overall ATS Compatibility
              </span>
              <div className="my-3 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-amber-400">
                  {analysis.atsScore}
                </span>
                <span className="text-sm font-bold text-slate-400">/ 100</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                SC SkillTrack ATS Compatibility Estimate
              </p>
            </div>

            {/* Overall Job Match Score */}
            {analysis.jobMatchBreakdown && (
              <div className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-5 rounded-2xl border border-indigo-700 shadow-md flex flex-col justify-between">
                <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                  Target Job Match Rate
                </span>
                <div className="my-3 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-emerald-400">
                    {analysis.jobMatchBreakdown.overallMatch}%
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200 font-medium">
                  Keyword & skill relevance against posted JD
                </p>
              </div>
            )}

            {/* Keyword Ratio Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Matched Target Keywords
              </span>
              <div className="my-3">
                <span className="text-3xl font-extrabold text-slate-900">
                  {analysis.matchedKeywords?.length || 0}
                </span>
                <span className="text-sm text-slate-500 ml-1 font-medium">
                  / {(analysis.matchedKeywords?.length || 0) + (analysis.missingKeywords?.length || 0)} found
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {analysis.missingKeywords?.length || 0} missing target skills
              </p>
            </div>
          </div>

          {/* Breakdown Progress Bars */}
          {analysis.jobMatchBreakdown && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Job Match Category Breakdown
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Technical Skills Match</span>
                    <span>{analysis.jobMatchBreakdown.technicalSkills}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${analysis.jobMatchBreakdown.technicalSkills}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Keyword Density & Coverage</span>
                    <span>{analysis.jobMatchBreakdown.keywords}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${analysis.jobMatchBreakdown.keywords}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Project Relevance</span>
                    <span>{analysis.jobMatchBreakdown.projects}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${analysis.jobMatchBreakdown.projects}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Education Requirements</span>
                    <span>{analysis.jobMatchBreakdown.education}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${analysis.jobMatchBreakdown.education}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Keywords Grid (Matched vs Missing) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matched Keywords */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 sm:p-5 rounded-2xl space-y-3">
              <h4 className="text-xs sm:text-sm font-extrabold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Matched Keywords in Profile ({analysis.matchedKeywords?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.matchedKeywords?.length > 0 ? (
                  analysis.matchedKeywords.map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 shadow-2xs flex items-center gap-1">
                      {kw} ✓
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-emerald-700 font-medium">No direct keyword matches yet.</p>
                )}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="bg-amber-50/70 border border-amber-200 p-4 sm:p-5 rounded-2xl space-y-3">
              <h4 className="text-xs sm:text-sm font-extrabold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Missing Target Keywords ({analysis.missingKeywords?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {analysis.missingKeywords?.length > 0 ? (
                  analysis.missingKeywords.map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white text-amber-800 text-xs font-bold rounded-lg border border-amber-300 shadow-2xs">
                      {kw}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-emerald-700 font-bold">✓ All job description target skills matched!</p>
                )}
              </div>

              {/* MANDATED DISCLAIMER */}
              <div className="bg-amber-100/80 p-2.5 rounded-xl border border-amber-300 text-[11px] text-amber-900 font-medium leading-relaxed flex items-start gap-1.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Important:</strong> Add missing skills to your resume <strong>ONLY if you genuinely possess experience with them</strong>. Never fabricate skills to game ATS filters.
                </span>
              </div>
            </div>
          </div>

          {/* Actionable Suggestions List */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                Actionable ATS Improvement Checklist
              </h3>
              <div className="space-y-2">
                {analysis.suggestions.map((s, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-xl border text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-2 ${
                      s.type === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : s.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-blue-50 border-blue-200 text-blue-900'
                    }`}
                  >
                    {s.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                    {s.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                    {s.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}

                    <div>
                      <div>{s.message}</div>
                      {s.actionable && (
                        <div className="mt-1 font-semibold text-slate-800 text-xs">
                          👉 {s.actionable}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
