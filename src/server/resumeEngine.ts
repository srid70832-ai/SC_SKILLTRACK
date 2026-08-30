import { GoogleGenAI } from '@google/genai';
import { ResumeData, ResumeAtsAnalysis, StaffResumeAnalytics } from '../types/resume';

// Get Gemini Client Helper
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });
}

// Extract keywords from text
export function extractKeywordsFromJD(text: string): {
  requiredSkills: string[];
  preferredSkills: string[];
  allKeywords: string[];
  roleName: string;
} {
  if (!text) return { requiredSkills: [], preferredSkills: [], allKeywords: [], roleName: '' };

  const commonTech = [
    'Python', 'Java', 'C++', 'C', 'JavaScript', 'TypeScript', 'SQL', 'HTML', 'CSS',
    'React', 'Node.js', 'Express', 'Next.js', 'Vue', 'Angular', 'Django', 'Flask', 'FastAPI',
    'Spring Boot', 'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase', 'Redis',
    'Git', 'GitHub', 'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'Machine Learning', 'Deep Learning', 'Data Science', 'Pandas', 'NumPy', 'Scikit-Learn',
    'TensorFlow', 'PyTorch', 'OpenCV', 'NLP', 'Computer Vision',
    'REST API', 'GraphQL', 'Microservices', 'Data Structures', 'Algorithms',
    'OOP', 'System Design', 'Agile', 'CI/CD', 'Linux', 'Tailwind', 'Bootstrap'
  ];

  const upperText = text.toUpperCase();
  const matched = commonTech.filter(tech => {
    const reg = new RegExp(`\\b${tech.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    return reg.test(text);
  });

  // Role detection
  let roleName = 'Software Engineer / Technology Role';
  if (/data analyst|analytics/i.test(text)) roleName = 'Data Analyst';
  else if (/machine learning|ai engineer|data scientist/i.test(text)) roleName = 'AI / ML Engineer';
  else if (/frontend|react|web developer/i.test(text)) roleName = 'Frontend Developer';
  else if (/backend|node|java|python developer/i.test(text)) roleName = 'Backend Developer';
  else if (/full stack|fullstack/i.test(text)) roleName = 'Full Stack Developer';

  return {
    requiredSkills: matched.slice(0, Math.ceil(matched.length * 0.7)),
    preferredSkills: matched.slice(Math.ceil(matched.length * 0.7)),
    allKeywords: matched.length > 0 ? matched : ['Problem Solving', 'Data Structures', 'Communication', 'Teamwork'],
    roleName
  };
}

// Calculate ATS Compatibility Estimate & Breakdown
export function calculateAtsScore(
  resume: ResumeData,
  jobDescription?: string
): ResumeAtsAnalysis {
  let atsScore = 0;
  const suggestions: Array<{ type: 'warning' | 'success' | 'info'; message: string; actionable?: string }> = [];

  // 1. Contact Information Check (Max 15 pts)
  let contactScore = 0;
  if (resume.contact?.fullName?.trim()) contactScore += 3;
  if (resume.contact?.email?.trim()) contactScore += 3;
  if (resume.contact?.phone?.trim()) contactScore += 3;
  if (resume.contact?.location?.trim()) contactScore += 2;
  if (resume.contact?.linkedin?.trim()) contactScore += 2;
  if (resume.contact?.github?.trim()) contactScore += 2;

  if (contactScore < 10) {
    suggestions.push({
      type: 'warning',
      message: 'Incomplete contact details in header.',
      actionable: 'Add LinkedIn and GitHub links to improve recruiter response rate.'
    });
  } else {
    suggestions.push({
      type: 'success',
      message: '✓ Contact information is complete and readable by ATS parsers.'
    });
  }

  // 2. Resume Structure & Formatting (Max 15 pts)
  let structureScore = 0;
  if (resume.summary?.trim()) structureScore += 3;
  if (resume.education?.degree?.trim()) structureScore += 3;
  if (resume.skills && Object.values(resume.skills).some(arr => Array.isArray(arr) && arr.length > 0)) structureScore += 3;
  if (resume.projects && resume.projects.length > 0) structureScore += 3;
  if (resume.certifications && resume.certifications.length > 0) structureScore += 3;

  if (structureScore >= 12) {
    suggestions.push({
      type: 'success',
      message: '✓ Resume structure follows single-column standard ATS hierarchy.'
    });
  }

  // 3. Technical Skills Depth (Max 20 pts)
  const allSkills = [
    ...(resume.skills?.programmingLanguages || []),
    ...(resume.skills?.frameworks || []),
    ...(resume.skills?.databases || []),
    ...(resume.skills?.tools || []),
    ...(resume.skills?.aiMlSkills || []),
    ...(resume.skills?.cloudSkills || []),
    ...(resume.skills?.otherSkills || [])
  ].map(s => s.trim().toLowerCase());

  let skillsScore = Math.min(20, Math.round((allSkills.length / 8) * 20));
  if (allSkills.length < 5) {
    suggestions.push({
      type: 'warning',
      message: 'Skills section has fewer than 5 items.',
      actionable: 'List your core programming languages, frameworks, and databases clearly.'
    });
  }

  // 4. Projects & Experience Impact (Max 20 pts)
  let expScore = 0;
  if (resume.projects && resume.projects.length > 0) {
    expScore += Math.min(12, resume.projects.length * 4);
    const hasBullets = resume.projects.some(p => p.description && p.description.length > 30);
    if (hasBullets) expScore += 4;
  }
  if (resume.experience && resume.experience.length > 0) {
    expScore += Math.min(4, resume.experience.length * 2);
  }

  // 5. Readability & Readability Rules (Max 10 pts)
  const readabilityScore = 10;

  // 6. Job Description Keyword Matching (Max 20 pts)
  let matchedKeywords: string[] = [];
  let missingKeywords: string[] = [];
  let jdScore = 15; // default if no JD
  let jobMatchBreakdown: ResumeAtsAnalysis['jobMatchBreakdown'] = undefined;

  if (jobDescription && jobDescription.trim().length > 20) {
    const jdMeta = extractKeywordsFromJD(jobDescription);
    const resumeFullText = JSON.stringify(resume).toLowerCase();

    jdMeta.allKeywords.forEach(kw => {
      const isPresent = resumeFullText.includes(kw.toLowerCase());
      if (isPresent) matchedKeywords.push(kw);
      else missingKeywords.push(kw);
    });

    const matchRatio = jdMeta.allKeywords.length > 0 ? matchedKeywords.length / jdMeta.allKeywords.length : 0.8;
    jdScore = Math.round(matchRatio * 20);

    const techMatch = Math.min(100, Math.round((matchedKeywords.length / Math.max(1, jdMeta.allKeywords.length)) * 100));
    const kwMatch = Math.min(100, Math.round(matchRatio * 100));
    const projMatch = resume.projects?.length ? Math.min(100, 70 + resume.projects.length * 10) : 50;
    const eduMatch = resume.education?.degree ? 100 : 60;
    const expMatch = resume.experience?.length ? 90 : 65;
    const overallMatch = Math.round((techMatch * 0.3) + (kwMatch * 0.3) + (projMatch * 0.2) + (eduMatch * 0.1) + (expMatch * 0.1));

    jobMatchBreakdown = {
      technicalSkills: techMatch,
      keywords: kwMatch,
      projects: projMatch,
      education: eduMatch,
      experience: expMatch,
      overallMatch
    };

    if (missingKeywords.length > 0) {
      suggestions.push({
        type: 'warning',
        message: `Missing ${missingKeywords.length} target keywords from Job Description (${missingKeywords.slice(0, 4).join(', ')}).`,
        actionable: 'Add these skills to your resume ONLY if you genuinely have experience with them.'
      });
    } else {
      suggestions.push({
        type: 'success',
        message: '✓ Excellent keyword coverage matching target job description requirements.'
      });
    }
  } else {
    suggestions.push({
      type: 'info',
      message: 'Paste a Job Description in "Job Description Mode" to unlock custom keyword optimization & match scores.'
    });
  }

  atsScore = Math.min(100, Math.max(0, contactScore + structureScore + skillsScore + expScore + readabilityScore + (jobDescription ? jdScore : 15)));

  return {
    atsScore,
    scoreBreakdown: {
      keywords: { score: jdScore, maxScore: 20 },
      structure: { score: structureScore, maxScore: 15 },
      skillsMatch: { score: skillsScore, maxScore: 20 },
      experienceMatch: { score: expScore, maxScore: 20 },
      readability: { score: readabilityScore, maxScore: 10 },
      formatting: { score: contactScore, maxScore: 15 }
    },
    jobMatchBreakdown,
    matchedKeywords,
    missingKeywords,
    suggestions
  };
}

// Generate AI Resume Content Enhancement via Gemini
export async function generateAiResumeEnhancement(
  resume: ResumeData,
  jobDescription?: string
): Promise<{
  enhancedSummary: string;
  enhancedProjects: ResumeData['projects'];
  enhancedExperience: ResumeData['experience'];
  atsAnalysis: ResumeAtsAnalysis;
}> {
  const ai = getGeminiClient();
  let enhancedSummary = resume.summary;
  let enhancedProjects = [...(resume.projects || [])];
  let enhancedExperience = [...(resume.experience || [])];

  if (ai) {
    try {
      const prompt = `You are SC SkillTrack AI's Resume Optimization Assistant.
CRITICAL MANDATE:
- DO NOT INVENT fake experience, fake job titles, fake companies, fake projects, fake metrics, or fake skills.
- DO NOT add numbers, percentages, or statistics (e.g. "95% accuracy", "increased sales by 30%") unless the student specifically provided them in the input data!
- Improve wording, grammar, action-verb usage, ATS keyword alignment, and clarity using ONLY the facts provided.

STUDENT DATA:
${JSON.stringify({
  contact: resume.contact,
  education: resume.education,
  skills: resume.skills,
  summary: resume.summary,
  projects: resume.projects,
  experience: resume.experience,
  certifications: resume.certifications,
  achievements: resume.achievements
}, null, 2)}

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}` : ''}

OUTPUT FORMAT: Return a valid JSON object with:
{
  "enhancedSummary": "A concise, impactful 2-3 sentence professional summary based strictly on the student's status (e.g., B.Tech student, aspiring engineer) and provided skills.",
  "enhancedProjects": [
    {
      "id": "matching project id",
      "projectName": "project name",
      "description": "2-3 concise, bullet-style action-verb statements highlighting what was built and tools used without inventing metrics.",
      "technologies": ["tech1", "tech2"],
      "role": "role",
      "projectLink": "link",
      "githubLink": "github",
      "achievements": "actual achievements provided"
    }
  ],
  "enhancedExperience": [
    {
      "id": "matching exp id",
      "company": "company",
      "role": "role",
      "duration": "duration",
      "responsibilities": "improved action-verb responsibilities without fake numbers.",
      "achievements": "achievements if provided"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.enhancedSummary) enhancedSummary = parsed.enhancedSummary;
        if (Array.isArray(parsed.enhancedProjects) && parsed.enhancedProjects.length > 0) {
          enhancedProjects = parsed.enhancedProjects;
        }
        if (Array.isArray(parsed.enhancedExperience) && parsed.enhancedExperience.length > 0) {
          enhancedExperience = parsed.enhancedExperience;
        }
      }
    } catch (err) {
      console.error("[AI RESUME BUILD ERROR]", err);
    }
  }

  // If no summary was provided and AI did not return one, generate a factual default
  if (!enhancedSummary) {
    const deg = resume.education?.degree || 'B.Tech';
    const dept = resume.education?.department || 'Computer Science / AI & DS';
    const langs = (resume.skills?.programmingLanguages || []).slice(0, 3).join(', ') || 'Python, Java, Web Technologies';
    enhancedSummary = `Motivated ${deg} student in ${dept} with a strong foundation in ${langs}. Experienced in developing practical software projects, collaborating on technical challenges, and continuously expanding core engineering competencies.`;
  }

  const updatedResume: ResumeData = {
    ...resume,
    summary: enhancedSummary,
    projects: enhancedProjects,
    experience: enhancedExperience
  };

  const atsAnalysis = calculateAtsScore(updatedResume, jobDescription);

  return {
    enhancedSummary,
    enhancedProjects,
    enhancedExperience,
    atsAnalysis
  };
}
