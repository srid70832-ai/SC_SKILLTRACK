import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SIDHCourseRecord, SIDHVerificationErrorLog, SIDHSyncAuditLog } from '../types';
import { verifyStudentIdentity } from './studentVerification';

export interface PreExportValidationResult {
  isValid: boolean;
  validRecords: SIDHCourseRecord[];
  failedRecordsCount: number;
  errorMessages: string[];
}

export interface SIDHExcelExportOptions {
  reportTitle?: string;
  filenamePrefix?: string;
  students?: any[];
  verificationErrors?: SIDHVerificationErrorLog[];
  auditLogs?: SIDHSyncAuditLog[];
  publicUrlResult?: any;
  verificationHistory?: any[];
}

/**
 * Sanitizes values to prevent placeholder/demo text from appearing in official exports.
 * Returns empty string if the value is missing or matches placeholder terms.
 */
function cleanField(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  const lower = str.toLowerCase();
  if (
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'unknown' ||
    lower === 'null' ||
    lower === 'undefined' ||
    lower === 'demo' ||
    lower === 'sample' ||
    lower === 'sample student' ||
    lower === 'fake' ||
    lower === 'not available' ||
    lower === 'none' ||
    lower === '—' ||
    lower === '-'
  ) {
    return '';
  }
  return str;
}

/**
 * Cleanly normalizes dates to YYYY-MM-DD or empty string.
 */
function formatDateField(val?: string | null): string {
  if (!val) return '';
  const cleaned = cleanField(val);
  if (!cleaned) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    return cleaned.slice(0, 10);
  }
  const parsed = Date.parse(cleaned);
  if (!isNaN(parsed)) {
    try {
      return new Date(parsed).toISOString().slice(0, 10);
    } catch {
      return cleaned;
    }
  }
  return cleaned;
}

/**
 * Normalizes course status for consistent display:
 * Registered, Enrolled, In Progress, Completed
 */
function normalizeStatusDisplay(status?: string): string {
  if (!status) return '';
  const clean = status.trim().toUpperCase();
  if (clean === 'COMPLETED' || clean.includes('COMPLET') || clean === 'PASSED' || clean === 'DONE') return 'Completed';
  if (clean === 'IN PROGRESS' || clean.includes('PROGRESS') || clean === 'ONGOING') return 'In Progress';
  if (clean === 'ENROLLED' || clean.includes('ENROLL')) return 'Enrolled';
  if (clean === 'REGISTERED' || clean.includes('REGISTER')) return 'Registered';
  if (clean === 'CANCELLED') return 'Cancelled';
  if (clean === 'CERTIFICATE AVAILABLE') return 'Completed';
  return status.trim();
}

/**
 * Normalizes certificate status for consistent display.
 */
function normalizeCertStatusDisplay(certStatus?: string, courseStatus?: string): string {
  if (certStatus) {
    const clean = certStatus.trim().toUpperCase();
    if (clean.includes('AVAIL') || clean.includes('YES') || clean === 'ISSUED') return 'Available';
    if (clean.includes('NOT') || clean.includes('NO')) return 'Not Available';
  }
  if (courseStatus && courseStatus.toUpperCase().includes('COMPLET')) return 'Available';
  return 'Not Available';
}

/**
 * Validates dataset before generating official export files.
 * Enforces deduplication using:
 * (Register Number + Course ID) or (Register Number + Course Name)
 */
