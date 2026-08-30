import { SIDHCourseRecord, SIDHVerificationStatus, SIDHCourseStatus, SIDHCertificateStatus, SIDHSyncAuditLog } from '../types';
import { verifyStudentIdentity } from './studentVerification';

export interface RawSIDHRecordInput {
  sourceRecordId?: string;
  studentId?: string;
  registerNumber?: string;
  studentName?: string;
  courseName?: string;
  courseId?: string;
  provider?: string;
  registrationDate?: string;
  enrollmentDate?: string;
  completionDate?: string | null;
  status?: string;
  certificateStatus?: string;
  sidhId?: string;
  section?: string;
  year?: string;
  mentorName?: string;
  category?: string;
  source?: string;
  sourceReference?: string;
  verificationStatus?: string;
}

export interface VerificationPipelineResult {
  verifiedRecords: SIDHCourseRecord[];
  verificationErrors: Array<{
    rawRecord: any;
    reason: string;
    timestamp: string;
  }>;
  auditSummary: {
    studentsChecked: number;
    studentsVerified: number;
    studentsNotVerified: number;
    coursesFound: number;
    newCourses: number;
    completedCourses: number;
    duplicatesIgnored: number;
    verificationFailures: number;
  };
}

/**
 * Normalizes raw course status to official SIDH status enum
 */
export function normalizeSIDHStatus(rawStatus?: string): SIDHCourseStatus {
  if (!rawStatus) return 'NOT VERIFIED';
  const clean = rawStatus.trim().toUpperCase();

  if (clean.includes('COMPLET') || clean === 'PASSED' || clean === 'DONE') return 'COMPLETED';
  if (clean.includes('IN PROGRESS') || clean === 'PROGRESS' || clean === 'ONGOING') return 'IN PROGRESS';
  if (clean.includes('ENROLL') || clean === 'ACTIVE') return 'ENROLLED';
  if (clean.includes('REGISTER')) return 'REGISTERED';
  if (clean.includes('CANCEL')) return 'CANCELLED';
  if (clean.includes('CERTIFICATE')) return 'CERTIFICATE AVAILABLE';
  if (clean.includes('NOT FOUND')) return 'NOT FOUND';

  return 'NOT VERIFIED';
}

/**
 * Normalizes raw certificate status
 */
export function normalizeCertificateStatus(rawCertStatus?: string, courseStatus?: SIDHCourseStatus): SIDHCertificateStatus {
  if (rawCertStatus) {
    const clean = rawCertStatus.trim().toUpperCase();
    if (clean.includes('AVAIL') || clean.includes('YES') || clean === 'ISSUED') return 'AVAILABLE';
    if (clean.includes('NOT') || clean.includes('NO')) return 'NOT AVAILABLE';
  }
  if (courseStatus === 'COMPLETED') return 'AVAILABLE';
  return 'NOT AVAILABLE';
}

/**
 * SIDH Verification Pipeline
 * Enforces: Real Data -> Match Student -> Validate Course -> Validate Status -> Check Duplicates -> Verify Record
 */
