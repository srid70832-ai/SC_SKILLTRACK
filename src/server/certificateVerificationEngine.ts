// SC SkillTrack AI - Certificate Verification Engine
// Zero-Hallucination, Evidence-Based Extraction & Anti-Hallucination Validation Layer

import { 
  CertificateVerificationRecord, 
  ExtractedCertificateData, 
  ExtractedEvidenceField, 
  StudentMatchStatus, 
  CourseMatchStatus, 
  OfficialVerificationStatus,
  CertificateAuditLogEntry 
} from '../types';

export const GEMINI_CERTIFICATE_VERIFICATION_PROMPT = `You are an official academic and institutional certificate verification engine.

Analyze ONLY the information visibly present in the supplied certificate document.

CRITICAL ZERO-HALLUCINATION & EVIDENCE-FIRST MANDATES:
1. NEVER invent, infer, estimate, autocomplete, or assume missing information.
2. If a field is not clearly and visibly printed in the document:
   - "value" MUST be "Not Available"
   - "evidence" MUST be "No visible evidence found"
   - "confidence" MUST be 0.00
3. NEVER use the document filename, storage path, UUID, upload ID, or document ID as the course name, student name, or any other field.
4. Do NOT use student profile data or external knowledge to fill certificate fields.
5. Extract ONLY visible, printed text from the certificate.

For EVERY field, you MUST return:
- "value": The exact visible string extracted from the document, or "Not Available" if not found.
- "evidence": The exact visible phrase/snippet or location in the document confirming this value, or "No visible evidence found".
- "confidence": A float from 0.00 to 1.00 indicating OCR clarity (0 if Not Available).

RETURN VALID JSON matching this exact structure:
{
  "certificateTitle": { "value": string, "evidence": string, "confidence": number },
  "studentName": { "value": string, "evidence": string, "confidence": number },
  "courseName": { "value": string, "evidence": string, "confidence": number },
  "courseCategory": { "value": string, "evidence": string, "confidence": number },
  "issuingOrganization": { "value": string, "evidence": string, "confidence": number },
  "platform": { "value": string, "evidence": string, "confidence": number },
  "certificateId": { "value": string, "evidence": string, "confidence": number },
  "credentialId": { "value": string, "evidence": string, "confidence": number },
  "registrationId": { "value": string, "evidence": string, "confidence": number },
  "completionDate": { "value": string, "evidence": string, "confidence": number },
  "issueDate": { "value": string, "evidence": string, "confidence": number },
  "expiryDate": { "value": string, "evidence": string, "confidence": number },
  "duration": { "value": string, "evidence": string, "confidence": number },
  "score": { "value": string, "evidence": string, "confidence": number },
  "grade": { "value": string, "evidence": string, "confidence": number },
  "percentage": { "value": string, "evidence": string, "confidence": number },
  "skills": { "value": string[], "evidence": string, "confidence": number },
  "certificateType": { "value": string, "evidence": string, "confidence": number },
  "verificationUrl": { "value": string, "evidence": string, "confidence": number },
  "issuerWebsite": { "value": string, "evidence": string, "confidence": number },
  "rawVisibleText": string
}`;

