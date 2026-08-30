import React, { useState } from 'react';
import { ResumeData, ResumeProject, ResumeCertification, ResumeInternship, ResumeAchievement } from '../../types/resume';
import { UserSession } from '../../types';
import { 
  User, GraduationCap, Code2, FolderGit2, Briefcase, Award, 
  Sparkles, Download, Plus, Trash2, RefreshCw, CheckCircle2, ShieldCheck, Link, Globe
} from 'lucide-react';

interface ResumeFormEditorProps {
  resume: ResumeData;
  session: UserSession;
  onChange: (updated: ResumeData) => void;
  onAiBuild: () => Promise<void>;
  onSave: () => Promise<void>;
  isBuildingAi: boolean;
  isSaving: boolean;
  onImportProfile: () => Promise<void>;
  isImporting: boolean;
}

export default function ResumeFormEditor({
  resume,
  session,
  onChange,
  onAiBuild,
  onSave,
  isBuildingAi,
  isSaving,
  onImportProfile,
  isImporting
}: ResumeFormEditorProps) {
  const [activeTab, setActiveTab] = useState<'contact' | 'education' | 'skills' | 'projects' | 'experience' | 'certifications' | 'achievements' | 'coding'>('contact');

  // Contact Change
  const handleContactChange = (field: keyof ResumeData['contact'], value: string) => {
    onChange({
      ...resume,
      contact: {
        ...resume.contact,
        [field]: value
      }
    });
  };

  // Education Change
  const handleEducationChange = (field: keyof ResumeData['education'], value: string) => {
    onChange({
      ...resume,
      education: {
        ...resume.education,
        [field]: value
      }
    });
  };

  // Helper for Skills array input
  const handleSkillsChange = (category: keyof ResumeData['skills'], valString: string) => {
    const list = valString.split(',').map(s => s.trim()).filter(Boolean);
    onChange({
      ...resume,
      skills: {
        ...resume.skills,
        [category]: list
      }
    });
  };

  // Project Handlers
  const addProject = () => {
    const newProj: ResumeProject = {
      id: `proj-${Date.now()}`,
      projectName: '',
      description: '',
      technologies: [],
      role: 'Developer',
      projectLink: '',
      githubLink: '',
      achievements: ''
    };
    onChange({
      ...resume,
      projects: [...(resume.projects || []), newProj]
    });
  };

  const updateProject = (id: string, field: keyof ResumeProject, value: any) => {
    const updated = (resume.projects || []).map(p => {
      if (p.id === id) {
        if (field === 'technologies' && typeof value === 'string') {
          return { ...p, technologies: value.split(',').map(s => s.trim()).filter(Boolean) };
        }
        return { ...p, [field]: value };
      }
      return p;
    });
    onChange({ ...resume, projects: updated });
  };

  const deleteProject = (id: string) => {
    onChange({
      ...resume,
      projects: (resume.projects || []).filter(p => p.id !== id)
    });
  };

  // Internship Handlers
  const addExperience = () => {
    const newExp: ResumeInternship = {
      id: `exp-${Date.now()}`,
      company: '',
      role: '',
      duration: '',
      responsibilities: '',
      achievements: ''
    };
    onChange({
      ...resume,
      experience: [...(resume.experience || []), newExp]
    });
  };

  const updateExperience = (id: string, field: keyof ResumeInternship, value: any) => {
    const updated = (resume.experience || []).map(e => {
      if (e.id === id) return { ...e, [field]: value };
      return e;
    });
    onChange({ ...resume, experience: updated });
  };

  const deleteExperience = (id: string) => {
    onChange({
      ...resume,
      experience: (resume.experience || []).filter(e => e.id !== id)
    });
  };

  // Certification Handlers
  const addCertification = () => {
    const newCert: ResumeCertification = {
      id: `cert-${Date.now()}`,
      certificationName: '',
      issuingOrganization: '',
      date: new Date().toISOString().split('T')[0],
      credentialUrl: '',
      isSidhVerified: false
    };
    onChange({
      ...resume,
      certifications: [...(resume.certifications || []), newCert]
    });
  };

  const updateCertification = (id: string, field: keyof ResumeCertification, value: any) => {
    const updated = (resume.certifications || []).map(c => {
      if (c.id === id) return { ...c, [field]: value };
      return c;
    });
    onChange({ ...resume, certifications: updated });
  };

  const deleteCertification = (id: string) => {
    onChange({
      ...resume,
      certifications: (resume.certifications || []).filter(c => c.id !== id)
    });
  };

  // Achievement Handlers
  const addAchievement = () => {
    const newAch: ResumeAchievement = {
      id: `ach-${Date.now()}`,
      title: '',
      description: '',
      category: 'Hackathon',
      date: new Date().toISOString().split('T')[0]
    };
    onChange({
      ...resume,
      achievements: [...(resume.achievements || []), newAch]
    });
  };

  const updateAchievement = (id: string, field: keyof ResumeAchievement, value: any) => {
    const updated = (resume.achievements || []).map(a => {
      if (a.id === id) return { ...a, [field]: value };
      return a;
    });
    onChange({ ...resume, achievements: updated });
  };

  const deleteAchievement = (id: string) => {
    onChange({
      ...resume,
      achievements: (resume.achievements || []).filter(a => a.id !== id)
    });
  };

  // AI Bullet Improvement Trigger
  const handleImproveBullet = async (text: string, onDone: (newText: string) => void) => {
    if (!text.trim()) return;
    try {
      const resp = await fetch('/api/resume/improve-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.improvedText) onDone(data.improvedText);
      }
    } catch (err) {
      console.error("Bullet improvement failed:", err);
    }
  };

  // AI Summary Regenerate
  const handleRegenerateSummary = async () => {
    try {
      const resp = await fetch('/api/resume/regenerate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: resume.contact,
          education: resume.education,
          skills: resume.skills,
          targetJobTitle: resume.targetJobTitle
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.summary) {
          onChange({ ...resume, summary: data.summary });
        }
      }
    } catch (err) {
      console.error("Summary regeneration failed:", err);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-xl overflow-hidden min-w-0 w-full max-w-full box-border">
      {/* 2. TOP ACTION HEADER */}
      <div className="p-4 sm:p-5 bg-slate-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 border-b border-slate-800 min-w-0 w-full max-w-full box-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 min-w-0 w-full md:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-100 whitespace-nowrap">
              My Resume Editor
            </span>
          </div>
          <input
            type="text"
            value={resume.title || 'General Resume'}
            onChange={(e) => onChange({ ...resume, title: e.target.value })}
            className="bg-slate-800 text-slate-100 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500 min-w-0 w-full sm:w-48 truncate"
            placeholder="Resume Version Name"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-start md:justify-end min-w-0">
          <button
            onClick={onImportProfile}
            disabled={isImporting}
            className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-400/40 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />}
            <span>Import From My SkillTrack Profile</span>
          </button>

          <button
            onClick={onAiBuild}
            disabled={isBuildingAi}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            {isBuildingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Build My ATS Resume</span>
          </button>

          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition-all shadow flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Save Resume</span>
          </button>
        </div>
      </div>

      {/* 3. EDITOR SUB-TABS NAVIGATION */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-2.5 bg-slate-950/80 border-b border-slate-800 text-xs font-bold text-slate-300 overflow-x-auto max-w-full min-w-0 [scrollbar-width:thin] box-border">
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
            activeTab === 'contact' ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <User className="w-3.5 h-3.5" /> Personal Details
        </button>

        <button
          onClick={() => setActiveTab('education')}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
            activeTab === 'education' ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" /> Education
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
            activeTab === 'skills' ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" /> Skills
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
            activeTab === 'projects' ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" /> Projects ({resume.projects?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('experience')}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
            activeTab === 'experience' ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" /> Experience ({resume.experience?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('certifications')}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
            activeTab === 'certifications' ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Certifications ({resume.certifications?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
            activeTab === 'achievements' ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Achievements
        </button>

        <button
          onClick={() => setActiveTab('coding')}
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap ${
            activeTab === 'coding' ? 'bg-blue-600 text-white font-extrabold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> Coding Profiles
        </button>
      </div>

      {/* Editor Tab Content */}
      <div className="p-4 sm:p-6 space-y-5 text-slate-200 min-w-0 w-full max-w-full box-border max-h-[80vh] overflow-y-auto [scrollbar-width:thin]">
        {/* TAB 1: PERSONAL DETAILS & SUMMARY */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Personal Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={resume.contact?.fullName || ''}
                  onChange={(e) => handleContactChange('fullName', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-slate-800"
                  placeholder="e.g. Abinaya B V"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={resume.contact?.email || ''}
                  onChange={(e) => handleContactChange('email', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-slate-800"
                  placeholder="student@kpriet.ac.in"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={resume.contact?.phone || ''}
                  onChange={(e) => handleContactChange('phone', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-slate-800"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Location</label>
                <input
                  type="text"
                  value={resume.contact?.location || ''}
                  onChange={(e) => handleContactChange('location', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-slate-800"
                  placeholder="Coimbatore, Tamil Nadu"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">LinkedIn Profile URL</label>
                <input
                  type="text"
                  value={resume.contact?.linkedin || ''}
                  onChange={(e) => handleContactChange('linkedin', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-slate-800"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">GitHub Profile URL</label>
                <input
                  type="text"
                  value={resume.contact?.github || ''}
                  onChange={(e) => handleContactChange('github', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-slate-800"
                  placeholder="https://github.com/username"
                />
              </div>
            </div>

            {/* Summary Editor */}
            <div className="pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-200">Professional Summary</label>
                <button
                  type="button"
                  onClick={handleRegenerateSummary}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Regenerate Summary</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={resume.summary || ''}
                onChange={(e) => onChange({ ...resume, summary: e.target.value })}
                className="w-full text-xs sm:text-sm p-3.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 font-sans"
                placeholder="Brief 2-3 sentence factual overview of your background, degree, and technical focus..."
              />
            </div>
          </div>
        )}

        {/* TAB 2: EDUCATION */}
        {activeTab === 'education' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              Academic Education
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">College / Institution</label>
                <input
                  type="text"
                  value={resume.education?.college || ''}
                  onChange={(e) => handleEducationChange('college', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="KPR Institute of Engineering and Technology"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Degree Program</label>
                <input
                  type="text"
                  value={resume.education?.degree || ''}
                  onChange={(e) => handleEducationChange('degree', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Bachelor of Technology (B.Tech)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Department / Specialization</label>
                <input
                  type="text"
                  value={resume.education?.department || ''}
                  onChange={(e) => handleEducationChange('department', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Artificial Intelligence and Data Science"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Current Year / Semester</label>
                <input
                  type="text"
                  value={resume.education?.year || ''}
                  onChange={(e) => handleEducationChange('year', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="3rd Year"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">CGPA / Percentage</label>
                <input
                  type="text"
                  value={resume.education?.cgpa || ''}
                  onChange={(e) => handleEducationChange('cgpa', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="8.52 CGPA"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Graduation Year</label>
                <input
                  type="text"
                  value={resume.education?.graduationYear || ''}
                  onChange={(e) => handleEducationChange('graduationYear', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="2026"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SKILLS */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              Technical Skills Categorization (Comma-Separated)
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Programming Languages</label>
                <input
                  type="text"
                  value={(resume.skills?.programmingLanguages || []).join(', ')}
                  onChange={(e) => handleSkillsChange('programmingLanguages', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Python, Java, C++, TypeScript, SQL"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Frameworks & Web Libraries</label>
                <input
                  type="text"
                  value={(resume.skills?.frameworks || []).join(', ')}
                  onChange={(e) => handleSkillsChange('frameworks', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="React, Express.js, Node.js, FastAPI, Tailwind CSS"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Databases</label>
                <input
                  type="text"
                  value={(resume.skills?.databases || []).join(', ')}
                  onChange={(e) => handleSkillsChange('databases', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="PostgreSQL, MongoDB, MySQL, Redis, Firestore"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Developer Tools</label>
                <input
                  type="text"
                  value={(resume.skills?.tools || []).join(', ')}
                  onChange={(e) => handleSkillsChange('tools', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Git, GitHub, VS Code, Postman, Docker, Linux"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">AI / ML & Data Science Skills</label>
                <input
                  type="text"
                  value={(resume.skills?.aiMlSkills || []).join(', ')}
                  onChange={(e) => handleSkillsChange('aiMlSkills', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Pandas, NumPy, Scikit-Learn, TensorFlow, PyTorch, Gemini API"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cloud & DevOps Skills</label>
                <input
                  type="text"
                  value={(resume.skills?.cloudSkills || []).join(', ')}
                  onChange={(e) => handleSkillsChange('cloudSkills', e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Google Cloud Platform (GCP), AWS, Vercel"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-blue-400" />
                Technical Projects
              </h3>
              <button
                type="button"
                onClick={addProject}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>

            {(resume.projects || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6 border border-dashed border-slate-800 rounded-2xl">
                No projects listed yet. Click "Add Project" or "Import From My SkillTrack Profile".
              </p>
            ) : (
              (resume.projects || []).map((p, idx) => (
                <div key={p.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3.5 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-blue-400">Project #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => deleteProject(p.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Project Name</label>
                      <input
                        type="text"
                        value={p.projectName}
                        onChange={(e) => updateProject(p.id, 'projectName', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl"
                        placeholder="Project Title"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Technologies Used (Comma-Separated)</label>
                      <input
                        type="text"
                        value={(p.technologies || []).join(', ')}
                        onChange={(e) => updateProject(p.id, 'technologies', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl"
                        placeholder="React, TypeScript, Express, MongoDB"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">GitHub Repo Link</label>
                      <input
                        type="text"
                        value={p.githubLink || ''}
                        onChange={(e) => updateProject(p.id, 'githubLink', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl"
                        placeholder="https://github.com/user/repo"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Live Demo / App Link</label>
                      <input
                        type="text"
                        value={p.projectLink || ''}
                        onChange={(e) => updateProject(p.id, 'projectLink', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl"
                        placeholder="https://myproject.app"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-300">Description & Bullets</label>
                      <button
                        type="button"
                        onClick={() => handleImproveBullet(p.description, (newText) => updateProject(p.id, 'description', newText))}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Improve Bullet</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={p.description || ''}
                      onChange={(e) => updateProject(p.id, 'description', e.target.value)}
                      className="w-full text-xs p-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl font-mono"
                      placeholder="• Engineered automated tracking workflow using React & TypeScript..."
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: EXPERIENCE / INTERNSHIPS */}
        {activeTab === 'experience' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                Internships & Work Experience
              </h3>
              <button
                type="button"
                onClick={addExperience}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </button>
            </div>

            {(resume.experience || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6 border border-dashed border-slate-800 rounded-2xl">
                No internship/work experience listed. (Freshers may leave this section blank).
              </p>
            ) : (
              (resume.experience || []).map((exp, idx) => (
                <div key={exp.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-blue-400">Experience #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => deleteExperience(exp.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Company / Organization</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl"
                        placeholder="Company Name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Role / Title</label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => updateExperience(exp.id, 'role', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl"
                        placeholder="Software Engineer Intern"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Duration</label>
                      <input
                        type="text"
                        value={exp.duration}
                        onChange={(e) => updateExperience(exp.id, 'duration', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl"
                        placeholder="Jun 2025 - Aug 2025"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-300">Responsibilities & Achievements</label>
                      <button
                        type="button"
                        onClick={() => handleImproveBullet(exp.responsibilities, (newText) => updateExperience(exp.id, 'responsibilities', newText))}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Improve Bullet</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={exp.responsibilities || ''}
                      onChange={(e) => updateExperience(exp.id, 'responsibilities', e.target.value)}
                      className="w-full text-xs p-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl font-mono"
                      placeholder="• Collaborated with engineering team on building RESTful API services..."
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 6: CERTIFICATIONS */}
        {activeTab === 'certifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-400" />
                Certifications & Coursework
              </h3>
              <button
                type="button"
                onClick={addCertification}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Certification
              </button>
            </div>

            {(resume.certifications || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6 border border-dashed border-slate-800 rounded-2xl">
                No certifications listed. Import from SC SkillTrack Profile to auto-add verified SIDH courses.
              </p>
            ) : (
              (resume.certifications || []).map((c) => (
                <div key={c.id} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{c.certificationName || 'Certification'}</span>
                      {c.isSidhVerified && (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                          SIDH Verified ✓
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCertification(c.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <input
                        type="text"
                        value={c.certificationName}
                        onChange={(e) => updateCertification(c.id, 'certificationName', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl"
                        placeholder="Certification Name"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={c.issuingOrganization}
                        onChange={(e) => updateCertification(c.id, 'issuingOrganization', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl"
                        placeholder="Issuing Organization"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={c.date}
                        onChange={(e) => updateCertification(c.id, 'date', e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl"
                        placeholder="Completion Date"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 7: ACHIEVEMENTS */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-400" />
                Achievements, Hackathons & Awards
              </h3>
              <button
                type="button"
                onClick={addAchievement}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Achievement
              </button>
            </div>

            {(resume.achievements || []).length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6 border border-dashed border-slate-800 rounded-2xl">
                No achievements added yet.
              </p>
            ) : (
              (resume.achievements || []).map((ach) => (
                <div key={ach.id} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex justify-between items-center gap-2">
                    <input
                      type="text"
                      value={ach.title}
                      onChange={(e) => updateAchievement(ach.id, 'title', e.target.value)}
                      className="text-xs font-bold px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl w-full max-w-sm"
                      placeholder="Title (e.g. Winner - National Hackathon 2026)"
                    />
                    <button
                      type="button"
                      onClick={() => deleteAchievement(ach.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={ach.description}
                    onChange={(e) => updateAchievement(ach.id, 'description', e.target.value)}
                    className="w-full text-xs p-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl"
                    placeholder="Brief description of the achievement, award, or publication..."
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 8: CODING PROFILES */}
        {activeTab === 'coding' && (
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              Verified Coding Profile Handles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">LeetCode Profile / Handle</label>
                <input
                  type="text"
                  value={resume.codingProfiles?.leetcode || ''}
                  onChange={(e) => onChange({ ...resume, codingProfiles: { ...resume.codingProfiles, leetcode: e.target.value } })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl"
                  placeholder="https://leetcode.com/username"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">CodeChef Handle</label>
                <input
                  type="text"
                  value={resume.codingProfiles?.codechef || ''}
                  onChange={(e) => onChange({ ...resume, codingProfiles: { ...resume.codingProfiles, codechef: e.target.value } })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl"
                  placeholder="https://codechef.com/users/username"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Codeforces Handle</label>
                <input
                  type="text"
                  value={resume.codingProfiles?.codeforces || ''}
                  onChange={(e) => onChange({ ...resume, codingProfiles: { ...resume.codingProfiles, codeforces: e.target.value } })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl"
                  placeholder="https://codeforces.com/profile/username"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">HackerRank Profile</label>
                <input
                  type="text"
                  value={resume.codingProfiles?.hackerrank || ''}
                  onChange={(e) => onChange({ ...resume, codingProfiles: { ...resume.codingProfiles, hackerrank: e.target.value } })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-xl"
                  placeholder="https://hackerrank.com/username"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