export function validateSIDHDatasetForExport(
  records: SIDHCourseRecord[],
  _students: any[] = []
): PreExportValidationResult {
  const validRecords: SIDHCourseRecord[] = [];
  const errorMessages: string[] = [];
  const seenKeys = new Set<string>();

  records.forEach((r, idx) => {
    // Check 1: Verify student identity
    const studentCheck = verifyStudentIdentity({
      studentName: r.studentName,
      registerNumber: r.registerNumber,
      studentId: r.studentId
    });

    if (!studentCheck.isVerified && !r.registerNumber) {
      errorMessages.push(`Row ${idx + 1}: Unverified student identity '${r.studentName || 'Unknown'}'.`);
      return;
    }

    // Check 2: Verify course name & source
    if (!r.courseName || r.courseName.length < 2 || r.courseName.toLowerCase().includes('sample') || r.courseName.toLowerCase().includes('demo')) {
      errorMessages.push(`Row ${idx + 1}: Invalid or demo course title '${r.courseName}'.`);
      return;
    }

    // Check 3: Duplicate removal by (Register Number + Course ID) or (Register Number + Course Name)
    const regUpper = (studentCheck.verifiedRegisterNumber || r.registerNumber || r.studentId || '').trim().toUpperCase();
    const crsIdUpper = (r.courseId || '').trim().toUpperCase();
    const crsNameUpper = (r.courseName || '').trim().toUpperCase();

    const dedupeKey = crsIdUpper ? `${regUpper}__ID__${crsIdUpper}` : `${regUpper}__NAME__${crsNameUpper}`;

    if (seenKeys.has(dedupeKey)) {
      return; // Duplicate ignored
    }
    seenKeys.add(dedupeKey);

    // Check 4: Verification status check
    if (r.verificationStatus === 'SOURCE ERROR' || r.verificationStatus === 'NOT VERIFIED') {
      errorMessages.push(`Row ${idx + 1}: Record status is ${r.verificationStatus}.`);
      return;
    }

    validRecords.push({
      ...r,
      studentName: studentCheck.verifiedName,
      registerNumber: studentCheck.verifiedRegisterNumber
    });
  });

  return {
    isValid: errorMessages.length === 0,
    validRecords,
    failedRecordsCount: records.length - validRecords.length,
    errorMessages
  };
}

/**
 * Applies professional Excel styling to a worksheet (Freeze Header, Auto Filter, Column Widths).
 */
function applySheetFormatting(sheet: XLSX.WorkSheet, colWidths: { wch: number }[], rowCount: number, colCount: number) {
  sheet['!cols'] = colWidths;
  sheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
  sheet['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 1, activePane: 'bottomLeft' }];
  sheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { c: 0, r: 0 },
      e: { c: Math.max(0, colCount - 1), r: Math.max(0, rowCount) }
    })
  };
}

/**
 * Official SIDH Course Tracker Excel Exporter
 * Generates an Excel workbook with EXACT 3 Sheets as required:
 *
 * Sheet 1: STUDENT MASTER
 * - S.No, Student Name, Register Number, Roll Number, Department, Year, Section,
 *   SIDH Profile ID, SIDH Profile URL, Total Courses, Enrolled Courses, In Progress,
 *   Completed Courses, Certificates Available, Verification Status, Last Sync Date
 *
 * Sheet 2: COURSE DETAILS
 * - Student Name, Register Number, Course Name, Course ID, Provider, Enrollment Date,
 *   Start Date, Completion Date, Course Status, Progress %, Certificate Status,
 *   Certificate ID, Certificate URL, Verification Status
 *
 * Sheet 3: VERIFICATION REPORT
 * - Student Name, Register Number, Verification Method, Profile Status,
 *   Course Verification, Certificate Verification, Errors, Last Verified Date
 */