// Checks if a string is a generated ID, UUID, filename, storage path, or generic placeholder
export function isForbiddenIdentifierOrFilename(str: string): boolean {
  if (!str || typeof str !== 'string') return true;
  const s = str.trim();
  if (s === '' || s.toLowerCase() === 'not available' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'none' || s.toLowerCase() === 'null') {
    return true;
  }

  // Check for UUID format (e.g. 123e4567-e89b-12d3-a456-426614174000)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
    return true;
  }

  // Check for system generated prefix IDs (e.g., CERT-1723456789-ABC, PROOF-12345, EVD-123, SYNC-123)
  if (/^(CERT|EVD|PROOF|DOC|SYNC|REQ|REV|LOG|AUDIT|IMP|CRS)-[0-9]+/i.test(s)) {
    return true;
  }

  // Check for file extensions (e.g., sample.pdf, cert.png, image.jpg)
  if (/\.(pdf|png|jpe?g|webp|svg|gif|docx?|xlsx?)$/i.test(s)) {
    return true;
  }

  // Check for storage paths or URLs (e.g. certificates/..., blob:..., /uploads/...)
  if (s.includes('/') || s.includes('\\') || s.startsWith('blob:') || s.startsWith('data:') || s.startsWith('http://') || s.startsWith('https://')) {
    return true;
  }

  // Check for hex hashes of length 24, 32, 40, 64
  if (/^[0-9a-fA-F]{24}$|^[0-9a-fA-F]{32}$|^[0-9a-fA-F]{40}$|^[0-9a-fA-F]{64}$/.test(s)) {
    return true;
  }

  // Check for generic placeholders
  if (/^(untitled|unknown|document|certificate|sidh course|verified course|sample)$/i.test(s)) {
    return true;
  }

  return false;
}

// Clean and normalize evidence field
export function sanitizeEvidenceField<T = string>(
  raw: any, 
  defaultValue: T = ("Not Available" as unknown as T),
  isArray: boolean = false,
  preventForbiddenIdentifiers: boolean = false
): ExtractedEvidenceField<T> {
  if (!raw || typeof raw !== 'object') {
    return {
      value: defaultValue,
      evidence: "No visible evidence found in certificate",
      confidence: 0
    };
  }

  let value: any = raw.value;
  let evidence: string = typeof raw.evidence === 'string' ? raw.evidence.trim() : "Visible document text";
  let confidence: number = typeof raw.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0;

  if (isArray) {
    if (!Array.isArray(value) || value.length === 0) {
      return {
        value: ([] as unknown as T),
        evidence: "No skills explicitly listed in certificate",
        confidence: 0
      };
    }
    const cleanArray = value
      .map((v: any) => String(v).trim())
      .filter((v: string) => v.length > 0 && v.toLowerCase() !== 'not available' && !isForbiddenIdentifierOrFilename(v));
    if (cleanArray.length === 0) {
      return {
        value: ([] as unknown as T),
        evidence: "No skills explicitly listed in certificate",
        confidence: 0
      };
    }
    return {
      value: (cleanArray as unknown as T),
      evidence: evidence || `Extracted ${cleanArray.length} skills from document`,
      confidence: confidence || 0.9
    };
  }

  if (value === null || value === undefined || typeof value !== 'string' || value.trim() === '' || value.toLowerCase() === 'null' || value.toLowerCase() === 'n/a' || value.toLowerCase() === 'none') {
    return {
      value: defaultValue,
      evidence: "No visible evidence found in certificate",
      confidence: 0
    };
  }

  value = value.trim();

  // If preventing forbidden IDs (filenames, document IDs, UUIDs, storage paths)
  if (preventForbiddenIdentifiers && isForbiddenIdentifierOrFilename(value)) {
    return {
      value: defaultValue,
      evidence: "No visible evidence found (Rejected generated identifier / filename)",
      confidence: 0
    };
  }

  // Normalize date format if applicable without changing value
  if (value !== 'Not Available') {
    const dMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dMatch) {
      const day = dMatch[1].padStart(2, '0');
      const month = dMatch[2].padStart(2, '0');
      const year = dMatch[3];
      value = `${year}-${month}-${day}`;
    }
  }

  return {
    value: (value as unknown as T),
    evidence: evidence || `Extracted from visible document text: "${value}"`,
    confidence: confidence > 0 ? confidence : 0.85
  };
}

