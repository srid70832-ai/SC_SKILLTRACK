export interface PlatformLinks {
  leetcode?: string;
  codechef?: string;
  codeforces?: string;
  atcoder?: string;
  codolio?: string;
  github?: string;
  hackerrank?: string;
  geeksforgeeks?: string;
}

export interface Student {
  rollNumber: string;
  registerNumber: string;
  studentName: string;
  department: string;
  year: string;
  section: string;
  phoneNumber: string;
  email: string;
  studentStatus: 'Active' | 'Inactive';
  mentorName?: string;
  profileCompleted?: boolean;
  profileLinks?: PlatformLinks;
}

export interface Poll {
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

export interface PollResponse {
  id: string;
  pollId: string;
  studentRollNumber: string;
  selectedOptions: string[]; // options text or indices
  respondedAt: string;
}

export interface UserSession {
  username: string;
  name?: string;
  role: 'Staff' | 'Student';
  firebaseUid?: string;
  passwordChanged?: boolean;
  profileCompleted?: boolean;
  profileLinks?: PlatformLinks;
  studentRollNumber?: string;
  studentDetails?: Student;
}

export interface DashboardStats {
  totalStudents: number;
  activePolls: number;
  respondedCount: number;
  pendingCount: number;
  participationRate: number;
}

// ==========================================
// SC HACKATHON HUB TYPINGS
// ==========================================

export type HackathonCategory = 
  | 'AI/ML' 
  | 'Web3/Blockchain' 
  | 'Cyber Security' 
  | 'Cloud & DevOps' 
  | 'Mobile Apps' 
  | 'IoT & Hardware' 
  | 'Open Innovation' 
  | 'FinTech';

export type HackathonMode = 'Online' | 'Offline' | 'Hybrid';
export type HackathonStatus = 'Upcoming' | 'Live' | 'Closed';
export type HackathonScope = 'National' | 'International' | 'State' | 'Inter-College';

export type RoundStatus = 
  | 'Not Registered'
  | 'Registered'
  | 'Verified'
  | 'Round 1 Qualified'
  | 'Round 2 Qualified'
  | 'Round 3 Qualified'
  | 'Semi Finalist'
  | 'Finalist'
  | 'Winner'
  | 'Rejected'
  | 'Withdrawn';

export interface Hackathon {
  id: string;
  title: string;
  organizer: string;
  logoUrl: string;
  bannerUrl: string;
  theme: string;
  description: string;
  category: HackathonCategory;
  prizePool: string;
  minTeamSize: number;
  maxTeamSize: number;
  registrationOpens: string;
  registrationDeadline: string;
  eventDate: string;
  venue: string;
  mode: HackathonMode;
  scope: HackathonScope;
  eligibility: string;
  officialWebsiteUrl: string;
  status: HackathonStatus;
  rounds: string[];
  createdAt: string;
  isAutoFetched?: boolean;
  source?: string;
}

export interface HackathonRegistration {
  id: string;
  hackathonId: string;
  hackathonTitle: string;
  studentRollNumber: string;
  registerNumber: string;
  studentName: string;
  department: string;
  year: string;
  section: string;
  email: string;
  phoneNumber: string;
  externalRegId: string;
  externalRegEmail: string;
  teamName: string;
  teamLeader: string;
  teamMembers: string[];
  proofUrl: string;
  additionalNotes?: string;
  status: 'Pending Verification' | 'Verified' | 'Rejected' | 'Resubmission Requested';
  currentRound: RoundStatus;
  remarks?: string;
  submittedAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface TeamMember {
  rollNumber: string;
  name: string;
  department: string;
  role: string;
  status: 'Accepted' | 'Pending';
}

export interface HackathonTeam {
  id: string;
  hackathonId: string;
  hackathonTitle: string;
  teamName: string;
  leaderRollNumber: string;
  leaderName: string;
  leaderDepartment: string;
  maxMembers: number;
  lookingForSkills: string[];
  description: string;
  members: TeamMember[];
  status: 'Open' | 'Full' | 'Closed';
  createdAt: string;
}

export interface HackathonCertificate {
  id: string;
  hackathonId: string;
  hackathonTitle: string;
  studentRollNumber: string;
  studentName: string;
  department: string;
  type: 'Participation' | 'Winner' | 'Finalist' | 'Mentor' | 'Organizer';
  certificateUrl: string;
  verificationStatus: 'Pending' | 'Approved' | 'Rejected';
  staffRemarks?: string;
  uploadedAt: string;
}

export interface StudentProfileExtra {
  registerNumber: string;
  department: string;
  year: string;
  section: string;
  phoneNumber: string;
  email: string;
  savedAt: string;
}

// ==========================================
// SC CODE ANALYTICS TYPINGS
// ==========================================

export type CodingPlatform = 
  | 'LeetCode'
  | 'CodeChef'
  | 'Codeforces'
  | 'AtCoder'
  | 'Codolio'
  | 'HackerRank'
  | 'GitHub'
  | 'GeeksforGeeks';

export interface PlatformLinks {
  leetcode?: string;
  codechef?: string;
  codeforces?: string;
  atcoder?: string;
  codolio?: string;
  hackerrank?: string;
  github?: string;
  geeksforgeeks?: string;
}

export interface CodingSubmission {
  id: string;
  problemTitle: string;
  platform: CodingPlatform;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded';
  submittedAt: string;
  language: string;
  xpEarned: number;
}

export interface PlatformStat {
  username: string;
  solvedCount: number;
  rating?: number;
  maxRating?: number;
  rank?: string;
}

export interface CodeAnalyticsStudentMetrics {
  registerNumber: string;
  studentName: string;
  department: string;
  section: string;
  year: string;
  mentorName: string;
  avatarUrl?: string;
  profileLinks: PlatformLinks;
  problemsSolvedToday: number;
  problemsSolvedYesterday: number;
  weeklyCount: number;
  monthlyCount: number;
  totalSolved: number;
  contestParticipation: number;
  contestRank: number;
  contestRating: number;
  currentRating: number;
  maxRating: number;
  xp: number;
  streakDays: number;
  lastActiveAt: string;
  isActiveToday: boolean;
  lastSyncTime?: string;
  syncStatus?: 'Active' | 'Pending' | 'Syncing' | 'Failed' | 'Unable to Fetch' | 'Unlinked' | string;
  syncError?: string;
  platformLastSyncTime?: Record<string, string>;
  platformSyncStatus?: Record<string, string>;
  platformVerification?: {
    LeetCode?: boolean;
    CodeChef?: boolean;
    Codeforces?: boolean;
  };
  hasVerifiedData?: boolean;
  aiAnalysis?: {
    performanceSummary: string;
    strengths: string[];
    improvements: string[];
    predictedTrend: string;
    recommendedTopics: string[];
    lastGeneratedAt: string;
  };
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  languagesUsed: Record<string, number>;
  platformBreakdown: Record<CodingPlatform, number>;
  badges: string[];
  recentSubmissions: CodingSubmission[];
  heatmap: Record<string, number>; // "YYYY-MM-DD": count
  contestHistory: Array<{
    contestName: string;
    platform: CodingPlatform;
    date: string;
    rank: number;
    ratingChange: number;
    newRating: number;
  }>;
}

export interface LiveActivityFeedItem {
  id: string;
  registerNumber: string;
  studentName: string;
  avatarUrl?: string;
  department: string;
  section: string;
  action: 'solved' | 'joined_contest' | 'earned_badge' | 'rating_up';
  problemTitle?: string;
  platform: CodingPlatform;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  timestamp: string;
  formattedTime: string;
  xpEarned: number;
  contestName?: string;
  badgeName?: string;
}

export interface ContestSubmission {
  problemName: string;
  verdict: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' | 'Compilation Error' | string;
  submissionTime: string;
  language: string;
}

export interface ContestParticipant {
  registerNumber: string;
  studentName: string;
  department: string;
  year?: string;
  section?: string;
  mentorName?: string;
  contestRank?: number;
  currentRank?: number;
  problemsAttempted?: number;
  problemsSolved: number;
  penalty?: string;
  score?: number;
  currentRating?: number;
  submissions?: ContestSubmission[];
  profileUrl?: string;
  contestUrl?: string;
}

export interface CodingContest {
  id: string;
  title: string;
  platform: CodingPlatform;
  contestDate?: string;
  startTime: string;
  endTime: string;
  status: 'Live' | 'Upcoming' | 'Completed' | 'Ended';
  url: string;
  registeredCount: number;
  participants: ContestParticipant[];
  liveSubmissions?: Array<{
    id: string;
    studentName: string;
    registerNumber: string;
    problemName: string;
    verdict: string;
    time: string;
    language: string;
  }>;
}

export interface CodingNotification {
  id: string;
  type: 'first_solve' | 'milestone_10' | 'contest_start' | 'contest_end' | 'badge_earned' | 'rating_up' | 'inactive_7_days';
  title: string;
  message: string;
  registerNumber?: string;
  studentName?: string;
  createdAt: string;
  isRead?: boolean;
}

export interface MentorWhatsAppSummary {
  mentorName: string;
  totalStudents: number;
  activeCount: number;
  inactiveCount: number;
  todayProblemsSolved: number;
  platformBreakdown: Record<string, number>;
  topPerformer: {
    studentName: string;
    registerNumber: string;
    problemsToday: number;
  } | null;
  formattedText: string;
  generatedAt: string;
}

export interface AIAnalyticsReport {
  summary: string;
  improvingStudents: Array<{ name: string; reason: string }>;
  strugglingStudents: Array<{ name: string; reason: string }>;
  weakTopics: string[];
  recommendedPractice: string[];
  contestSuggestions: string[];
  personalizedRoadmap: string[];
  generatedAt: string;
}

export type OpportunityCategory = 
  | 'Hackathons'
  | 'AI Competitions'
  | 'Coding Challenges'
  | 'Smart India Hackathon'
  | 'Capture The Flag (CTF)'
  | 'Ideathons'
  | 'Internships';

export type OpportunityDomain = 
  | 'AI'
  | 'ML'
  | 'Data Science'
  | 'Cyber Security'
  | 'IoT'
  | 'Web'
  | 'Mobile'
  | 'Cloud'
  | 'Robotics'
  | 'Blockchain'
  | 'Open Source';

export interface Opportunity {
  id: string;
  type: 'Hackathon' | 'Competition' | 'Internship';
  title: string;
  companyOrOrganizer: string;
  logoUrl: string;
  bannerUrl?: string;
  category: OpportunityCategory | string;
  domain: string; // e.g. "AI, ML, Cloud"
  domainsList?: OpportunityDomain[] | string[];
  mode: 'Online' | 'Offline' | 'Hybrid';
  teamSize: string;
  eligibility: string;
  registrationOpens: string;
  registrationDeadline: string;
  eventDate: string;
  prizePool: string;
  location: string;
  shortDescription: string;
  skillsRequired: string[];
  difficultyLevel: 'Beginner Friendly' | 'Intermediate' | 'Advanced';
  officialUrl: string;
  isExpired?: boolean;
  postedAt?: string;
  isNew?: boolean;
  source: 'HireToday';
}

export interface InternalRegistration {
  id: string;
  studentName: string;
  registerNumber: string;
  studentRollNumber?: string;
  department: string;
  year: string;
  section: string;
  mentorName: string;
  opportunityId?: string;
  opportunityName: string;
  category: 'Hackathon' | 'Internship' | 'Competition' | 'Ideathon' | 'AI Competitions' | 'Coding Challenges' | 'Smart India Hackathon' | 'CTF' | string;
  organizer: string;
  officialRegistrationId: string;
  officialRegistrationEmail: string;
  teamName?: string;
  teamMembers?: string[];
  uploadedProofUrl?: string;
  uploadedProofName?: string;
  submissionDate: string;
  rawTimestamp?: number;
  registrationStatus: 'Submitted' | 'Verified' | 'Under Review' | string;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected' | 'Approved' | string;
  remarks?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface StaffNotification {
  id: string;
  title: string;
  message: string;
  category?: string;
  studentName?: string;
  registerNumber?: string;
  opportunityName?: string;
  registrationId?: string;
  createdAt: string;
  read: boolean;
}

// ==========================================
// SIDH COURSE TRACKING & VERIFICATION ENGINE
// ==========================================

export type SIDHCourseStatus = 
  | 'REGISTERED' 
  | 'ENROLLED' 
  | 'IN PROGRESS' 
  | 'COMPLETED' 
  | 'CERTIFICATE AVAILABLE' 
  | 'CERTIFICATE NOT AVAILABLE' 
  | 'CANCELLED' 
  | 'NOT FOUND' 
  | 'NOT VERIFIED';

export type SIDHCertificateStatus = 'AVAILABLE' | 'NOT AVAILABLE' | 'PENDING' | 'ISSUED';

export type SIDHVerificationStatus = 
  | 'BROWSER DATA DETECTED'
  | 'USER CONFIRMED'
  | 'OFFICIAL PROOF VERIFIED'
  | 'VERIFIED'
  | 'MANUAL REVIEW REQUIRED'
  | 'ACCESS BLOCKED'
  | 'FAILED'
  | 'NOT VERIFIED'
  | 'URL SUBMITTED'
  | 'PROOF UPLOADED'
  | 'DATA EXTRACTED'
  | 'VERIFICATION FAILED'
  | 'PARTIALLY VERIFIED'
  | 'MANUAL VERIFICATION REQUIRED'
  | 'SOURCE ERROR';

export type SIDHCourseSource = 
  | 'Official SIDH Export' 
  | 'Official SIDH Proof' 
  | 'Student SIDH Proof' 
  | 'Public SIDH Profile' 
  | 'Manual Entry' 
  | 'Authorised SIDH Integration' 
  | string;

export interface SIDHCourseRecord {
  id: string;
  firebaseUid?: string;
  studentId: string;
  studentName: string;
  registerNumber: string;
  rollNumber?: string;
  department?: string;
  sidhId: string;
  section: string;
  year: string;
  mentorName: string;
  courseName: string;
  courseId: string;
  provider: string;
  registrationDate: string;
  enrollmentDate: string;
  completionDate: string | null;
  status: SIDHCourseStatus;
  progress?: number | string;
  completionStatus?: string;
  certificateStatus: SIDHCertificateStatus;
  certificateId?: string;
  certificateUrl?: string;
  source: SIDHCourseSource;
  sourceRecordId: string;
  sourceReference?: string;
  sourceUrlFile?: string;
  evidence?: any;
  verificationStatus: SIDHVerificationStatus;
  verificationMethod?: string;
  lastVerifiedAt: string;
  createdAt?: string;
  updatedAt?: string;
  isDuplicate?: boolean;
  notes?: string;
  category?: string;
  timeline?: Array<{
    date: string;
    action: string;
    details: string;
    verifiedBy: string;
  }>;
}

export interface SIDHImportHistory {
  id: string;
  fileName: string;
  importedDate: string;
  importedBy: string;
  recordsRead: number;
  verified: number;
  rejected: number;
  duplicates: number;
  errors: number;
  errorDetails?: string[];
}

export interface SIDHProofSubmission {
  id: string;
  studentName: string;
  registerNumber: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  uploadedAt: string;
  extractionStatus: 'PENDING' | 'SUCCESS' | 'PARTIAL' | 'FAILED';
  extractedData?: {
    studentName?: string;
    registerNumber?: string;
    sidhId?: string;
    courseName?: string;
    provider?: string;
    status?: string;
    registrationDate?: string;
    completionDate?: string;
    certificateStatus?: string;
  };
  verificationStatus: SIDHVerificationStatus;
  remarks?: string;
}

export interface SIDHVerificationIssue {
  id: string;
  studentName?: string;
  registerNumber?: string;
  source: string;
  problem: string;
  status: SIDHVerificationStatus;
  requiredAction: string;
  timestamp: string;
}

export interface SIDHConnectionConfig {
  apiUrl: string;
  apiKeyConfigured: boolean;
  clientIdConfigured: boolean;
  status: 'Configured' | 'Not Configured' | 'Authentication Failed' | 'Connected';
  autoSyncSchedule: 'Daily' | 'Weekly' | 'Manual';
  autoSyncEnabled: boolean;
  lastSyncTime: string | null;
  lastSyncStatus: 'Success' | 'Failed' | 'Not Configured';
  connectionMessage?: string;
}

export interface SIDHSyncAuditLog {
  syncId: string;
  startedAt: string;
  completedAt: string;
  triggeredBy: string;
  studentsChecked: number;
  studentsVerified: number;
  studentsNotVerified: number;
  coursesFound: number;
  newCourses: number;
  completedCourses: number;
  duplicatesIgnored: number;
  verificationFailures: number;
  apiErrors: string[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'NOT CONFIGURED';
}

export interface SIDHVerificationErrorLog {
  id: string;
  rawRecord: any;
  reason: string;
  timestamp: string;
  resolved: boolean;
  resolutionNotes?: string;
}

// ==========================================
// VERIFIED SIDH EVIDENCE TRACKING SYSTEM TYPES
// ==========================================

export interface StudentMasterRecord {
  studentName: string;
  registerNumber: string;
  rollNumber?: string;
  department: string;
  year: string;
  section: string;
  email?: string;
  sidhStudentId?: string;
  mentorName?: string;
}

export type SIDHEvidenceSource = 
  | 'OFFICIAL_SIDH_EXPORT'
  | 'OFFICIAL_SIDH_PROOF'
  | 'BROWSER_SOURCED'
  | 'STAFF_VERIFIED'
  | 'UNVERIFIED';

export type SIDHEvidenceVerificationStatus = 
  | 'VERIFIED'
  | 'PENDING_REVIEW'
  | 'INVALID'
  | 'UNVERIFIED';

export type SIDHStudentStatus = 
  | 'VERIFIED ACTIVE'
  | 'RECENTLY SYNCED'
  | 'ACTION REQUIRED'
  | 'NOT VERIFIED'
  | 'NO ACTIVITY';

export interface SIDHEvidenceRecord {
  evidence_id: string;
  student_id: string;
  studentName: string;
  registerNumber: string;
  department?: string;
  source: SIDHEvidenceSource;
  verification_status: SIDHEvidenceVerificationStatus;
  confidence: number;
  file_hash?: string;
  original_filename?: string;
  file_url?: string;
  metadata?: Record<string, any>;
  courses_count: number;
  completed_count: number;
  certificates_count: number;
  review_notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SIDHActivityTimelineEvent {
  id: string;
  student_id: string;
  registerNumber: string;
  timestamp: string;
  source: SIDHEvidenceSource | string;
  status: 'GREEN' | 'BLUE' | 'YELLOW' | 'RED' | 'GRAY';
  title: string;
  description: string;
  details?: string;
  evidence_id?: string;
  created_at: string;
}

export interface SIDHVerificationRequest {
  id: string;
  student_id: string;
  registerNumber: string;
  studentName: string;
  department: string;
  year?: string;
  section?: string;
  requestedBy: string;
  requestedAt: string;
  status: 'REQUEST_SENT' | 'REQUEST_PENDING' | 'EVIDENCE_RECEIVED' | 'VERIFIED';
  message: string;
  evidence_id?: string;
  completedAt?: string;
  created_at: string;
  updated_at: string;
}

export interface SIDHStaffReview {
  id: string;
  evidence_id: string;
  student_id: string;
  registerNumber: string;
  reviewerName: string;
  reviewerEmail?: string;
  decision: 'VERIFIED' | 'REJECTED' | 'REQUEST_INFO';
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SIDHEvidenceSettings {
  freshnessDaysThreshold: number; // e.g., 14 days default
  recentlySyncedDaysThreshold: number; // e.g., 7 days
  strictMasterMatching: boolean;
}

export interface SIDHAnalyticsData {
  totalStudents: number;
  totalMasterStudents?: number;
  verifiedActiveCount: number;
  recentlySyncedCount: number;
  actionRequiredCount: number;
  noEvidenceCount: number;
  noActivityCount?: number;
  mismatchCount: number;
  totalCoursesLogged: number;
  totalCompletedCourses: number;
  totalCertificates: number;
  freshnessThresholdDays: number;
  departmentBreakdown: { department: string; total: number; verified: number }[];
}

export interface SIDHStudentComputedSummary {
  student_id?: string;
  studentName: string;
  registerNumber: string;
  rollNumber?: string;
  department: string;
  year: string;
  section: string;
  email?: string;
  sidhStudentId?: string;
  mentorName?: string;
  status: SIDHStudentStatus;
  statusColor: 'GREEN' | 'BLUE' | 'YELLOW' | 'RED' | 'GRAY';
  evidenceSource: SIDHEvidenceSource;
  coursesCount: number;
  completedCount: number;
  certificatesCount: number;
  lastVerifiedAt: string | null;
  evidenceAgeDays: number | null;
  latestEvidenceId?: string;
  latestEvidenceTitle?: string;
  pendingRequestsCount: number;
  mismatchWarning?: string | null;
}

// ==========================================
// SIDH PUBLIC DIGITAL CV SYNC TYPES
// ==========================================

export type SIDHFieldSourceStatus = 'VERIFIED' | 'NOT AVAILABLE' | 'UNVERIFIED';

export interface SIDHVerifiedField<T = string> {
  value: T;
  status: SIDHFieldSourceStatus;
  label?: string;
}

export interface SIDHPublicStudentData {
  studentName: SIDHVerifiedField<string>;
  sidhProfileId: SIDHVerifiedField<string>;
  registrationId: SIDHVerifiedField<string>;
  profileUrl: string;
  institution?: SIDHVerifiedField<string>;
  skills?: string[];
  qualifications?: string[];
  achievements?: string[];
}

export interface SIDHPublicCourseRecord {
  id: string;
  studentName: string;
  registrationId: string;
  sidhProfileId?: string;
  courseName: string;
  courseId: string;
  provider: string;
  enrollmentStatus: string;
  status: 'Registered' | 'In Progress' | 'Completed' | 'Certificate Available' | 'Not Available';
  progress: string;
  completionStatus: string;
  completionDate: string;
  certificateStatus: string;
  certificateId: string;
  certificateUrl: string;
  sourceUrl: string;
  sourceType: 'SIDH_PUBLIC_DIGITAL_CV';
  verificationStatus: 'VERIFIED' | 'NOT AVAILABLE' | 'UNVERIFIED';
  verifiedAt: string;
  extractionMethod: 'PUBLIC_HTTP_FETCH' | 'USER_CONTROLLED_PUBLIC_SYNC';
}

export interface SIDHPublicCertificateRecord {
  id: string;
  studentName: string;
  courseName: string;
  certificateId: string;
  issueDate: string;
  certificateUrl: string;
  verificationStatus: 'VERIFIED' | 'NOT AVAILABLE' | 'UNVERIFIED';
  sourceUrl: string;
  verifiedAt: string;
}

export interface SIDHChangeNotification {
  type: 'NEW_COURSE' | 'STATUS_CHANGED' | 'NEW_CERTIFICATE';
  title: string;
  courseName: string;
  previousValue?: string;
  currentValue?: string;
  details: string;
  timestamp: string;
}

export interface SIDHPublicSyncHistoryRecord {
  id: string;
  publicUrl: string;
  studentName: string;
  registrationId?: string;
  syncedAt: string;
  coursesDetected: number;
  completedCourses: number;
  certificatesDetected: number;
  verificationResult: 'VERIFIED' | 'PRIVATE_OR_AUTH_REQUIRED' | 'INVALID_URL' | 'UNAVAILABLE' | 'NO_COURSES' | 'PARTIAL';
  statusBadge: 'VERIFIED PUBLIC SIDH DATA' | 'PRIVATE / UNVERIFIED' | 'INVALID / ERROR';
  errorMessage?: string;
  changesDetected?: SIDHChangeNotification[];
}

export interface SIDHPublicSyncMetrics {
  totalProfilesVerified: number;
  totalCoursesFound: number;
  registeredCourses: number;
  inProgressCourses: number;
  completedCourses: number;
  certificatesAvailable: number;
  verificationErrors: number;
}

// ====================================================
// SC SKILLTRACK CERTIFICATE VERIFICATION (GEMINI + FIREBASE)
// ====================================================

export interface ExtractedEvidenceField<T = string> {
  value: T;
  evidence: string;
  confidence: number;
}

export interface ExtractedCertificateData {
  certificateTitle: ExtractedEvidenceField<string>;
  studentName: ExtractedEvidenceField<string>;
  courseName: ExtractedEvidenceField<string>;
  courseCategory: ExtractedEvidenceField<string>;
  issuingOrganization: ExtractedEvidenceField<string>;
  platform: ExtractedEvidenceField<string>;
  certificateId: ExtractedEvidenceField<string>;
  credentialId: ExtractedEvidenceField<string>;
  registrationId: ExtractedEvidenceField<string>;
  completionDate: ExtractedEvidenceField<string>;
  issueDate: ExtractedEvidenceField<string>;
  expiryDate: ExtractedEvidenceField<string>;
  duration: ExtractedEvidenceField<string>;
  score: ExtractedEvidenceField<string>;
  grade: ExtractedEvidenceField<string>;
  percentage: ExtractedEvidenceField<string>;
  skills: ExtractedEvidenceField<string[]>;
  certificateType: ExtractedEvidenceField<string>;
  verificationUrl: ExtractedEvidenceField<string>;
  issuerWebsite: ExtractedEvidenceField<string>;
  rawVisibleText?: string;
}

export type CertificateAnalysisStatus = 
  | 'UPLOADED' 
  | 'ANALYZING' 
  | 'ANALYZED' 
  | 'REVIEW_REQUIRED' 
  | 'VERIFIED' 
  | 'REJECTED' 
  | 'FAILED';

export type StudentMatchStatus = 'MATCHED' | 'MISMATCH' | 'NOT_AVAILABLE';
export type CourseMatchStatus = 'MATCHED' | 'MISMATCH' | 'NOT_AVAILABLE' | 'REVIEW_REQUIRED';
export type OfficialVerificationStatus = 'OFFICIAL_VERIFICATION_AVAILABLE' | 'NOT_PERFORMED' | 'OFFICIAL_VERIFICATION_CHECKED';

export interface CertificateVerificationRecord {
  id: string;
  studentId: string;
  studentName: string;
  registerNumber: string;
  fileName: string;
  storagePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  analyzedAt?: string;
  analysisStatus: CertificateAnalysisStatus;
  verificationStatus: string;
  officialVerificationStatus: OfficialVerificationStatus;
  overallConfidence: number;
  extractedData: ExtractedCertificateData;
  validationResults: {
    passedChecks: string[];
    warnings: string[];
    failedChecks: string[];
    isAuthenticVerified: boolean;
  };
  studentMatchStatus: StudentMatchStatus;
  courseMatchStatus: CourseMatchStatus;
  matchedStudent?: {
    studentName: string;
    registerNumber: string;
    rollNumber?: string;
    department?: string;
    year?: string;
    section?: string;
    mentorName?: string;
  } | null;
  reviewedBy?: string;
  reviewNotes?: string;
  source: 'ORIGINAL_CERTIFICATE' | 'STAFF_CORRECTED';
  previewUrl?: string;
}

export interface CertificateAuditLogEntry {
  id: string;
  certificateId: string;
  action: 'UPLOADED' | 'ANALYSIS_STARTED' | 'ANALYSIS_COMPLETED' | 'VERIFICATION_REQUIRED' | 'APPROVED' | 'REJECTED' | 'STAFF_CORRECTED' | 'DELETED';
  actorId: string;
  actorRole: 'Student' | 'Mentor' | 'Coordinator' | 'Admin' | 'Staff';
  timestamp: string;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
}

export * from './types/resume';