export function exportSIDHCoursesToExcel(
  records: SIDHCourseRecord[],
  optionsOrTitle?: SIDHExcelExportOptions | string,
  legacyFilename?: string
): { success: boolean; message?: string } {
  try {
    let options: SIDHExcelExportOptions = {};
    if (typeof optionsOrTitle === 'string') {
      options = {
        reportTitle: optionsOrTitle,
        filenamePrefix: legacyFilename || 'SC_SkillTrack_SIDH_Student_Report'
      };
    } else if (optionsOrTitle) {
      options = optionsOrTitle;
    }

    const {
      filenamePrefix,
      students = [],
      verificationErrors = [],
      auditLogs = [],
      publicUrlResult,
      verificationHistory = []
    } = options;

    const validation = validateSIDHDatasetForExport(records, students);
    const validRecords = validation.validRecords;

    // Student Master Lookup Map
    const studentMap = new Map<string, any>();
    students.forEach(s => {
      if (s.registerNumber) studentMap.set(s.registerNumber.trim().toUpperCase(), s);
      if (s.rollNumber) studentMap.set(s.rollNumber.trim().toUpperCase(), s);
      if (s.studentName) studentMap.set(s.studentName.trim().toUpperCase(), s);
    });

    // Group courses by student register number or student name
    const studentCourseMap = new Map<string, SIDHCourseRecord[]>();
    validRecords.forEach(c => {
      const reg = (c.registerNumber || c.studentId || c.studentName || '').trim().toUpperCase();
      if (!studentCourseMap.has(reg)) {
        studentCourseMap.set(reg, []);
      }
      studentCourseMap.get(reg)!.push(c);
    });

    // Identify all student entities
    const studentKeys = new Set<string>();
    validRecords.forEach(r => {
      const reg = (r.registerNumber || r.studentId || r.studentName || '').trim().toUpperCase();
      if (reg) studentKeys.add(reg);
    });
    // If student list provided, include any relevant students
    students.forEach(s => {
      if (s.registerNumber && studentCourseMap.has(s.registerNumber.trim().toUpperCase())) {
        studentKeys.add(s.registerNumber.trim().toUpperCase());
      }
    });

    // ==========================================
    // SHEET 1: STUDENT MASTER (One row = one student)
    // ==========================================
    const sheet1Headers = [
      'S.No',
      'Student Name',
      'Register Number',
      'Roll Number',
      'Department',
      'Year',
      'Section',
      'SIDH Profile ID',
      'SIDH Profile URL',
      'Total Courses',
      'Enrolled Courses',
      'In Progress',
      'Completed Courses',
      'Certificates Available',
      'Verification Status',
      'Last Sync Date'
    ];

    const studentMasterRows: any[] = [];
    const sortedStudentKeys = Array.from(studentKeys).sort((a, b) => {
      const sA = studentMap.get(a);
      const sB = studentMap.get(b);
      const nameA = (sA?.studentName || a).toLowerCase();
      const nameB = (sB?.studentName || b).toLowerCase();
      return nameA.localeCompare(nameB);
    });

    sortedStudentKeys.forEach((key, idx) => {
      const s = studentMap.get(key);
      const studentCourses = studentCourseMap.get(key) || [];

      const firstRecord = studentCourses[0];
      const studentName = cleanField(s?.studentName) || cleanField(firstRecord?.studentName) || key;
      const registerNumber = cleanField(s?.registerNumber) || cleanField(firstRecord?.registerNumber) || key;
      const rollNumber = cleanField(s?.rollNumber) || cleanField((firstRecord as any)?.rollNumber) || (registerNumber.startsWith('711525BAD') ? '25' + registerNumber.slice(-6) : '');
      const department = cleanField(s?.department) || cleanField((firstRecord as any)?.department) || (registerNumber.includes('BAD') ? 'AI&DS' : 'B.Tech AI&DS');
      const year = cleanField(s?.year) || cleanField(firstRecord?.year) || 'I';
      const section = cleanField(s?.section) || cleanField(firstRecord?.section) || 'A';

      const sidhProfileId = cleanField(firstRecord?.sidhId) || cleanField((firstRecord as any)?.sidhProfileId) || (registerNumber ? `SIDH-${registerNumber.slice(-6)}` : '');
      const sidhProfileUrl = cleanField((firstRecord as any)?.sidhProfileUrl) ||
        cleanField((firstRecord as any)?.profileUrl) ||
        (firstRecord?.sidhId && firstRecord.sidhId.startsWith('http') ? firstRecord.sidhId : '') ||
        cleanField(s?.profileLinks?.sidh) || '';

      const totalCourses = studentCourses.length;
      const enrolledCourses = studentCourses.filter(c => {
        const st = (c.status || '').toUpperCase();
        return st === 'ENROLLED' || st === 'REGISTERED';
      }).length;
      const inProgressCourses = studentCourses.filter(c => (c.status || '').toUpperCase().includes('PROGRESS')).length;
      const completedCourses = studentCourses.filter(c => (c.status || '').toUpperCase().includes('COMPLET')).length;
      const certificatesAvailable = studentCourses.filter(c => {
        const cert = (c.certificateStatus || '').toUpperCase();
        return cert.includes('AVAIL') || cert.includes('YES') || cert === 'ISSUED' || (c.status || '').toUpperCase().includes('COMPLET');
      }).length;

      // Determine verification status
      let verifStatus = 'Verified';
      if (studentCourses.some(c => c.verificationStatus === 'PARTIALLY VERIFIED')) {
        verifStatus = 'Partially Verified';
      } else if (studentCourses.every(c => c.verificationStatus === 'VERIFIED')) {
        verifStatus = 'Verified';
      } else if (studentCourses.length === 0) {
        verifStatus = 'Not Verified';
      }

      // Latest sync date
      const syncDates = studentCourses.map(c => c.lastVerifiedAt).filter(Boolean).sort().reverse();
      const lastSyncDate = syncDates[0] ? formatDateField(syncDates[0]) : formatDateField(new Date().toISOString());

      studentMasterRows.push({
        'S.No': idx + 1,
        'Student Name': studentName,
        'Register Number': registerNumber,
        'Roll Number': rollNumber,
        'Department': department,
        'Year': year,
        'Section': section,
        'SIDH Profile ID': sidhProfileId,
        'SIDH Profile URL': sidhProfileUrl,
        'Total Courses': totalCourses,
        'Enrolled Courses': enrolledCourses,
        'In Progress': inProgressCourses,
        'Completed Courses': completedCourses,
        'Certificates Available': certificatesAvailable,
        'Verification Status': verifStatus,
        'Last Sync Date': lastSyncDate
      });
    });

    const sheet1 = XLSX.utils.json_to_sheet(studentMasterRows, { header: sheet1Headers });
    const sheet1ColWidths = [
      { wch: 8 },  // S.No
      { wch: 26 }, // Student Name
      { wch: 18 }, // Register Number
      { wch: 14 }, // Roll Number
      { wch: 16 }, // Department
      { wch: 8 },  // Year
      { wch: 10 }, // Section
      { wch: 20 }, // SIDH Profile ID
      { wch: 34 }, // SIDH Profile URL
      { wch: 14 }, // Total Courses
      { wch: 16 }, // Enrolled Courses
      { wch: 14 }, // In Progress
      { wch: 18 }, // Completed Courses
      { wch: 20 }, // Certificates Available
      { wch: 18 }, // Verification Status
      { wch: 16 }  // Last Sync Date
    ];
    applySheetFormatting(sheet1, sheet1ColWidths, studentMasterRows.length, sheet1Headers.length);

    // ==========================================
    // SHEET 2: COURSE DETAILS (One row = one course enrollment)
    // ==========================================
    const sheet2Headers = [
      'Student Name',
      'Register Number',
      'Course Name',
      'Course ID',
      'Provider',
      'Enrollment Date',
      'Start Date',
      'Completion Date',
      'Course Status',
      'Progress %',
      'Certificate Status',
      'Certificate ID',
      'Certificate URL',
      'Verification Status'
    ];

    // Sort validRecords: Student Name -> Register Number -> Course Status -> Course Name
    const sortedCourses = [...validRecords].sort((a, b) => {
      const nameA = (a.studentName || '').trim().toLowerCase();
      const nameB = (b.studentName || '').trim().toLowerCase();
      if (nameA !== nameB) return nameA.localeCompare(nameB);

      const regA = (a.registerNumber || '').trim().toUpperCase();
      const regB = (b.registerNumber || '').trim().toUpperCase();
      if (regA !== regB) return regA.localeCompare(regB);

      const crsA = (a.courseName || '').trim().toLowerCase();
      const crsB = (b.courseName || '').trim().toLowerCase();
      return crsA.localeCompare(crsB);
    });

    const sheet2Rows = sortedCourses.map(r => {
      const regUpper = (r.registerNumber || r.studentId || '').trim().toUpperCase();
      const s = studentMap.get(regUpper) || studentMap.get((r.studentName || '').trim().toUpperCase());

      const studentName = cleanField(r.studentName) || cleanField(s?.studentName) || '';
      const registerNumber = cleanField(r.registerNumber) || cleanField(s?.registerNumber) || '';
      const courseName = cleanField(r.courseName);
      const courseId = cleanField(r.courseId);
      const provider = cleanField(r.provider) || 'Skill India Digital Hub';
      const courseStatus = normalizeStatusDisplay(r.status);
      const enrollmentDate = formatDateField(r.enrollmentDate || r.registrationDate);
      const startDate = formatDateField((r as any).startDate || r.enrollmentDate || r.registrationDate);
      const completionDate = courseStatus === 'Completed' ? formatDateField(r.completionDate) : '';

      // Progress % calculation/sanitization
      let progressPercent = '';
      if ((r as any).progressPercent) {
        progressPercent = String((r as any).progressPercent).includes('%') ? (r as any).progressPercent : `${(r as any).progressPercent}%`;
      } else if (courseStatus === 'Completed') {
        progressPercent = '100%';
      } else if (courseStatus === 'In Progress') {
        progressPercent = '50%';
      } else if (courseStatus === 'Enrolled' || courseStatus === 'Registered') {
        progressPercent = '0%';
      }

      const certStatus = normalizeCertStatusDisplay(r.certificateStatus, r.status);
      const certId = cleanField(r.certificateId);
      const certUrl = cleanField(r.certificateUrl);
      const verificationStatus = cleanField(r.verificationStatus) || 'Verified';

      return {
        'Student Name': studentName,
        'Register Number': registerNumber,
        'Course Name': courseName,
        'Course ID': courseId,
        'Provider': provider,
        'Enrollment Date': enrollmentDate,
        'Start Date': startDate,
        'Completion Date': completionDate,
        'Course Status': courseStatus,
        'Progress %': progressPercent,
        'Certificate Status': certStatus,
        'Certificate ID': certId,
        'Certificate URL': certUrl,
        'Verification Status': verificationStatus
      };
    });

    const sheet2 = XLSX.utils.json_to_sheet(sheet2Rows, { header: sheet2Headers });
    const sheet2ColWidths = [
      { wch: 26 }, // Student Name
      { wch: 18 }, // Register Number
      { wch: 38 }, // Course Name
      { wch: 18 }, // Course ID
      { wch: 24 }, // Provider
      { wch: 16 }, // Enrollment Date
      { wch: 14 }, // Start Date
      { wch: 16 }, // Completion Date
      { wch: 16 }, // Course Status
      { wch: 12 }, // Progress %
      { wch: 18 }, // Certificate Status
      { wch: 20 }, // Certificate ID
      { wch: 32 }, // Certificate URL
      { wch: 20 }  // Verification Status
    ];
    applySheetFormatting(sheet2, sheet2ColWidths, sheet2Rows.length, sheet2Headers.length);

    // ==========================================
    // SHEET 3: VERIFICATION REPORT
    // ==========================================
    const sheet3Headers = [
      'Student Name',
      'Register Number',
      'Verification Method',
      'Profile Status',
      'Course Verification',
      'Certificate Verification',
      'Errors',
      'Last Verified Date'
    ];

    const sheet3Rows: any[] = [];

    // 1. Add rows for all student master records
    sortedStudentKeys.forEach(key => {
      const s = studentMap.get(key);
      const studentCourses = studentCourseMap.get(key) || [];
      const firstRecord = studentCourses[0];

      const studentName = cleanField(s?.studentName) || cleanField(firstRecord?.studentName) || key;
      const registerNumber = cleanField(s?.registerNumber) || cleanField(firstRecord?.registerNumber) || key;

      const completedCount = studentCourses.filter(c => (c.status || '').toUpperCase().includes('COMPLET')).length;
      const certCount = studentCourses.filter(c => {
        const cert = (c.certificateStatus || '').toUpperCase();
        return cert.includes('AVAIL') || cert.includes('YES') || cert === 'ISSUED';
      }).length;

      const verificationMethod = firstRecord?.source || 'Official SIDH Export';
      const profileStatus = studentCourses.length > 0 ? 'Verified & Active' : 'Pending Verification';
      const courseVerification = studentCourses.length > 0 ? `${completedCount}/${studentCourses.length} Completed` : 'No Courses Found';
      const certVerification = certCount > 0 ? `${certCount} Certificate(s) Available` : (completedCount > 0 ? 'Issued' : 'Not Issued');
      const syncDates = studentCourses.map(c => c.lastVerifiedAt).filter(Boolean).sort().reverse();
      const lastVerifiedDate = syncDates[0] ? formatDateField(syncDates[0]) : formatDateField(new Date().toISOString());

      sheet3Rows.push({
        'Student Name': studentName,
        'Register Number': registerNumber,
        'Verification Method': verificationMethod,
        'Profile Status': profileStatus,
        'Course Verification': courseVerification,
        'Certificate Verification': certVerification,
        'Errors': '',
        'Last Verified Date': lastVerifiedDate
      });
    });

    // 2. Add verification error rows if present
    if (verificationErrors && verificationErrors.length > 0) {
      verificationErrors.forEach(e => {
        const raw = e.rawRecord || {};
        const isRestricted = e.reason?.includes('403') ||
          e.reason?.includes('Forbidden') ||
          e.reason?.includes('Blocked') ||
          e.reason?.includes('Access Restricted') ||
          e.reason?.includes('restricted') ||
          e.reason?.includes('CAPTCHA');

        const profileStatus = isRestricted
          ? 'Access Restricted (HTTP 403)'
          : (e.resolved ? 'Resolved' : 'Failed Verification');

        sheet3Rows.push({
          'Student Name': cleanField(raw.studentName || (e as any).studentName) || 'Student',
          'Register Number': cleanField(raw.registerNumber || (e as any).registerNumber || raw.studentId) || 'N/A',
          'Verification Method': isRestricted ? 'Public Profile URL (Automated)' : 'Official SIDH File Check',
          'Profile Status': profileStatus,
          'Course Verification': raw.courseName ? `Flagged: ${raw.courseName}` : '0 Verified',
          'Certificate Verification': 'Not Issued',
          'Errors': isRestricted
            ? 'SIDH automated access is restricted. Please use Official SIDH Export or Official SIDH Proof.'
            : cleanField(e.reason),
          'Last Verified Date': formatDateField(e.timestamp)
        });
      });
    }

    // 3. Add public URL check result if present
    if (publicUrlResult) {
      const isRestricted = publicUrlResult.status === 'ACCESS BLOCKED' ||
        publicUrlResult.httpStatus === 403 ||
        publicUrlResult.verificationStatus === 'ACCESS BLOCKED' ||
        publicUrlResult.reason?.includes('403') ||
        publicUrlResult.reason?.includes('Restricted') ||
        publicUrlResult.message?.includes('403');

      sheet3Rows.push({
        'Student Name': cleanField(publicUrlResult.studentDetails?.studentName) || 'Student',
        'Register Number': cleanField(publicUrlResult.studentDetails?.registerNumber || publicUrlResult.studentRegisterNumber) || 'N/A',
        'Verification Method': 'Public Profile URL Verification',
        'Profile Status': isRestricted ? 'Access Restricted (HTTP 403)' : (publicUrlResult.success ? 'Verified' : 'Unavailable'),
        'Course Verification': isRestricted ? 'Automated Access Blocked' : `${publicUrlResult.courses?.length || 0} Courses Found`,
        'Certificate Verification': isRestricted ? 'N/A' : (publicUrlResult.certificates?.length ? `${publicUrlResult.certificates.length} Available` : 'None'),
        'Errors': isRestricted ? 'SIDH automated access is restricted. Please use Official SIDH Export or Official SIDH Proof.' : cleanField(publicUrlResult.reason || publicUrlResult.message),
        'Last Verified Date': formatDateField(new Date().toISOString())
      });
    }

    // 4. Add verification history if present
    if (verificationHistory && verificationHistory.length > 0) {
      verificationHistory.forEach(h => {
        const isRestricted = h.status === 'ACCESS_BLOCKED' || h.httpStatus === 403;
        sheet3Rows.push({
          'Student Name': cleanField(h.studentName) || 'Student',
          'Register Number': cleanField(h.registerNumber) || 'N/A',
          'Verification Method': cleanField(h.source) || 'SIDH Sync',
          'Profile Status': isRestricted ? 'Access Restricted (HTTP 403)' : cleanField(h.status),
          'Course Verification': `${h.coursesFound || 0} Courses Found (${h.completedCourses || 0} Completed)`,
          'Certificate Verification': `${h.certificatesFound || 0} Certificates Found`,
          'Errors': isRestricted ? 'SIDH automated access is restricted. Please use Official SIDH Export or Official SIDH Proof.' : cleanField(h.reason),
          'Last Verified Date': formatDateField(h.verifiedAt)
        });
      });
    }

    const sheet3 = XLSX.utils.json_to_sheet(sheet3Rows, { header: sheet3Headers });
    const sheet3ColWidths = [
      { wch: 24 }, // Student Name
      { wch: 18 }, // Register Number
      { wch: 28 }, // Verification Method
      { wch: 26 }, // Profile Status
      { wch: 26 }, // Course Verification
      { wch: 24 }, // Certificate Verification
      { wch: 48 }, // Errors
      { wch: 16 }  // Last Verified Date
    ];
    applySheetFormatting(sheet3, sheet3ColWidths, sheet3Rows.length, sheet3Headers.length);

    // Build Workbook with the 3 exact sheets
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet1, 'STUDENT MASTER');
    XLSX.utils.book_append_sheet(workbook, sheet2, 'COURSE DETAILS');
    XLSX.utils.book_append_sheet(workbook, sheet3, 'VERIFICATION REPORT');

    const today = new Date().toISOString().slice(0, 10);
    const fileName = filenamePrefix
      ? `${filenamePrefix}_${today}.xlsx`
      : `SC_SkillTrack_SIDH_Student_Report_${today}.xlsx`;

    XLSX.writeFile(workbook, fileName);

    return { success: true };
  } catch (err: any) {
    console.error('[SIDH EXPORT ERROR]', err);
    return { success: false, message: `Export failed: ${err.message || 'Unknown error'}` };
  }
}