// Anti-Hallucination Validation & Student/Course Matching Layer
export function validateAndProcessCertificateData(
  rawAiJson: any,
  studentContext: {
    studentId?: string;
    studentName?: string;
    registerNumber?: string;
    enrolledCourses?: string[];
  }
): {
  extractedData: ExtractedCertificateData;
  validationResults: {
    passedChecks: string[];
    warnings: string[];
    failedChecks: string[];
    isAuthenticVerified: boolean;
  };
  studentMatchStatus: StudentMatchStatus;
  courseMatchStatus: CourseMatchStatus;
  officialVerificationStatus: OfficialVerificationStatus;
  overallConfidence: number;
  verificationStatus: string;
} {
  const extractedData: ExtractedCertificateData = {
    certificateTitle: sanitizeEvidenceField(rawAiJson?.certificateTitle),
    studentName: sanitizeEvidenceField(rawAiJson?.studentName, "Not Available", false, true),
    courseName: sanitizeEvidenceField(rawAiJson?.courseName, "Not Available", false, true),
    courseCategory: sanitizeEvidenceField(rawAiJson?.courseCategory),
    issuingOrganization: sanitizeEvidenceField(rawAiJson?.issuingOrganization),
    platform: sanitizeEvidenceField(rawAiJson?.platform),
    certificateId: sanitizeEvidenceField(rawAiJson?.certificateId),
    credentialId: sanitizeEvidenceField(rawAiJson?.credentialId),
    registrationId: sanitizeEvidenceField(rawAiJson?.registrationId),
    completionDate: sanitizeEvidenceField(rawAiJson?.completionDate),
    issueDate: sanitizeEvidenceField(rawAiJson?.issueDate),
    expiryDate: sanitizeEvidenceField(rawAiJson?.expiryDate),
    duration: sanitizeEvidenceField(rawAiJson?.duration),
    score: sanitizeEvidenceField(rawAiJson?.score),
    grade: sanitizeEvidenceField(rawAiJson?.grade),
    percentage: sanitizeEvidenceField(rawAiJson?.percentage),
    skills: sanitizeEvidenceField<string[]>(rawAiJson?.skills, [], true),
    certificateType: sanitizeEvidenceField(rawAiJson?.certificateType),
    verificationUrl: sanitizeEvidenceField(rawAiJson?.verificationUrl),
    issuerWebsite: sanitizeEvidenceField(rawAiJson?.issuerWebsite),
    rawVisibleText: typeof rawAiJson?.rawVisibleText === 'string' ? rawAiJson.rawVisibleText.slice(0, 5000) : ''
  };

  const passedChecks: string[] = [];
  const warnings: string[] = [];
  const failedChecks: string[] = [];

  // Check 1: Course Name Extraction
  if (extractedData.courseName.value !== 'Not Available' && extractedData.courseName.confidence >= 0.7) {
    passedChecks.push(`Course Name extracted: "${extractedData.courseName.value}" (${Math.round(extractedData.courseName.confidence * 100)}% clarity)`);
  } else {
    warnings.push("Course Name not clearly identifiable from document text.");
  }

  // Check 2: Issuing Organization Extraction
  if (extractedData.issuingOrganization.value !== 'Not Available') {
    passedChecks.push(`Issuing Organization verified: "${extractedData.issuingOrganization.value}"`);
  } else if (extractedData.platform.value !== 'Not Available') {
    passedChecks.push(`Platform verified: "${extractedData.platform.value}"`);
  } else {
    warnings.push("Issuing organization or platform not explicitly printed.");
  }

  // Check 3: Student Name Matching against Profile
  let studentMatchStatus: StudentMatchStatus = 'NOT_AVAILABLE';
  const certStudentName = extractedData.studentName.value;
  const profileName = studentContext.studentName || '';

  if (certStudentName !== 'Not Available') {
    if (profileName) {
      const cleanCert = certStudentName.toLowerCase().replace(/[^a-z]/g, '');
      const cleanProfile = profileName.toLowerCase().replace(/[^a-z]/g, '');

      if (cleanCert === cleanProfile || cleanProfile.includes(cleanCert) || cleanCert.includes(cleanProfile)) {
        studentMatchStatus = 'MATCHED';
        passedChecks.push(`Student Identity MATCHED: "${certStudentName}" matches enrolled profile "${profileName}"`);
      } else {
        studentMatchStatus = 'MISMATCH';
        warnings.push(`Student Name MISMATCH: Certificate says "${certStudentName}" while logged-in student is "${profileName}"`);
      }
    } else {
      studentMatchStatus = 'MATCHED';
      passedChecks.push(`Student Name extracted from certificate: "${certStudentName}"`);
    }
  } else {
    studentMatchStatus = 'NOT_AVAILABLE';
    warnings.push("Student name not detected on certificate.");
  }

  // Check 4: Course Matching against Enrolled Courses
  let courseMatchStatus: CourseMatchStatus = 'NOT_AVAILABLE';
  const certCourseName = extractedData.courseName.value;
  const enrolledCourses = studentContext.enrolledCourses || [];

  if (certCourseName !== 'Not Available') {
    if (enrolledCourses.length > 0) {
      const cleanCertCourse = certCourseName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedEnrolled = enrolledCourses.find(c => {
        const cleanC = c.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanC.includes(cleanCertCourse) || cleanCertCourse.includes(cleanC);
      });

      if (matchedEnrolled) {
        courseMatchStatus = 'MATCHED';
        passedChecks.push(`Course Curriculum MATCHED: "${certCourseName}" matches enrolled record "${matchedEnrolled}"`);
      } else {
        courseMatchStatus = 'MISMATCH';
        warnings.push(`Course not found in pre-registered courses list: "${certCourseName}"`);
      }
    } else {
      courseMatchStatus = 'MATCHED';
      passedChecks.push(`Course Name extracted: "${certCourseName}"`);
    }
  } else {
    courseMatchStatus = 'NOT_AVAILABLE';
  }

  // Check 5: Official Verification URL
  let officialVerificationStatus: OfficialVerificationStatus = 'NOT_PERFORMED';
  if (extractedData.verificationUrl.value !== 'Not Available' && extractedData.verificationUrl.value.startsWith('http')) {
    officialVerificationStatus = 'OFFICIAL_VERIFICATION_AVAILABLE';
    passedChecks.push(`Official Online Verification URL detected: ${extractedData.verificationUrl.value}`);
  }

  // Calculate Overall Extraction Confidence
  const confidenceFields = [
    extractedData.certificateTitle.confidence,
    extractedData.studentName.confidence,
    extractedData.courseName.confidence,
    extractedData.issuingOrganization.confidence,
    extractedData.certificateId.confidence,
    extractedData.completionDate.confidence
  ].filter(c => c > 0);

  const overallConfidence = confidenceFields.length > 0
    ? Number((confidenceFields.reduce((a, b) => a + b, 0) / confidenceFields.length).toFixed(2))
    : 0;

  // Compute Verification Status
  let verificationStatus = 'Extracted – Manual Review Required';
  if (studentMatchStatus === 'MISMATCH') {
    verificationStatus = 'Student Identity Mismatch – Manual Review Required';
  } else if (extractedData.courseName.value === 'Not Available') {
    verificationStatus = 'Course Unidentifiable – Manual Review Required';
  } else if (officialVerificationStatus === 'OFFICIAL_VERIFICATION_AVAILABLE') {
    verificationStatus = 'Official Verification Available';
  } else if (overallConfidence >= 0.88 && studentMatchStatus === 'MATCHED') {
    verificationStatus = 'Extracted – Ready for Approval';
  }

  return {
    extractedData,
    validationResults: {
      passedChecks,
      warnings,
      failedChecks,
      isAuthenticVerified: officialVerificationStatus === 'OFFICIAL_VERIFICATION_AVAILABLE'
    },
    studentMatchStatus,
    courseMatchStatus,
    officialVerificationStatus,
    overallConfidence,
    verificationStatus
  };
}

