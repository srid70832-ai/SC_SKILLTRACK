export interface ResumeContact {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
}

export interface ResumeEducation {
  college: string;
  degree: string;
  department: string;
  year: string;
  cgpa: string;
  graduationYear: string;
}

export interface ResumeSkills {
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  aiMlSkills: string[];
  cloudSkills: string[];
  otherSkills: string[];
}

export interface ResumeProject {
  id: string;
  projectName: string;
  description: string;
  technologies: string[];
  role: string;
  projectLink?: string;
  githubLink?: string;
  achievements?: string;
}

export interface ResumeCertification {
  id: string;
  certificationName: string;
  issuingOrganization: string;
  date: string;
  credentialUrl?: string;
  isSidhVerified?: boolean;
}

export interface ResumeInternship {
  id: string;
  company: string;
  role: string;
  duration: string;
  responsibilities: string;
  achievements?: string;
}

export interface ResumeAchievement {
  id: string;
  title: string;
  description: string;
  category?: 'Hackathon' | 'Contest' | 'Award' | 'Publication' | 'Competition' | 'Academic';
  date?: string;
}

export interface ResumeCodingProfiles {
  leetcode?: string;
  codechef?: string;
  codeforces?: string;
  hackerrank?: string;
  atcoder?: string;
  geeksforgeeks?: string;
  others?: string;
}

export type ResumeTemplateType = 'classic' | 'modern' | 'technical' | 'fresher' | 'aidatascience';

export interface ScoreCategory {
  score: number;
  maxScore: number;
}

export interface ResumeAtsAnalysis {
  atsScore: number;
  scoreBreakdown: {
    keywords: ScoreCategory;
    structure: ScoreCategory;
    skillsMatch: ScoreCategory;
    experienceMatch: ScoreCategory;
    readability: ScoreCategory;
    formatting: ScoreCategory;
  };
  jobMatchBreakdown?: {
    technicalSkills: number;
    keywords: number;
    projects: number;
    education: number;
    experience: number;
    overallMatch: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: Array<{
    type: 'warning' | 'success' | 'info';
    message: string;
    actionable?: string;
  }>;
}

export interface ResumeData {
  id: string;
  studentRegisterNumber: string;
  title: string; // e.g. "General Resume", "Software Developer Resume", "AI/ML Resume", "Data Analyst Resume", "Internship Resume"
  template: ResumeTemplateType;
  contact: ResumeContact;
  summary: string;
  education: ResumeEducation;
  skills: ResumeSkills;
  projects: ResumeProject[];
  experience: ResumeInternship[];
  certifications: ResumeCertification[];
  achievements: ResumeAchievement[];
  codingProfiles: ResumeCodingProfiles;
  targetJobTitle?: string;
  jobDescription?: string;
  atsAnalysis?: ResumeAtsAnalysis;
  sectionOrder?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface StaffResumeAnalytics {
  totalResumesCreated: number;
  averageAtsScore: number;
  studentsWithResumeCount: number;
  studentsWithoutResumeCount: number;
  totalStudents: number;
  averageJobMatchScore: number;
  versionDistribution: Record<string, number>;
}