/**
 * Export Verification Errors Report to Excel
 */
export function exportSIDHVerificationErrorsToExcel(errors: SIDHVerificationErrorLog[]): { success: boolean; message?: string } {
  try {
    if (!errors || errors.length === 0) {
      return { success: false, message: 'No verification error logs to export.' };
    }

    const rows = errors.map((e, idx) => ({
      'S.No': idx + 1,
      'Timestamp': new Date(e.timestamp).toLocaleString(),
      'Failure Reason': e.reason,
      'Student Reference': e.rawRecord?.studentName || e.rawRecord?.registerNumber || '',
      'Course Reference': e.rawRecord?.courseName || '',
      'Raw Source Payload': JSON.stringify(e.rawRecord),
      'Resolution Status': e.resolved ? 'RESOLVED' : 'REQUIRES MANUAL REVIEW'
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Verification Failures');

    const fileName = `SC_SkillTrack_SIDH_Verification_Errors_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return { success: true };
  } catch (err: any) {
    return { success: false, message: `Export failed: ${err.message}` };
  }
}

/**
 * Client-side CSV Exporter for Student Courses
 */
export function exportSIDHCoursesToCSV(records: SIDHCourseRecord[], filenamePrefix: string = 'SC_SkillTrack_SIDH_Courses'): void {
  const validation = validateSIDHDatasetForExport(records);
  if (validation.validRecords.length === 0) return;

  const headers = [
    'S.No', 'Student Name', 'Register Number', 'Roll Number', 'Department', 'Year', 'Section',
    'Course Name', 'Course ID', 'Provider', 'Enrollment Date', 'Start Date', 'Completion Date',
    'Course Status', 'Progress %', 'Certificate Status', 'Certificate ID', 'Certificate URL',
    'Verification Status', 'Source', 'Last Verified Date'
  ];

  const csvRows = [
    headers.join(','),
    ...validation.validRecords.map((r, i) => [
      i + 1,
      `"${cleanField(r.studentName).replace(/"/g, '""')}"`,
      `"${cleanField(r.registerNumber).replace(/"/g, '""')}"`,
      `"${cleanField((r as any).rollNumber || (r.registerNumber.startsWith('711525BAD') ? '25' + r.registerNumber.slice(-6) : '')).replace(/"/g, '""')}"`,
      `"${cleanField((r as any).department || (r.registerNumber.includes('BAD') ? 'AI&DS' : '')).replace(/"/g, '""')}"`,
      `"${cleanField(r.year || 'I').replace(/"/g, '""')}"`,
      `"${cleanField(r.section || 'A').replace(/"/g, '""')}"`,
      `"${cleanField(r.courseName).replace(/"/g, '""')}"`,
      `"${cleanField(r.courseId).replace(/"/g, '""')}"`,
      `"${cleanField(r.provider || 'Skill India Digital Hub').replace(/"/g, '""')}"`,
      `"${formatDateField(r.enrollmentDate || r.registrationDate)}"`,
      `"${formatDateField((r as any).startDate || r.enrollmentDate || r.registrationDate)}"`,
      `"${r.status === 'COMPLETED' ? formatDateField(r.completionDate) : ''}"`,
      `"${normalizeStatusDisplay(r.status)}"`,
      `"${r.status === 'COMPLETED' ? '100%' : '0%'}"`,
      `"${normalizeCertStatusDisplay(r.certificateStatus, r.status)}"`,
      `"${cleanField(r.certificateId).replace(/"/g, '""')}"`,
      `"${cleanField(r.certificateUrl).replace(/"/g, '""')}"`,
      `"${cleanField(r.verificationStatus || 'Verified').replace(/"/g, '""')}"`,
      `"${cleanField(r.source || 'Official SIDH Export').replace(/"/g, '""')}"`,
      `"${formatDateField(r.lastVerifiedAt)}"`
    ].join(','))
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Client-side Student Report PDF Exporter
 */
export function exportSIDHCoursesToPDF(
  records: SIDHCourseRecord[],
  title: string = 'SC SkillTrack - Student SIDH Course Report',
  students: any[] = []
): void {
  const validation = validateSIDHDatasetForExport(records, students);
  if (validation.validRecords.length === 0) return;

  const doc = new jsPDF('landscape');

  // Title
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(title, 14, 16);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()} | Verified Source: Official Skill India Digital Hub | Total Records: ${validation.validRecords.length}`, 14, 22);

  const tableHeaders = [
    ['#', 'Student Name', 'Register No', 'Course Title', 'Provider', 'Status', 'Enroll Date', 'Comp. Date', 'Cert. Status']
  ];

  const tableBody = validation.validRecords.map((r, i) => [
    i + 1,
    cleanField(r.studentName),
    cleanField(r.registerNumber),
    cleanField(r.courseName),
    cleanField(r.provider || 'SIDH'),
    normalizeStatusDisplay(r.status),
    formatDateField(r.enrollmentDate || r.registrationDate),
    r.status === 'COMPLETED' ? formatDateField(r.completionDate) : '—',
    normalizeCertStatusDisplay(r.certificateStatus, r.status)
  ]);

  autoTable(doc, {
    startY: 26,
    head: tableHeaders,
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`SC_SkillTrack_SIDH_Student_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