export function runSIDHVerificationPipeline(
  rawInputs: RawSIDHRecordInput[],
  studentMasterList: any[],
  existingRecords: SIDHCourseRecord[] = []
): VerificationPipelineResult {
  const verifiedRecords: SIDHCourseRecord[] = [...existingRecords];
  const verificationErrors: Array<{ rawRecord: any; reason: string; timestamp: string }> = [];

  let studentsCheckedCount = 0;
  const matchedStudentSet = new Set<string>();
  const unverifiedStudentSet = new Set<string>();
  let coursesFoundCount = rawInputs.length;
  let newCoursesCount = 0;
  let completedCoursesCount = 0;
  let duplicatesIgnoredCount = 0;
  let verificationFailuresCount = 0;

  rawInputs.forEach((input, idx) => {
    // Step 1: Validate source record content
    if (!input || typeof input !== 'object') {
      verificationFailuresCount++;
      verificationErrors.push({
        rawRecord: input,
        reason: 'Empty or invalid record object',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const rawReg = (input.registerNumber || input.studentId || '').trim();
    const rawName = (input.studentName || '').trim();

    if (!rawReg && !rawName) {
      verificationFailuresCount++;
      verificationErrors.push({
        rawRecord: input,
        reason: 'Missing both Student Register Number and Student Name',
        timestamp: new Date().toISOString()
      });
      return;
    }

    studentsCheckedCount++;

    // Step 2: Student Matching against SC SkillTrack Student Master Database
    let matchedStudent: any = null;
    const cleanRegUpper = rawReg.toUpperCase();

    if (cleanRegUpper) {
      matchedStudent = studentMasterList.find(s => 
        (s.registerNumber && s.registerNumber.toUpperCase() === cleanRegUpper) ||
        (s.rollNumber && s.rollNumber.toUpperCase() === cleanRegUpper)
      );
    }

    if (!matchedStudent && rawName) {
      const cleanNameUpper = rawName.toUpperCase();
      const possibleMatches = studentMasterList.filter(s => 
        s.studentName && s.studentName.toUpperCase() === cleanNameUpper
      );
      if (possibleMatches.length === 1) {
        matchedStudent = possibleMatches[0];
      } else if (possibleMatches.length > 1) {
        // Ambiguous match rule!
        verificationFailuresCount++;
        unverifiedStudentSet.add(rawName);
        verificationErrors.push({
          rawRecord: input,
          reason: `MANUAL VERIFICATION REQUIRED: Multiple students named '${rawName}' found. Match is ambiguous.`,
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Exact ID fallback check using Student Identification Engine
    const verifiedIdentity = verifyStudentIdentity({
      studentName: matchedStudent?.studentName || rawName,
      registerNumber: matchedStudent?.registerNumber || rawReg,
      studentId: input.studentId
    });

    if (!matchedStudent && !verifiedIdentity.isVerified) {
      verificationFailuresCount++;
      unverifiedStudentSet.add(rawReg || rawName);
      verificationErrors.push({
        rawRecord: input,
        reason: `STUDENT NOT VERIFIED: Student '${rawReg || rawName}' not found in SC SkillTrack master student registry.`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const studentName = matchedStudent?.studentName || verifiedIdentity.verifiedName;
    const registerNumber = matchedStudent?.registerNumber || verifiedIdentity.verifiedRegisterNumber;
    const section = matchedStudent?.section || input.section || 'A';
    const year = matchedStudent?.year || input.year || 'I';
    const mentorName = matchedStudent?.mentorName || input.mentorName || 'Mrs. B. Padmapriya';
    const sidhId = input.sidhId || `SIDH-${registerNumber}`;

    matchedStudentSet.add(registerNumber);

    // Step 3: Validate Course Title & Details
    const courseName = (input.courseName || '').trim();
    if (!courseName || courseName.length < 3 || courseName.toLowerCase().includes('demo') || courseName.toLowerCase().includes('sample')) {
      verificationFailuresCount++;
      verificationErrors.push({
        rawRecord: input,
        reason: `INVALID COURSE NAME: '${courseName || 'Empty'}'. Sample or placeholder courses are strictly excluded.`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const provider = (input.provider || 'Skill India Digital Hub (SIDH)').trim();
    const courseId = (input.courseId || `CRS-${courseName.replace(/\s+/g, '-').toUpperCase().slice(0, 15)}`).trim();
    const sourceRecordId = input.sourceRecordId || `SR-${registerNumber}-${courseId}-${idx}`;
    const source = input.source || 'Official SIDH Export';
    const sourceReference = input.sourceReference || input.sourceRecordId || 'Official SIDH Export File';

    // Step 4: Validate Course Status & Dates
    const status = normalizeSIDHStatus(input.status);
    const certificateStatus = normalizeCertificateStatus(input.certificateStatus, status);
    
    const regDate = input.registrationDate || new Date().toISOString().slice(0, 10);
    const enrollDate = input.enrollmentDate || regDate;
    
    // Strict date rule: If completion date is missing, DO NOT invent a date!
    let compDate: string | null = null;
    let verificationStatus: SIDHVerificationStatus = (input.verificationStatus as SIDHVerificationStatus) || 'VERIFIED';

    if (status === 'COMPLETED') {
      completedCoursesCount++;
      if (input.completionDate) {
        compDate = input.completionDate;
      } else {
        compDate = null;
        if (verificationStatus === 'VERIFIED') {
          verificationStatus = 'PARTIALLY VERIFIED';
        }
      }
    } else {
      compDate = input.completionDate || null;
    }

    // Step 5: Duplicate Detection Priority (1. Student ID, 2. Register No, 3. Cert ID, 4. Student ID + Course ID)
    let uniqueKey = '';
    const certIdRaw = (input as any).certificateId || null;
    if (certIdRaw) {
      uniqueKey = `cert:${certIdRaw}`;
    } else {
      uniqueKey = `st:${registerNumber}_crs:${courseId}`;
    }

    const existingIndex = verifiedRecords.findIndex(r => 
      r.id === uniqueKey || 
      (certIdRaw && r.certificateId === certIdRaw) ||
      (r.registerNumber === registerNumber && r.courseId === courseId) ||
      (r.registerNumber === registerNumber && r.courseName.toLowerCase() === courseName.toLowerCase())
    );

    const record: SIDHCourseRecord = {
      id: uniqueKey,
      studentId: registerNumber,
      studentName,
      registerNumber,
      sidhId,
      section,
      year,
      mentorName,
      courseName,
      courseId,
      provider,
      registrationDate: regDate,
      enrollmentDate: enrollDate,
      completionDate: compDate,
      status,
      progress: (input as any).progress !== undefined ? (input as any).progress : (status === 'COMPLETED' ? 100 : null),
      completionStatus: status === 'COMPLETED' ? 'Completed' : status,
      certificateStatus,
      certificateId: certIdRaw || undefined,
      certificateUrl: (input as any).certificateUrl || undefined,
      source,
      sourceRecordId,
      sourceReference,
      sourceUrlFile: input.sourceReference || input.sourceRecordId,
      verificationStatus,
      verificationMethod: input.source ? `Verified via ${input.source}` : 'Official Pipeline Verification',
      lastVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: input.category || 'Skill Development',
      timeline: [
        {
          date: regDate,
          action: 'Course Registered',
          details: `Registered for ${courseName} on SIDH platform. Source: ${source}`,
          verifiedBy: 'SIDH Verification Engine'
        },
        ...(enrollDate !== regDate ? [{
          date: enrollDate,
          action: 'Course Enrolled',
          details: `Enrolled in learning modules provided by ${provider}.`,
          verifiedBy: 'SIDH Verification Engine'
        }] : []),
        ...(compDate ? [{
          date: compDate,
          action: 'Course Completed',
          details: `Successfully completed course requirements and verified certificate eligibility.`,
          verifiedBy: 'SC SkillTrack Automated Verification Engine'
        }] : [])
      ]
    };

    if (existingIndex >= 0) {
      const existing = verifiedRecords[existingIndex];
      // Data Integrity rule: Never overwrite existing COMPLETED status with unverified or lower status!
      if (existing.status === 'COMPLETED' && status !== 'COMPLETED') {
        duplicatesIgnoredCount++;
        // Retain completed status, update verification timestamp
        verifiedRecords[existingIndex] = {
          ...existing,
          lastVerifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        verifiedRecords[existingIndex] = record;
      }
    } else {
      verifiedRecords.push(record);
      newCoursesCount++;
    }
  });

  return {
    verifiedRecords,
    verificationErrors,
    auditSummary: {
      studentsChecked: studentsCheckedCount,
      studentsVerified: matchedStudentSet.size,
      studentsNotVerified: unverifiedStudentSet.size,
      coursesFound: coursesFoundCount,
      newCourses: newCoursesCount,
      completedCourses: completedCoursesCount,
      duplicatesIgnored: duplicatesIgnoredCount,
      verificationFailures: verificationFailuresCount
    }
  };
}
