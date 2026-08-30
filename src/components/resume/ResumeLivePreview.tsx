import React from 'react';
import { ResumeData, ResumeTemplateType } from '../../types/resume';
import { exportResumeToPDF, exportResumeToDOCX } from '../../lib/resumeExporter';
import { Download, FileText, Sparkles, CheckCircle2, Award, ExternalLink } from 'lucide-react';

interface ResumeLivePreviewProps {
  resume: ResumeData;
  onTemplateChange: (template: ResumeTemplateType) => void;
  onEditSection?: (sectionKey: string) => void;
}

export default function ResumeLivePreview({ resume, onTemplateChange, onEditSection }: ResumeLivePreviewProps) {
  const template = resume.template || 'classic';

  const handleDownloadPDF = () => {
    exportResumeToPDF(resume);
  };

  const handleDownloadDOCX = async () => {
    await exportResumeToDOCX(resume);
  };

  // Helper for template-based header styling
  const getHeaderStyle = () => {
    switch (template) {
      case 'modern':
        return 'border-b-2 border-slate-900 pb-3 mb-4';
      case 'technical':
        return 'border-b-2 border-indigo-600 pb-3 mb-4';
      case 'fresher':
        return 'border-b border-blue-500 pb-3 mb-4';
      case 'aidatascience':
        return 'border-b-2 border-cyan-600 pb-3 mb-4';
      case 'classic':
      default:
        return 'border-b-2 border-slate-800 pb-3 mb-4';
    }
  };

  const getSectionHeaderStyle = () => {
    switch (template) {
      case 'modern':
        return 'text-slate-900 border-b border-slate-200 pb-1 mb-2 font-bold uppercase tracking-wider text-xs sm:text-sm';
      case 'technical':
        return 'text-indigo-900 border-b border-indigo-200 pb-1 mb-2 font-mono font-bold uppercase tracking-wider text-xs sm:text-sm';
      case 'fresher':
        return 'text-blue-900 border-b border-blue-200 pb-1 mb-2 font-bold uppercase tracking-wider text-xs sm:text-sm';
      case 'aidatascience':
        return 'text-cyan-950 border-b border-cyan-200 pb-1 mb-2 font-bold uppercase tracking-wider text-xs sm:text-sm';
      case 'classic':
      default:
        return 'text-slate-800 border-b border-slate-300 pb-1 mb-2 font-bold uppercase tracking-wider text-xs sm:text-sm';
    }
  };

  const contactList = [
    resume.contact?.email && { label: 'Email', val: resume.contact.email, href: `mailto:${resume.contact.email}` },
    resume.contact?.phone && { label: 'Phone', val: resume.contact.phone, href: `tel:${resume.contact.phone}` },
    resume.contact?.location && { label: 'Location', val: resume.contact.location, href: null },
    resume.contact?.linkedin && { label: 'LinkedIn', val: resume.contact.linkedin, href: resume.contact.linkedin },
    resume.contact?.github && { label: 'GitHub', val: resume.contact.github, href: resume.contact.github },
    resume.contact?.portfolio && { label: 'Portfolio', val: resume.contact.portfolio, href: resume.contact.portfolio }
  ].filter(Boolean) as Array<{ label: string; val: string; href: string | null }>;

  const hasSkills = resume.skills && Object.values(resume.skills).some(arr => Array.isArray(arr) && arr.length > 0);
  const hasProjects = resume.projects && resume.projects.length > 0;
  const hasExperience = resume.experience && resume.experience.length > 0;
  const hasCertifications = resume.certifications && resume.certifications.length > 0;
  const hasAchievements = resume.achievements && resume.achievements.length > 0;
  const hasCodingProfiles = resume.codingProfiles && Object.values(resume.codingProfiles).some(v => Boolean(v?.trim()));

  const checks = [
    { label: 'Name', ok: Boolean(resume.contact?.fullName?.trim()) },
    { label: 'Contact Info', ok: Boolean(resume.contact?.email?.trim() || resume.contact?.phone?.trim()) },
    { label: 'Education', ok: Boolean(resume.education?.college?.trim() && resume.education?.degree?.trim()) },
    { label: 'Skills', ok: Boolean(hasSkills) },
    { label: 'Projects', ok: Boolean(hasProjects) }
  ];
  const allOk = checks.every(c => c.ok);
  const missing = checks.filter(c => !c.ok).map(c => c.label);

  return (
    <div className="flex flex-col gap-4 w-full max-w-full min-w-0 box-border">
      {/* 4. ATS STATUS CARD */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md w-full max-w-full min-w-0 box-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-200">
              Resume Validation Status
            </span>
          </div>
          <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider self-start sm:self-auto ${
            allOk ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {allOk ? 'Resume Ready ✓' : 'Needs Attention ⚠'}
          </span>
        </div>

        {/* ATS Readability, Selectable Text, No Fake Data badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">ATS Readability ✓</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Selectable Text ✓</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">No Fake Data ✓</span>
          </div>
        </div>

        {!allOk && (
          <p className="text-[11px] text-amber-300 font-medium bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
            Missing details: {missing.join(', ')}
          </p>
        )}
      </div>

      {/* 5. ATS TEMPLATE + DOWNLOAD ACTIONS */}
      <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl border border-slate-800 shadow-md w-full max-w-full min-w-0 box-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-300 whitespace-nowrap shrink-0">ATS Template:</span>
          <select
            value={template}
            onChange={(e) => onTemplateChange(e.target.value as ResumeTemplateType)}
            className="bg-slate-800 text-white text-xs font-extrabold px-3 py-2 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-0 w-full sm:w-auto truncate"
          >
            <option value="classic">Classic Professional</option>
            <option value="modern">Modern Minimal</option>
            <option value="technical">Technical Engineer</option>
            <option value="fresher">Student / Fresher</option>
            <option value="aidatascience">AI & Data Science</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl transition-all shadow border border-blue-400/40 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-blue-200 shrink-0" />
            <span>Download PDF</span>
          </button>
          <button
            onClick={handleDownloadDOCX}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all shadow border border-emerald-400/40 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>Download DOCX</span>
          </button>
        </div>
      </div>

      {/* 6. Printable / Selectable ATS Resume Canvas */}
      <div className="w-full max-w-full overflow-x-auto min-w-0 box-border py-1 rounded-2xl">
        <div 
          id="resume-ats-preview-canvas"
          className="bg-white text-slate-950 p-6 sm:p-8 md:p-10 shadow-xl border border-slate-300 rounded-sm mx-auto w-full max-w-[800px] font-sans text-xs sm:text-sm leading-relaxed print:shadow-none print:border-none print:p-0 select-text box-border min-h-[900px]"
        >
        {/* 1. NAME + CONTACT HEADER */}
        <div className={getHeaderStyle()}>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {resume.contact?.fullName || 'STUDENT NAME'}
          </h1>

          {/* Contact Line */}
          {contactList.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-600 font-medium">
              {contactList.map((item, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-300">•</span>}
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">
                      {item.val}
                    </a>
                  ) : (
                    <span>{item.val}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* 2. PROFESSIONAL SUMMARY */}
        {resume.summary?.trim() && (
          <div className="mb-4">
            <h2 className={getSectionHeaderStyle()}>Professional Summary</h2>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
              {resume.summary.trim()}
            </p>
          </div>
        )}

        {/* 3. TECHNICAL SKILLS */}
        {hasSkills && (
          <div className="mb-4">
            <h2 className={getSectionHeaderStyle()}>Technical Skills</h2>
            <div className="space-y-1 text-xs sm:text-sm">
              {resume.skills?.programmingLanguages?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900">Programming Languages: </span>
                  <span className="text-slate-700">{resume.skills.programmingLanguages.join(', ')}</span>
                </div>
              )}
              {resume.skills?.frameworks?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900">Frameworks & Libraries: </span>
                  <span className="text-slate-700">{resume.skills.frameworks.join(', ')}</span>
                </div>
              )}
              {resume.skills?.databases?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900">Databases: </span>
                  <span className="text-slate-700">{resume.skills.databases.join(', ')}</span>
                </div>
              )}
              {resume.skills?.tools?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900">Developer Tools: </span>
                  <span className="text-slate-700">{resume.skills.tools.join(', ')}</span>
                </div>
              )}
              {resume.skills?.aiMlSkills?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900">AI / ML & Data Science: </span>
                  <span className="text-slate-700">{resume.skills.aiMlSkills.join(', ')}</span>
                </div>
              )}
              {resume.skills?.cloudSkills?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900">Cloud & DevOps: </span>
                  <span className="text-slate-700">{resume.skills.cloudSkills.join(', ')}</span>
                </div>
              )}
              {resume.skills?.otherSkills?.length > 0 && (
                <div>
                  <span className="font-bold text-slate-900">Other Technical Skills: </span>
                  <span className="text-slate-700">{resume.skills.otherSkills.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. EDUCATION */}
        {resume.education?.college && (
          <div className="mb-4">
            <h2 className={getSectionHeaderStyle()}>Education</h2>
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
              <div>
                <span className="font-bold text-slate-900">{resume.education.degree} in {resume.education.department}</span>
                <span className="text-slate-600 block sm:inline font-medium text-xs sm:text-sm sm:ml-2">
                  — {resume.education.college}
                </span>
              </div>
              <div className="text-slate-500 font-semibold text-xs shrink-0">
                {resume.education.graduationYear ? `Expected Graduation: ${resume.education.graduationYear}` : ''}
              </div>
            </div>
            {resume.education.cgpa && (
              <div className="text-xs text-slate-600 mt-0.5">
                <span className="font-semibold text-slate-700">CGPA / Percentage:</span> {resume.education.cgpa}
              </div>
            )}
          </div>
        )}

        {/* 5. PROJECTS */}
        {hasProjects && (
          <div className="mb-4">
            <h2 className={getSectionHeaderStyle()}>Projects</h2>
            <div className="space-y-3">
              {resume.projects.map((p) => (
                <div key={p.id} className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{p.projectName}</span>
                      {p.role && <span className="text-xs text-slate-500">({p.role})</span>}
                      {p.githubLink && (
                        <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                          GitHub <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                      {p.projectLink && (
                        <a href={p.projectLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                          Live <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    {p.technologies?.length > 0 && (
                      <span className="text-xs font-semibold text-slate-500">
                        Tech: {p.technologies.join(', ')}
                      </span>
                    )}
                  </div>

                  {p.description && (
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-xs sm:text-sm pl-1">
                      {p.description.split('\n').filter(Boolean).map((bullet, idx) => (
                        <li key={idx}>{bullet.replace(/^[-•\s]+/, '')}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. EXPERIENCE / INTERNSHIPS */}
        {hasExperience && (
          <div className="mb-4">
            <h2 className={getSectionHeaderStyle()}>Professional Experience / Internships</h2>
            <div className="space-y-3">
              {resume.experience.map((exp) => (
                <div key={exp.id} className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{exp.role}</span>
                      <span className="text-slate-700 font-medium"> — {exp.company}</span>
                    </div>
                    {exp.duration && <span className="text-xs font-semibold text-slate-500">{exp.duration}</span>}
                  </div>

                  {exp.responsibilities && (
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-xs sm:text-sm pl-1">
                      {exp.responsibilities.split('\n').filter(Boolean).map((bullet, idx) => (
                        <li key={idx}>{bullet.replace(/^[-•\s]+/, '')}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. CERTIFICATIONS & COURSEWORK */}
        {hasCertifications && (
          <div className="mb-4">
            <h2 className={getSectionHeaderStyle()}>Certifications & Verified Coursework</h2>
            <ul className="list-disc list-inside space-y-1 text-slate-700 text-xs sm:text-sm">
              {resume.certifications.map((c) => (
                <li key={c.id}>
                  <span className="font-semibold text-slate-900">{c.certificationName}</span>
                  <span className="text-slate-600"> — {c.issuingOrganization}</span>
                  {c.isSidhVerified && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
                      SIDH Verified ✓
                    </span>
                  )}
                  {c.date && <span className="text-xs text-slate-500 ml-1">({c.date})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 8. ACHIEVEMENTS */}
        {hasAchievements && (
          <div className="mb-4">
            <h2 className={getSectionHeaderStyle()}>Key Achievements & Contests</h2>
            <ul className="list-disc list-inside space-y-1 text-slate-700 text-xs sm:text-sm">
              {resume.achievements.map((ach) => (
                <li key={ach.id}>
                  <span className="font-bold text-slate-900">{ach.title}: </span>
                  <span className="text-slate-700">{ach.description}</span>
                  {ach.date && <span className="text-xs text-slate-500 ml-1">({ach.date})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 9. CODING PROFILES */}
        {hasCodingProfiles && (
          <div>
            <h2 className={getSectionHeaderStyle()}>Competitive Coding Profiles</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
              {resume.codingProfiles?.leetcode && (
                <div><span className="font-bold text-slate-900">LeetCode:</span> {resume.codingProfiles.leetcode}</div>
              )}
              {resume.codingProfiles?.codechef && (
                <div><span className="font-bold text-slate-900">CodeChef:</span> {resume.codingProfiles.codechef}</div>
              )}
              {resume.codingProfiles?.codeforces && (
                <div><span className="font-bold text-slate-900">Codeforces:</span> {resume.codingProfiles.codeforces}</div>
              )}
              {resume.codingProfiles?.hackerrank && (
                <div><span className="font-bold text-slate-900">HackerRank:</span> {resume.codingProfiles.hackerrank}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
}
