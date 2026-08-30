import React, { useState, useEffect } from 'react';
import { UserSession } from '../../types';
import { ResumeData, ResumeAtsAnalysis, ResumeTemplateType } from '../../types/resume';
import ResumeFormEditor from './ResumeFormEditor';
import ResumeLivePreview from './ResumeLivePreview';
import JobMatchAnalyzerView from './JobMatchAnalyzerView';
import StaffResumeAnalyticsView from './StaffResumeAnalyticsView';
import ResumeComparisonModal from './ResumeComparisonModal';
import { 
  FileText, Sparkles, Target, BarChart2, History, Plus, 
  Trash2, RefreshCw, CheckCircle2, ShieldAlert, Eye, Edit3, ArrowLeftRight
} from 'lucide-react';

interface ResumeBuilderContainerProps {
  session: UserSession;
}

const DEFAULT_BLANK_RESUME = (regNum: string, name?: string, email?: string, phone?: string): ResumeData => ({
  id: '',
  studentRegisterNumber: regNum,
  title: 'General Resume',
  template: 'classic',
  contact: {
    fullName: name || '',
    email: email || '',
    phone: phone || '',
    location: 'Coimbatore, Tamil Nadu',
    linkedin: '',
    github: '',
    portfolio: ''
  },
  summary: '',
  education: {
    college: 'KPR Institute of Engineering and Technology',
    degree: 'Bachelor of Technology (B.Tech)',
    department: 'Artificial Intelligence and Data Science',
    year: '3rd Year',
    cgpa: '',
    graduationYear: '2026'
  },
  skills: {
    programmingLanguages: [],
    frameworks: [],
    databases: [],
    tools: [],
    aiMlSkills: [],
    cloudSkills: [],
    otherSkills: []
  },
  projects: [],
  experience: [],
  certifications: [],
  achievements: [],
  codingProfiles: {
    leetcode: '',
    codechef: '',
    codeforces: '',
    hackerrank: ''
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export default function ResumeBuilderContainer({ session }: ResumeBuilderContainerProps) {
  const isStaff = session.role === 'Staff';
  const student = session.studentDetails;
  const regNum = student?.registerNumber || session.studentRollNumber || session.username;

  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [currentResume, setCurrentResume] = useState<ResumeData>(
    DEFAULT_BLANK_RESUME(regNum, student?.studentName || session.name, student?.email, student?.phoneNumber)
  );

  const [subTab, setSubTab] = useState<'editor' | 'preview' | 'jobmatch' | 'ats' | 'history' | 'staff'>('editor');
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [isBuildingAi, setIsBuildingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Fetch student saved resumes on mount
  useEffect(() => {
    if (!isStaff && regNum) {
      fetchStudentResumes();
    } else {
      setLoadingResumes(false);
    }
  }, [regNum, isStaff]);

  const fetchStudentResumes = async () => {
    try {
      setLoadingResumes(true);
      const resp = await fetch(`/api/resumes/${regNum}`);
      if (resp.ok) {
        const data = await resp.json();
        const list: ResumeData[] = data.resumes || [];
        setResumes(list);
        if (list.length > 0) {
          setCurrentResume(list[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching student resumes:", err);
    } finally {
      setLoadingResumes(false);
    }
  };

  // Import from SC SkillTrack Profile
  const handleImportProfile = async () => {
    try {
      setIsImporting(true);
      const resp = await fetch(`/api/resume/profile-import/${regNum}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.profileData) {
          const imported: ResumeData = {
            ...currentResume,
            ...data.profileData,
            contact: {
              ...currentResume.contact,
              ...data.profileData.contact
            },
            education: {
              ...currentResume.education,
              ...data.profileData.education
            },
            skills: {
              ...currentResume.skills,
              ...data.profileData.skills
            },
            updatedAt: new Date().toISOString()
          };

          // Trigger live ATS analysis on imported data
          const atsResp = await fetch('/api/resume/analyze-job', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeData: imported, jobDescription: imported.jobDescription })
          });
          if (atsResp.ok) {
            const atsData = await atsResp.json();
            imported.atsAnalysis = atsData.atsAnalysis;
          }

          setCurrentResume(imported);
        }
      }
    } catch (err) {
      console.error("Profile import failed:", err);
    } finally {
      setIsImporting(false);
    }
  };

  // AI Resume Build
  const handleAiBuild = async () => {
    try {
      setIsBuildingAi(true);
      const resp = await fetch('/api/resume/ai-build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: currentResume,
          jobDescription: currentResume.jobDescription
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.resume) {
          setCurrentResume(data.resume);
        }
      }
    } catch (err) {
      console.error("AI Build failed:", err);
    } finally {
      setIsBuildingAi(false);
    }
  };

  // Save Resume
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const resp = await fetch('/api/resumes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentResume,
          studentRegisterNumber: regNum
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.resume) {
          setCurrentResume(data.resume);
          await fetchStudentResumes();
          alert("Resume saved successfully!");
        }
      }
    } catch (err) {
      console.error("Save resume failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Resume Version
  const handleDeleteResume = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume version?")) return;
    try {
      const resp = await fetch(`/api/resumes/${id}?registerNumber=${regNum}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        await fetchStudentResumes();
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Create New Version
  const handleCreateNewVersion = (title: string) => {
    const newVer = DEFAULT_BLANK_RESUME(regNum, student?.studentName || session.name, student?.email, student?.phoneNumber);
    newVer.title = title;
    setCurrentResume(newVer);
    setSubTab('editor');
  };

  return (
    <div className="space-y-6">
      {/* Container Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border border-slate-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                AI Powered Resume Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                100% ATS Safe & Factual
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight font-display flex items-center gap-2">
              ✨ AI Resume Builder & ATS Analyzer
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Transform your verified SC SkillTrack projects, certifications, and skills into clean, ATS-optimized resumes with live job match scores.
            </p>
          </div>

          {!isStaff && currentResume.atsAnalysis && (
            <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15 flex items-center gap-3 shrink-0">
              <div className="text-center">
                <div className="text-[10px] uppercase font-bold text-slate-300">ATS Score</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-400">
                  {currentResume.atsAnalysis.atsScore}
                  <span className="text-xs text-slate-400">/100</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="flex items-center gap-1.5 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300 shadow-xs overflow-x-auto">
        <button
          onClick={() => setSubTab('editor')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            subTab === 'editor'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Edit3 className="w-4 h-4 text-blue-600" /> My Resume Editor
        </button>

        <button
          onClick={() => setSubTab('preview')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            subTab === 'preview'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Eye className="w-4 h-4 text-emerald-600" /> Live Preview & Download
        </button>

        <button
          onClick={() => setSubTab('jobmatch')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            subTab === 'jobmatch'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Target className="w-4 h-4 text-indigo-600" /> Job Description Mode
        </button>

        <button
          onClick={() => setSubTab('history')}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
            subTab === 'history'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <History className="w-4 h-4 text-amber-600" /> Resume History ({resumes.length})
        </button>

        {isStaff && (
          <button
            onClick={() => setSubTab('staff')}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
              subTab === 'staff'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-purple-600" /> Staff Analytics
          </button>
        )}
      </div>

      {/* VIEW SUB-TAB CONTENT */}

      {/* 1. EDITOR */}
      {subTab === 'editor' && (
        <div className="grid grid-cols-1 lg:[grid-template-columns:minmax(0,1fr)_minmax(0,1fr)] gap-5 min-w-0 w-full max-w-full items-start box-border">
          <div className="min-w-0 w-full max-w-full overflow-hidden">
            <ResumeFormEditor
              resume={currentResume}
              session={session}
              onChange={(updated) => setCurrentResume(updated)}
              onAiBuild={handleAiBuild}
              onSave={handleSave}
              isBuildingAi={isBuildingAi}
              isSaving={isSaving}
              onImportProfile={handleImportProfile}
              isImporting={isImporting}
            />
          </div>

          <div className="min-w-0 w-full max-w-full overflow-hidden lg:sticky lg:top-20">
            <ResumeLivePreview
              resume={currentResume}
              onTemplateChange={(tmpl) => setCurrentResume({ ...currentResume, template: tmpl })}
            />
          </div>
        </div>
      )}

      {/* 2. PREVIEW & DOWNLOAD */}
      {subTab === 'preview' && (
        <ResumeLivePreview
          resume={currentResume}
          onTemplateChange={(tmpl) => setCurrentResume({ ...currentResume, template: tmpl })}
        />
      )}

      {/* 3. JOB DESCRIPTION MODE & MATCH ANALYZER */}
      {subTab === 'jobmatch' && (
        <JobMatchAnalyzerView
          resume={currentResume}
          onUpdateAnalysis={(analysis, jdText) => {
            setCurrentResume({
              ...currentResume,
              jobDescription: jdText,
              atsAnalysis: analysis
            });
          }}
        />
      )}

      {/* 4. RESUME HISTORY & VERSIONS */}
      {subTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                My Saved Resume Versions ({resumes.length})
              </h3>
              <p className="text-xs text-slate-500">
                Maintain specialized resume versions for General Applications, Software Engineering, AI/ML, Data Analyst, or Internship roles.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCompareModal(true)}
                disabled={resumes.length < 2}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                <span>Compare Resumes</span>
              </button>

              <select
                onChange={(e) => {
                  if (e.target.value) handleCreateNewVersion(e.target.value);
                }}
                className="px-3.5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                <option value="">+ Create New Version</option>
                <option value="General Resume">General Resume</option>
                <option value="Software Developer Resume">Software Developer Resume</option>
                <option value="AI/ML Engineer Resume">AI/ML Engineer Resume</option>
                <option value="Data Analyst Resume">Data Analyst Resume</option>
                <option value="Internship Resume">Internship Resume</option>
              </select>
            </div>
          </div>

          {resumes.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-extrabold text-slate-800">No Saved Resume Versions Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Use the "My Resume Editor" tab to build and save your first ATS-optimized resume.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resumes.map((r) => (
                <div 
                  key={r.id} 
                  className={`p-5 rounded-2xl border transition-all ${
                    r.id === currentResume.id
                      ? 'bg-blue-50/50 border-blue-400 shadow-md ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-extrabold text-blue-900 bg-blue-100 px-2 py-0.5 rounded uppercase">
                      {r.template}
                    </span>
                    <button
                      onClick={() => handleDeleteResume(r.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-base mb-1">
                    {r.title || 'General Resume'}
                  </h4>

                  <div className="flex items-baseline gap-2 my-2">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {r.atsAnalysis?.atsScore || 0}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">/ 100 ATS Score</span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-4 line-clamp-2">
                    {r.summary || 'No summary statement yet.'}
                  </p>

                  <button
                    onClick={() => {
                      setCurrentResume(r);
                      setSubTab('editor');
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Edit This Version
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. STAFF ANALYTICS */}
      {subTab === 'staff' && isStaff && (
        <StaffResumeAnalyticsView />
      )}

      {/* Compare Resumes Modal */}
      {showCompareModal && (
        <ResumeComparisonModal
          resumes={resumes}
          onClose={() => setShowCompareModal(false)}
          onSelectResume={(r) => {
            setCurrentResume(r);
            setSubTab('editor');
          }}
        />
      )}
    </div>
  );
}
