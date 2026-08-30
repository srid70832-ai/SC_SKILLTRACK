import { 
  StudentMasterRecord, 
  SIDHEvidenceRecord, 
  SIDHCourseRecord, 
  SIDHEvidenceSettings, 
  SIDHStudentComputedSummary, 
  SIDHStudentStatus, 
  SIDHEvidenceSource, 
  SIDHEvidenceVerificationStatus, 
  SIDHActivityTimelineEvent,
  SIDHVerificationRequest
} from '../types';

export const DEFAULT_EVIDENCE_SETTINGS: SIDHEvidenceSettings = {
  freshnessDaysThreshold: 14,
  recentlySyncedDaysThreshold: 7,
  strictMasterMatching: true
};

/**
 * Calculates evidence age in calendar days from ISO timestamp
 */
export function calculateEvidenceAgeDays(lastVerifiedAt: string | null | undefined): number | null {
  if (!lastVerifiedAt) return null;
  const verifiedDate = new Date(lastVerifiedAt);
  if (isNaN(verifiedDate.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - verifiedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Robust Master Student Registry Matcher
 */
export function matchStudentWithMaster(
  input: { studentName?: string; registerNumber?: string; studentId?: string; rollNumber?: string; email?: string },
  masterList: any[]
): {
  matched: any | null;
  isAmbiguous: boolean;
  mismatchReason?: string;
  confidence: number;
} {
  if (!masterList || masterList.length === 0) {
    return { matched: null, isAmbiguous: false, mismatchReason: 'Student Master database is empty.', confidence: 0 };
  }

  const rawReg = (input.registerNumber || input.studentId || input.rollNumber || '').trim().toUpperCase();
  const rawName = (input.studentName || '').trim().toUpperCase();
  const rawEmail = (input.email || '').trim().toLowerCase();

  // 1. Exact Register Number Match (Highest Priority)
  if (rawReg) {
    const regMatch = masterList.find(s => 
      (s.registerNumber && s.registerNumber.toUpperCase() === rawReg) ||
      (s.rollNumber && s.rollNumber.toUpperCase() === rawReg) ||
      (s.sidhStudentId && s.sidhStudentId.toUpperCase() === rawReg)
    );
    if (regMatch) {
      // Cross-check name consistency if name is present
      let confidence = 95;
      if (rawName && regMatch.studentName) {
        const masterNameClean = regMatch.studentName.toUpperCase();
        if (masterNameClean === rawName || masterNameClean.includes(rawName) || rawName.includes(masterNameClean)) {
          confidence = 100;
        } else {
          confidence = 85; // Name variation / initials difference
        }
      }
      return { matched: regMatch, isAmbiguous: false, confidence };
    }
  }

  // 2. Email Match
  if (rawEmail) {
    const emailMatch = masterList.find(s => s.email && s.email.toLowerCase() === rawEmail);
    if (emailMatch) {
      return { matched: emailMatch, isAmbiguous: false, confidence: 90 };
    }
  }

  // 3. Name Match (Checking for ambiguity)
  if (rawName && rawName.length > 2) {
    const nameMatches = masterList.filter(s => {
      if (!s.studentName) return false;
      const sName = s.studentName.toUpperCase();
      return sName === rawName || sName.split(' ')[0] === rawName.split(' ')[0];
    });

    if (nameMatches.length === 1) {
      return { matched: nameMatches[0], isAmbiguous: false, confidence: 75 };
    } else if (nameMatches.length > 1) {
      return {
        matched: null,
        isAmbiguous: true,
        mismatchReason: `Multiple students match name '${rawName}'. Exact Register Number required.`,
        confidence: 40
      };
    }
  }

  return {
    matched: null,
    isAmbiguous: false,
    mismatchReason: 'Student identity mismatch. Staff review required.',
    confidence: 0
  };
}

/**
 * Core Status Engine
 * Computes official student status:
 * 🟢 VERIFIED ACTIVE (Recent verified official evidence <= freshness threshold)
 * 🔵 RECENTLY SYNCED (Verified evidence received <= recently synced threshold)
 * 🟡 ACTION REQUIRED (Verified evidence exists but age > freshness threshold, or update requested)
 * 🔴 NOT VERIFIED (Evidence submitted but unverified or invalid)
 * ⚪ NO ACTIVITY (No verified evidence exists)
 */
export function computeStudentSIDHStatus(
  student: any,
  evidenceList: SIDHEvidenceRecord[],
  courseList: SIDHCourseRecord[],
  settings: SIDHEvidenceSettings = DEFAULT_EVIDENCE_SETTINGS,
  pendingRequests: SIDHVerificationRequest[] = []
): SIDHStudentComputedSummary {
  const regUpper = (student.registerNumber || student.rollNumber || '').toUpperCase();
  const nameClean = (student.studentName || student.name || '').trim();

  // Find all evidence for this student
  const studentEvidence = (evidenceList || []).filter(e => 
    (e.registerNumber && e.registerNumber.toUpperCase() === regUpper) ||
    (e.student_id && e.student_id.toUpperCase() === regUpper)
  );

  // Find verified courses
  const studentCourses = (courseList || []).filter(c => 
    (c.registerNumber && c.registerNumber.toUpperCase() === regUpper) ||
    (c.studentId && c.studentId.toUpperCase() === regUpper)
  );

  const completedCourses = studentCourses.filter(c => c.status === 'COMPLETED');
  const certificates = studentCourses.filter(c => c.certificateStatus === 'AVAILABLE' || c.certificateStatus === 'ISSUED');

  // Filter verified evidence
  const verifiedEvidenceList = studentEvidence
    .filter(e => e.verification_status === 'VERIFIED')
    .sort((a, b) => new Date(b.verified_at || b.created_at).getTime() - new Date(a.verified_at || a.created_at).getTime());

  const latestVerifiedEvidence = verifiedEvidenceList[0] || null;
  const lastVerifiedAt = latestVerifiedEvidence ? (latestVerifiedEvidence.verified_at || latestVerifiedEvidence.created_at) : null;
  const evidenceAgeDays = calculateEvidenceAgeDays(lastVerifiedAt);

  // Check pending requests for this student
  const studentPendingReqs = (pendingRequests || []).filter(r => 
    (r.registerNumber && r.registerNumber.toUpperCase() === regUpper) &&
    (r.status === 'REQUEST_SENT' || r.status === 'REQUEST_PENDING')
  );

  // Default Source & Status
  let status: SIDHStudentStatus = 'NO ACTIVITY';
  let statusColor: 'GREEN' | 'BLUE' | 'YELLOW' | 'RED' | 'GRAY' = 'GRAY';
  let evidenceSource: SIDHEvidenceSource = 'UNVERIFIED';

  if (latestVerifiedEvidence) {
    evidenceSource = latestVerifiedEvidence.source;
  } else if (studentEvidence.length > 0) {
    evidenceSource = studentEvidence[0].source;
  }

  if (verifiedEvidenceList.length > 0 && evidenceAgeDays !== null) {
    if (studentPendingReqs.length > 0) {
      status = 'ACTION REQUIRED';
      statusColor = 'YELLOW';
    } else if (evidenceAgeDays <= settings.recentlySyncedDaysThreshold) {
      status = 'RECENTLY SYNCED';
      statusColor = 'BLUE';
    } else if (evidenceAgeDays <= settings.freshnessDaysThreshold) {
      status = 'VERIFIED ACTIVE';
      statusColor = 'GREEN';
    } else {
      // Evidence is older than freshness threshold
      status = 'ACTION REQUIRED';
      statusColor = 'YELLOW';
    }
  } else if (studentEvidence.some(e => e.verification_status === 'PENDING_REVIEW' || e.verification_status === 'INVALID')) {
    status = 'NOT VERIFIED';
    statusColor = 'RED';
  } else {
    status = 'NO ACTIVITY';
    statusColor = 'GRAY';
  }

  return {
    studentName: nameClean,
    registerNumber: student.registerNumber || student.rollNumber,
    rollNumber: student.rollNumber,
    department: student.department || 'AI & DS',
    year: student.year || 'I Year',
    section: student.section || 'A',
    email: student.email,
    sidhStudentId: student.sidhStudentId || `SIDH-${student.registerNumber || student.rollNumber}`,
    mentorName: student.mentorName || 'Mrs. B. Padmapriya',
    status,
    statusColor,
    evidenceSource,
    coursesCount: studentCourses.length,
    completedCount: completedCourses.length,
    certificatesCount: certificates.length,
    lastVerifiedAt,
    evidenceAgeDays,
    latestEvidenceId: latestVerifiedEvidence?.evidence_id,
    latestEvidenceTitle: latestVerifiedEvidence?.original_filename || (latestVerifiedEvidence ? `Verified ${latestVerifiedEvidence.source}` : undefined),
    pendingRequestsCount: studentPendingReqs.length,
    mismatchWarning: studentEvidence.find(e => e.verification_status === 'INVALID')?.review_notes || null
  };
}

/**
 * Creates standardized timeline event record
 */
export function createTimelineEvent(params: {
  student_id: string;
  registerNumber: string;
  source: SIDHEvidenceSource | string;
  status: 'GREEN' | 'BLUE' | 'YELLOW' | 'RED' | 'GRAY';
  title: string;
  description: string;
  details?: string;
  evidence_id?: string;
  timestamp?: string;
}): SIDHActivityTimelineEvent {
  return {
    id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    student_id: params.student_id,
    registerNumber: params.registerNumber,
    source: params.source,
    status: params.status,
    title: params.title,
    description: params.description,
    details: params.details,
    evidence_id: params.evidence_id,
    timestamp: params.timestamp || new Date().toISOString(),
    created_at: new Date().toISOString()
  };
}
