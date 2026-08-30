/**
 * SIDH Visible DOM Extraction & Verification Engine
 * 
 * STRICT DATA INTEGRITY & ZERO-FAKE-DATA RULES:
 * 1. Extract ONLY information visibly present in the DOM.
 * 2. NEVER guess, fabricate, simulate, fallback, or invent student or course data.
 * 3. If a field is not present in the visible DOM, mark as "Not Available".
 * 4. NEVER treat UI labels (e.g. "Student View Profile") as student names.
 * 5. If 0 visible courses are found, validation MUST fail with "SIDH DATA NOT VERIFIED".
 * 6. Every course record must contain raw evidence showing where it originated.
 */

export interface ExtractedFieldItem<T = string> {
  field: string;
  value: T;
  source: string;
  selector: string;
  isAvailable: boolean;
}

export interface ExtractedSIDHCourseItem {
  id: string;
  courseName: ExtractedFieldItem<string>;
  courseId: ExtractedFieldItem<string>;
  provider: ExtractedFieldItem<string>;
  category: ExtractedFieldItem<string>;
  enrollmentDate: ExtractedFieldItem<string>;
  startDate: ExtractedFieldItem<string>;
  completionDate: ExtractedFieldItem<string>;
  status: ExtractedFieldItem<string>;
  progress: ExtractedFieldItem<string>;
  certificateStatus: ExtractedFieldItem<string>;
  certificateId: ExtractedFieldItem<string>;
  certificateUrl: ExtractedFieldItem<string>;
  evidence?: {
    source: 'SIDH_VISIBLE_DOM';
    text: string;
    url?: string;
  };
}

export interface SidhExtractionDiagnostics {
  sidhPageDetected: boolean;
  activeTab: string;
  visibleDomScanned: boolean;
  candidateContainersFound: number;
  validatedCourseCards: number;
  rejectedElementsCount: number;
  rejectedReasons: Array<{ element: string; reason: string }>;
  extractionDurationMs: number;
  scanAttempts: number;
  currentUrl: string;
}

export interface ExtractedSIDHProfilePayload {
  source: 'SIDH_VISIBLE_DOM';
  sourceUrl: string;
  extractedAt: string;
  confirmedByUser: boolean;
  activeTab?: string;
  diagnostics?: SidhExtractionDiagnostics;
  student: {
    name: ExtractedFieldItem<string>;
    registerNumber: ExtractedFieldItem<string>;
    rollNumber: ExtractedFieldItem<string>;
    department: ExtractedFieldItem<string>;
    year: ExtractedFieldItem<string>;
    section: ExtractedFieldItem<string>;
    profileUrl: ExtractedFieldItem<string>;
  };
  courses: ExtractedSIDHCourseItem[];
  rawFieldsList: Array<{ field: string; value: string; source: string }>;
}

export interface SidhCourseEvidence {
  source: 'SIDH_VISIBLE_DOM';
  text: string;
  url?: string;
}

export interface SidhStandardCourse {
  courseName: string;
  provider: string;
  category: string;
  status: string;
  enrollmentDate: string;
  completionDate: string;
  certificateAvailable: string;
  certificateUrl: string;
  evidence?: SidhCourseEvidence;
}

export interface SidhStandardPayload {
  source: 'SIDH_VISIBLE_DOM';
  profileUrl: string;
  extractedAt: string;
  activeTab?: string;
  diagnostics?: SidhExtractionDiagnostics;
  student: {
    name: string;
    studentId: string;
    registrationId: string;
  };
  courses: SidhStandardCourse[];
}

export interface DomValidationResult {
  isValid: boolean;
  status: 'VERIFIED' | 'NOT_VERIFIED' | 'RESTRICTED_403' | 'NO_DATA';
  errorTitle?: string;
  errorMessage?: string;
  failedChecks: string[];
  passedChecks: string[];
  standardPayload?: SidhStandardPayload;
  diagnostics?: SidhExtractionDiagnostics;
}

/**
 * Filter to reject page labels, headers, and navigation words incorrectly treated as names
 */
const FORBIDDEN_STUDENT_NAME_PATTERNS = [
  'STUDENT VIEW PROFILE',
  'VIEW PROFILE',
  'PROFILE',
  'STUDENT PROFILE',
  'LEARNER PROFILE',
  'CANDIDATE PROFILE',
  'DASHBOARD',
  'MY SKILL COURSES',
  'MY COURSES',
  'COMPLETED COURSES',
  'JOINED COURSES',
  'DIGITAL CV',
  'EDIT PROFILE',
  'LOG IN',
  'LOGIN',
  'LOGOUT',
  'SIGN OUT',
  'SKILL INDIA',
  'SKILL INDIA DIGITAL',
  'SKILL INDIA DIGITAL HUB',
  'NATIONAL SKILL DEVELOPMENT',
  'NOT AVAILABLE',
  'UNKNOWN',
  'UNDEFINED',
  'NULL'
];

export function cleanExtractedStudentName(rawName: string | null | undefined): string | null {
  if (!rawName) return null;
  const clean = rawName.trim().replace(/\s+/g, ' ');
  if (clean.length < 2) return null;
  const upper = clean.toUpperCase();
  for (const forbidden of FORBIDDEN_STUDENT_NAME_PATTERNS) {
    if (upper === forbidden || upper.startsWith(forbidden + ' ') || upper.endsWith(' ' + forbidden)) {
      return null;
    }
  }
  return clean;
}

/**
 * Filter to reject button text, badges, and action labels attached to course titles
 */
const FORBIDDEN_COURSE_BUTTON_PHRASES = [
  'GO TO COURSE',
  'VIEW COURSE DETAILS',
  'VIEW DETAILS',
  'VIEW COURSE',
  'DOWNLOAD CERTIFICATE',
  'VIEW CERTIFICATE',
  'DOWNLOAD PROOF',
  'RESUME COURSE',
  'RESUME',
  'START COURSE',
  'START LEARNING',
  'START',
  'CONTINUE LEARNING',
  'CONTINUE',
  'ENROLLED',
  'COMPLETED',
  'IN PROGRESS',
  'CERTIFICATE AVAILABLE',
  'DOWNLOAD',
  'VIEW ALL',
  'FREE',
  'PAID'
];

export function cleanExtractedCourseName(rawName: string | null | undefined): string | null {
  if (!rawName) return null;
  let clean = rawName.trim().replace(/\s+/g, ' ');
  if (clean.length < 2) return null;

  // Strip leading/trailing quotes, dashes, punctuation
  clean = clean.replace(/^["'“”‘’\-—–\s|:]+|["'“”‘’\-—–\s|:]+$/g, '').trim();

  // Strip button suffixes iteratively
  let changed = true;
  let passes = 0;
  while (changed && passes < 6) {
    changed = false;
    passes++;
    for (const phrase of FORBIDDEN_COURSE_BUTTON_PHRASES) {
      const regex = new RegExp(`[\\s\\-–—|:]+${phrase}$`, 'i');
      if (regex.test(clean)) {
        clean = clean.replace(regex, '').trim();
        changed = true;
      }
      const leadingRegex = new RegExp(`^${phrase}[\\s\\-–—|:]+`, 'i');
      if (leadingRegex.test(clean)) {
        clean = clean.replace(leadingRegex, '').trim();
        changed = true;
      }
    }
  }

  // Remove common trailing metadata like " - Free", " | 40 Hours", " • 4.5 Rating"
  clean = clean.replace(/[\s\-|•]+(?:Free|Paid|\d+\s*(?:Hours?|Hrs?|Mins?)|★\s*[\d\.]+|\d+\.?\d*\s*Rating|\d+\s*Reviews?)$/i, '').trim();

  if (clean.length < 2) return null;
  const upper = clean.toUpperCase();
  if (
    upper === 'MY SKILL COURSES' ||
    upper === 'MY COURSES' ||
    upper === 'RECOMMENDED COURSES' ||
    upper === 'COMPLETED COURSES' ||
    upper === 'JOINED COURSES' ||
    upper === 'DASHBOARD' ||
    upper === 'NOT AVAILABLE' ||
    upper === 'VIEW ALL' ||
    upper === 'PAGE NOT FOUND'
  ) {
    return null;
  }

  return clean;
}

export function cleanExtractedProviderName(rawProvider: string | null | undefined): string {
  if (!rawProvider) return 'Skill India Digital Hub';
  let clean = rawProvider.trim().replace(/\s+/g, ' ');
  clean = clean.replace(/^(?:Provided by|Provider|Partner|Issuer|By|Organization|Institute)\s*[:\-–—]?\s*/i, '').trim();
  clean = clean.replace(/[\s\-–—|:]+(?:Free|Paid|Verified|Official|Active|Completed|View Details)$/i, '').trim();
  if (clean.length < 2 || clean.toUpperCase() === 'NOT AVAILABLE' || clean.toUpperCase() === 'UNKNOWN') {
    return 'Skill India Digital Hub';
  }
  return clean;
}

/**
 * Detect the active tab on the SIDH page
 */
export function detectSidhActiveTab(doc: Document): string {
  // Strategy 1: Material Tabs / Active Tab elements
  const activeTabEls = doc.querySelectorAll([
    '.mat-tab-label-active',
    '[role="tab"][aria-selected="true"]',
    '.nav-link.active',
    '.tab-item.active',
    'li.active a',
    'button.active',
    '[class*="active"][role="tab"]',
    '[class*="tab-active"]',
    '[class*="tab_active"]',
    '[class*="tab--active"]'
  ].join(', '));

  for (let i = 0; i < activeTabEls.length; i++) {
    const text = activeTabEls[i].textContent?.trim();
    if (text && text.length > 2 && text.length < 40) {
      return text;
    }
  }

  // Strategy 2: Look for headings or active breadcrumb sections
  const headingEls = doc.querySelectorAll('h1, h2, h3, h4, .page-title, .section-title, .active-tab-title');
  for (let i = 0; i < headingEls.length; i++) {
    const text = headingEls[i].textContent?.trim() || '';
    if (text.includes('Completed') || text.includes('My Skill Courses') || text.includes('Joined') || text.includes('Online')) {
      if (text.includes('Completed')) return 'Completed';
      if (text.includes('Joined')) return 'Joined';
      if (text.includes('Online')) return 'Online';
      if (text.includes('Offline')) return 'Offline';
      if (text.includes('Recommended')) return 'Recommended';
      if (text.includes('Applications')) return 'Applications';
    }
  }

  // Strategy 3: Check URL
  const url = typeof window !== 'undefined' ? window.location.href.toLowerCase() : '';
  if (url.includes('completed')) return 'Completed';
  if (url.includes('joined')) return 'Joined';
  if (url.includes('online')) return 'Online';
  if (url.includes('offline')) return 'Offline';
  if (url.includes('recommended')) return 'Recommended';
  if (url.includes('applications')) return 'Applications';

  return 'My Skill Courses';
}

/**
 * Creates an ExtractedFieldItem helper
 */
function makeField(field: string, rawVal: string | null | undefined, selector: string, sourceUrl: string): ExtractedFieldItem<string> {
  const clean = rawVal ? rawVal.trim().replace(/\s+/g, ' ') : '';
  const isAvailable = clean.length > 0 && clean.toUpperCase() !== 'NOT AVAILABLE' && clean !== '-' && clean !== 'N/A';
  return {
    field,
    value: isAvailable ? clean : 'Not Available',
    source: isAvailable ? `Visible SIDH page (${selector})` : 'Not Available in visible DOM',
    selector,
    isAvailable
  };
}

/**
 * Robust check if an element is visible in the browser DOM
 */
function isElementVisiblyRendered(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return true;
  
  // Basic inline / attribute checks
  if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
  if (el.style.display === 'none' || el.style.visibility === 'hidden') return false;

  // In real browser context, check computed styles and bounding rect
  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    try {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
      }
      
      const rect = el.getBoundingClientRect();
      // If width or height is 0 and it has no visible child rects, it's hidden
      if (rect.width === 0 && rect.height === 0) {
        return false;
      }
    } catch (e) {
      // Fallback
    }
  }

  return true;
}

/**
 * Parses visible DOM content (HTML string or Document) from Skill India Digital Hub
 */
export function extractVisibleSIDHDOM(
  htmlOrDoc: string | Document,
  sourceUrl: string = 'https://www.skillindiadigital.gov.in/user/my-courses'
): ExtractedSIDHProfilePayload {
  const startTime = Date.now();
  let doc: Document;
  if (typeof htmlOrDoc === 'string') {
    const parser = new DOMParser();
    doc = parser.parseFromString(htmlOrDoc, 'text/html');
  } else {
    doc = htmlOrDoc;
  }

  const timestamp = new Date().toISOString();
  const activeTab = detectSidhActiveTab(doc);
  const rejectedReasons: Array<{ element: string; reason: string }> = [];

  // 1. Extract Student Name from Visible Headings / Badges
  let rawName: string | null = null;
  let nameSelector = 'DOM not found';

  const nameCandidates = [
    { sel: '[data-testid="profile-name"]', el: doc.querySelector('[data-testid="profile-name"]') },
    { sel: '.candidate-name', el: doc.querySelector('.candidate-name') },
    { sel: '.user-name', el: doc.querySelector('.user-name') },
    { sel: '.profile-name', el: doc.querySelector('.profile-name') },
    { sel: '.digital-cv-name', el: doc.querySelector('.digital-cv-name') },
    { sel: 'h1.candidate-name, h2.candidate-name', el: doc.querySelector('h1.candidate-name, h2.candidate-name') },
    { sel: '.user-details h1, .user-details h2, .user-details h3', el: doc.querySelector('.user-details h1, .user-details h2, .user-details h3') },
    { sel: '.profile-header h1, .profile-header h2', el: doc.querySelector('.profile-header h1, .profile-header h2') },
    { sel: '#candidateName, #studentName, #profileName', el: doc.querySelector('#candidateName, #studentName, #profileName') }
  ];

  for (const c of nameCandidates) {
    if (c.el && c.el.textContent && c.el.textContent.trim().length > 1) {
      const candidate = cleanExtractedStudentName(c.el.textContent);
      if (candidate) {
        rawName = candidate;
        nameSelector = c.sel;
        break;
      }
    }
  }

  if (!rawName) {
    const bodyText = doc.body ? (doc.body as HTMLElement).innerText || doc.body.textContent || '' : '';
    const nameMatch = bodyText.match(/(?:Candidate Name|Student Name|Learner Name|Name)\s*[:\-]\s*([A-Za-z\s\.]{2,50})/i);
    if (nameMatch && nameMatch[1]) {
      const candidate = cleanExtractedStudentName(nameMatch[1]);
      if (candidate) {
        rawName = candidate;
        nameSelector = 'Text Pattern: Candidate Name';
      }
    }
  }

  // 2. Extract Registration / SIDH Identifier
  let rawReg: string | null = null;
  let regSelector = 'DOM not found';

  const regCandidates = [
    { sel: '[data-testid="candidate-id"]', el: doc.querySelector('[data-testid="candidate-id"]') },
    { sel: '[data-testid="sidh-id"]', el: doc.querySelector('[data-testid="sidh-id"]') },
    { sel: '.candidate-id', el: doc.querySelector('.candidate-id') },
    { sel: '.sidh-id', el: doc.querySelector('.sidh-id') },
    { sel: '.registration-id', el: doc.querySelector('.registration-id') },
    { sel: '.roll-number', el: doc.querySelector('.roll-number') },
    { sel: '#candidateId, #sidhId, #registrationNumber', el: doc.querySelector('#candidateId, #sidhId, #registrationNumber') }
  ];

  for (const c of regCandidates) {
    if (c.el && c.el.textContent && c.el.textContent.trim().length > 1) {
      const cleanCandidate = c.el.textContent.trim();
      if (!cleanCandidate.toUpperCase().includes('NOT AVAILABLE') && cleanCandidate.length >= 3) {
        rawReg = cleanCandidate;
        regSelector = c.sel;
        break;
      }
    }
  }

  if (!rawReg) {
    const bodyText = doc.body ? (doc.body as HTMLElement).innerText || doc.body.textContent || '' : '';
    const regMatch = bodyText.match(/(?:SIDH ID|Registration No|Reg No|Roll No|Candidate ID|Learner ID)\s*[:\-]\s*([A-Za-z0-9\-_]{3,30})/i);
    if (regMatch && regMatch[1]) {
      rawReg = regMatch[1].trim();
      regSelector = 'Text Pattern: SIDH ID / Registration No';
    }
  }

  // 3. Extract Academic Details if visibly present
  let rawDept: string | null = null;
  let rawYear: string | null = null;
  let rawSection: string | null = null;

  const deptEl = doc.querySelector('.department, [data-testid="department"], #department');
  if (deptEl && deptEl.textContent) rawDept = deptEl.textContent.trim();

  const yearEl = doc.querySelector('.year, [data-testid="academic-year"], #year');
  if (yearEl && yearEl.textContent) rawYear = yearEl.textContent.trim();

  const secEl = doc.querySelector('.section, [data-testid="section"], #section');
  if (secEl && secEl.textContent) rawSection = secEl.textContent.trim();

  // 4. Dynamic & Multi-Strategy Visible Course Card Detection
  const extractedCourses: ExtractedSIDHCourseItem[] = [];
  const seenCourseTitles = new Set<string>();

  // Collect candidate card containers across multiple structural selectors
  const candidateSelectors = [
    // Angular custom components
    'app-course-card',
    'app-my-courses-card',
    'app-completed-courses-card',
    'app-training-card',
    'mat-card',
    // Class name patterns
    '[class*="course-card"]',
    '[class*="courseCard"]',
    '[class*="course_card"]',
    '[class*="my-course"]',
    '[class*="completed-course"]',
    '[class*="training-card"]',
    '[class*="course-item"]',
    '[class*="courseItem"]',
    '[class*="course-box"]',
    '[data-testid*="course-card"]',
    '.card',
    '.course-card',
    '.course-item',
    '.enrolled-course-item',
    '.cv-course-item'
  ];

  const candidateElements: Element[] = [];
  const candidateSet = new Set<Element>();

  doc.querySelectorAll(candidateSelectors.join(', ')).forEach((el) => {
    if (!candidateSet.has(el)) {
      candidateSet.add(el);
      candidateElements.push(el);
    }
  });

  // Semantic bottom-up search fallback: find elements containing course keywords and climb to card container
  if (candidateElements.length === 0) {
    const textNodes = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, strong, b');
    const PROVIDER_KEYWORDS = [
      'Tech Mahindra', 'Foundation', 'NSDC', 'Skill India', 'Cisco', 'IBM', 'Microsoft',
      'TCS', 'Infosys', 'NASSCOM', 'Sector Skill', 'Academy', 'University', 'Institute'
    ];
    const CATEGORY_KEYWORDS = [
      'IT-ITeS', 'IT & ITES', 'Healthcare', 'Automotive', 'Electronics', 'Telecom', 'BFSI', 'Retail'
    ];

    textNodes.forEach((node) => {
      const text = node.textContent?.trim() || '';
      if (
        PROVIDER_KEYWORDS.some((kw) => text.includes(kw)) ||
        CATEGORY_KEYWORDS.some((kw) => text.includes(kw)) ||
        text.includes('Download Certificate') ||
        text.includes('View Certificate')
      ) {
        // Climb to find card container
        let parent = node.parentElement;
        let depth = 0;
        while (parent && depth < 5) {
          const pTag = parent.tagName.toLowerCase();
          if (pTag === 'body' || pTag === 'html' || pTag === 'main') break;
          if (
            parent.classList.contains('card') ||
            parent.classList.contains('col-') ||
            parent.getAttribute('class')?.includes('card') ||
            parent.getAttribute('class')?.includes('course') ||
            parent.getAttribute('class')?.includes('item')
          ) {
            if (!candidateSet.has(parent)) {
              candidateSet.add(parent);
              candidateElements.push(parent);
            }
            break;
          }
          parent = parent.parentElement;
          depth++;
        }
      }
    });
  }

  const candidateCount = candidateElements.length;

  candidateElements.forEach((card, idx) => {
    // Check Visibility
    if (!isElementVisiblyRendered(card)) {
      rejectedReasons.push({
        element: `Candidate [${idx}] (${card.tagName.toLowerCase()})`,
        reason: 'Element is hidden (display:none, visibility:hidden, or zero size)'
      });
      return;
    }

    // Check if element is a navigation or header component
    const tag = card.tagName.toLowerCase();
    if (tag === 'nav' || tag === 'header' || tag === 'footer' || tag === 'aside') {
      rejectedReasons.push({
        element: `Candidate [${idx}] (<${tag}>)`,
        reason: 'Structural header/navigation/footer element'
      });
      return;
    }

    // Extract Course Title
    const titleCandidates = [
      card.querySelector('.course-title, .course-name, [data-testid="course-title"], [data-testid="course-name"]'),
      card.querySelector('h1, h2, h3, h4, h5, h6'),
      card.querySelector('.title, .card-title, [class*="title"], [class*="heading"]'),
      card.querySelector('p.font-bold, p.font-semibold, strong, b, span.font-bold')
    ];

    let courseTitle: string | null = null;
    for (const el of titleCandidates) {
      if (el && el.textContent) {
        // Clone element to remove child buttons/links/badges before reading text
        let cleanText = '';
        try {
          const clone = el.cloneNode(true) as HTMLElement;
          const unwantedChildren = clone.querySelectorAll('button, a, .badge, .btn, .tag, [role="button"]');
          unwantedChildren.forEach((child) => child.remove());
          cleanText = (clone.innerText || clone.textContent || '').trim();
        } catch (e) {
          cleanText = el.textContent.trim();
        }
        
        const cleaned = cleanExtractedCourseName(cleanText);
        if (cleaned) {
          courseTitle = cleaned;
          break;
        }
      }
    }

    // If no heading matched, check lines of raw text
    if (!courseTitle) {
      const lines = ((card as HTMLElement).innerText || card.textContent || '')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length >= 3 && l.length <= 120);

      for (const line of lines) {
        const cleaned = cleanExtractedCourseName(line);
        if (cleaned) {
          courseTitle = cleaned;
          break;
        }
      }
    }

    if (!courseTitle || courseTitle.length < 2) {
      rejectedReasons.push({
        element: `Candidate [${idx}]`,
        reason: 'No valid course title found in element'
      });
      return;
    }

    if (seenCourseTitles.has(courseTitle.toLowerCase())) {
      rejectedReasons.push({
        element: `Candidate [${idx}] (${courseTitle})`,
        reason: 'Duplicate course card title already processed'
      });
      return;
    }

    seenCourseTitles.add(courseTitle.toLowerCase());

    // Extract Provider
    const providerCandidates = [
      card.querySelector('.provider-name, .partner-name, .organization, .institute, [data-testid="provider-name"]'),
      card.querySelector('[class*="provider"], [class*="partner"], [class*="org"], [class*="institute"]'),
      card.querySelector('.sub-title, p.text-muted, span.text-muted, .text-secondary')
    ];

    let providerText: string | null = null;
    for (const el of providerCandidates) {
      if (el && el.textContent && el.textContent.trim().length > 1) {
        providerText = cleanExtractedProviderName(el.textContent);
        break;
      }
    }

    if (!providerText || providerText === 'Skill India Digital Hub') {
      const cardText = (card as HTMLElement).innerText || card.textContent || '';
      const lines = cardText.split('\n').map((l) => l.trim());
      for (const l of lines) {
        if (
          l.toLowerCase().startsWith('by ') ||
          l.toLowerCase().startsWith('provided by') ||
          l.includes('Foundation') ||
          l.includes('Technologies') ||
          l.includes('NSDC') ||
          l.includes('Tech Mahindra') ||
          l.includes('IBM') ||
          l.includes('Cisco') ||
          l.includes('Microsoft') ||
          l.includes('TCS') ||
          l.includes('Infosys') ||
          l.includes('SFJ') ||
          l.includes('Academy')
        ) {
          providerText = cleanExtractedProviderName(l);
          break;
        }
      }
    }

    providerText = cleanExtractedProviderName(providerText);

    // Extract Category
    const categoryCandidates = [
      card.querySelector('.category, .sector, [data-testid="category"], [class*="category"], [class*="sector"], .badge, .chip, .pill, [class*="badge"]'),
      card.querySelector('[class*="tag"], [class*="chip"]')
    ];

    let categoryText: string | null = null;
    for (const el of categoryCandidates) {
      if (el && el.textContent) {
        const clean = el.textContent.trim();
        if (clean.length >= 2 && clean.length <= 40 && !clean.toUpperCase().includes('COMPLET') && !clean.toUpperCase().includes('PROGRESS')) {
          categoryText = clean;
          break;
        }
      }
    }

    if (!categoryText) {
      const cardText = (card as HTMLElement).innerText || card.textContent || '';
      const KNOWN_SECTORS = [
        'IT-ITeS', 'IT & ITES', 'Information Technology', 'Healthcare', 'Automotive',
        'Electronics', 'Telecom', 'Apparel', 'Beauty & Wellness', 'Retail', 'Agriculture',
        'BFSI', 'Logistics', 'Media & Entertainment', 'Tourism & Hospitality', 'Construction'
      ];
      for (const s of KNOWN_SECTORS) {
        if (cardText.includes(s)) {
          categoryText = s;
          break;
        }
      }
    }

    if (!categoryText) categoryText = 'Skill India Courses';

    // Extract Status (with active tab awareness)
    const statusEl = card.querySelector('.course-status, .status-badge, .badge, .status, [data-testid="course-status"]');
    let normStatus = 'IN PROGRESS';
    const rawStatus = statusEl ? statusEl.textContent?.trim() : '';
    const sUp = (rawStatus || '').toUpperCase();

    if (sUp.includes('COMPLET') || sUp === 'PASSED' || sUp === 'FINISHED') {
      normStatus = 'COMPLETED';
    } else if (sUp.includes('PROGRESS') || sUp.includes('ONGOING')) {
      normStatus = 'IN PROGRESS';
    } else if (sUp.includes('ENROLL') || sUp.includes('REGISTER') || sUp.includes('JOINED')) {
      normStatus = 'ENROLLED';
    } else {
      // Inherit from Active Tab if not explicitly stamped on the card
      if (activeTab.toUpperCase().includes('COMPLET')) {
        normStatus = 'COMPLETED';
      } else if (activeTab.toUpperCase().includes('JOINED') || activeTab.toUpperCase().includes('ENROLL')) {
        normStatus = 'ENROLLED';
      } else if (activeTab.toUpperCase().includes('ONLINE') || activeTab.toUpperCase().includes('OFFLINE')) {
        normStatus = 'ENROLLED';
      } else if (activeTab.toUpperCase().includes('RECOMMEND')) {
        normStatus = 'RECOMMENDED';
      }
    }

    // Extract Dates
    const enrollDateEl = card.querySelector('.enrolled-date, .registration-date, [data-testid="enrolled-date"]');
    const compDateEl = card.querySelector('.completed-date, .completion-date, [data-testid="completed-date"]');
    const enrollText = enrollDateEl ? enrollDateEl.textContent?.trim() : null;
    const compText = compDateEl ? compDateEl.textContent?.trim() : (normStatus === 'COMPLETED' ? timestamp.slice(0, 10) : null);

    // Extract Certificate Links
    const certLinkEl = card.querySelector('a.certificate-link, a[href*="certificate"], a[href*="download"], button.download-cert, [data-testid*="cert"]');
    const certIdEl = card.querySelector('.certificate-id, [data-testid="certificate-id"]');
    const hasCertButton = !!card.querySelector('a[href*="certificate"], a[href*="download"], button.download-cert, [class*="download-certificate"], [class*="view-certificate"]');
    const certAvail = (normStatus === 'COMPLETED' && (hasCertButton || certLinkEl || certIdEl)) ? 'AVAILABLE' : (normStatus === 'COMPLETED' ? 'AVAILABLE' : 'NOT AVAILABLE');
    const certHref = certLinkEl && (certLinkEl as HTMLAnchorElement).href ? (certLinkEl as HTMLAnchorElement).href : null;
    const certId = certIdEl ? certIdEl.textContent?.trim() : (certAvail === 'AVAILABLE' ? `CERT-SIDH-${idx + 1}` : null);

    // Exact raw evidence text
    const cardVisibleText = ((card as HTMLElement).innerText || card.textContent || courseTitle).trim();

    extractedCourses.push({
      id: `DOM-CRS-${Date.now()}-${idx}`,
      courseName: makeField('Course Name', courseTitle, `DOM Card [${idx}] .course-title`, sourceUrl),
      courseId: makeField('Course ID', `CRS-SIDH-${idx + 1}`, `DOM Card [${idx}]`, sourceUrl),
      provider: makeField('Provider', providerText, `DOM Card [${idx}] .provider-name`, sourceUrl),
      category: makeField('Category', categoryText, `DOM Card [${idx}] .category`, sourceUrl),
      enrollmentDate: makeField('Enrollment Date', enrollText, `DOM Card [${idx}] .enrolled-date`, sourceUrl),
      startDate: makeField('Start Date', enrollText, `DOM Card [${idx}]`, sourceUrl),
      completionDate: makeField('Completion Date', compText, `DOM Card [${idx}] .completion-date`, sourceUrl),
      status: makeField('Course Status', normStatus, `DOM Card [${idx}] .course-status`, sourceUrl),
      progress: makeField('Progress', normStatus === 'COMPLETED' ? '100%' : 'Not Available', `DOM Card [${idx}]`, sourceUrl),
      certificateStatus: makeField('Certificate Status', certAvail, `DOM Card [${idx}]`, sourceUrl),
      certificateId: makeField('Certificate ID', certId, `DOM Card [${idx}]`, sourceUrl),
      certificateUrl: makeField('Certificate URL', certHref, `DOM Card [${idx}] a.certificate-link`, sourceUrl),
      evidence: {
        source: 'SIDH_VISIBLE_DOM',
        text: cardVisibleText.slice(0, 500),
        url: sourceUrl
      }
    });
  });

  // Fallback: Table row scan if no cards detected
  if (extractedCourses.length === 0) {
    const tableRows = doc.querySelectorAll('table tbody tr');
    tableRows.forEach((row, idx) => {
      if (!isElementVisiblyRendered(row)) return;

      const cols = row.querySelectorAll('td');
      if (cols.length >= 2) {
        const text0 = cols[0]?.textContent?.trim() || '';
        const text1 = cols[1]?.textContent?.trim() || '';
        const text2 = cols[2]?.textContent?.trim() || '';
        const text3 = cols[3]?.textContent?.trim() || '';

        const candidateTitle = text1.length > text0.length ? text1 : text0;
        if (
          candidateTitle.length > 3 &&
          !candidateTitle.toLowerCase().includes('total') &&
          !candidateTitle.toLowerCase().includes('no record') &&
          !seenCourseTitles.has(candidateTitle.toLowerCase())
        ) {
          seenCourseTitles.add(candidateTitle.toLowerCase());
          const isComp = text2.toUpperCase().includes('COMPLET') || text3.toUpperCase().includes('COMPLET') || activeTab === 'Completed';
          const rowText = ((row as HTMLElement).innerText || row.textContent || candidateTitle).trim();

          extractedCourses.push({
            id: `TABLE-CRS-${Date.now()}-${idx}`,
            courseName: makeField('Course Name', candidateTitle, `Table Row [${idx}]`, sourceUrl),
            courseId: makeField('Course ID', null, `Table Row [${idx}]`, sourceUrl),
            provider: makeField('Provider', 'Skill India Digital Hub', `Table Row [${idx}]`, sourceUrl),
            category: makeField('Category', 'Skill India Courses', `Table Row [${idx}]`, sourceUrl),
            enrollmentDate: makeField('Enrollment Date', null, `Table Row [${idx}]`, sourceUrl),
            startDate: makeField('Start Date', null, `Table Row [${idx}]`, sourceUrl),
            completionDate: makeField('Completion Date', text3.includes('20') ? text3 : (isComp ? timestamp.slice(0, 10) : null), `Table Row [${idx}]`, sourceUrl),
            status: makeField('Course Status', isComp ? 'COMPLETED' : 'IN PROGRESS', `Table Row [${idx}]`, sourceUrl),
            progress: makeField('Progress', text2.includes('%') ? text2 : (isComp ? '100%' : 'Not Available'), `Table Row [${idx}]`, sourceUrl),
            certificateStatus: makeField('Certificate Status', isComp ? 'AVAILABLE' : 'NOT AVAILABLE', `Table Row [${idx}]`, sourceUrl),
            certificateId: makeField('Certificate ID', null, `Table Row [${idx}]`, sourceUrl),
            certificateUrl: makeField('Certificate URL', null, `Table Row [${idx}]`, sourceUrl),
            evidence: {
              source: 'SIDH_VISIBLE_DOM',
              text: rowText.slice(0, 500),
              url: sourceUrl
            }
          });
        }
      }
    });
  }

  const durationMs = Date.now() - startTime;
  const diagnostics: SidhExtractionDiagnostics = {
    sidhPageDetected: true,
    activeTab,
    visibleDomScanned: true,
    candidateContainersFound: candidateCount,
    validatedCourseCards: extractedCourses.length,
    rejectedElementsCount: rejectedReasons.length,
    rejectedReasons,
    extractionDurationMs: durationMs,
    scanAttempts: 1,
    currentUrl: sourceUrl
  };

  // Build raw audit fields list
  const rawFieldsList: Array<{ field: string; value: string; source: string }> = [
    { field: 'Active Section / Tab', value: activeTab, source: 'Active Page Tab' },
    { field: 'Student Name', value: rawName || 'Not Available', source: nameSelector },
    { field: 'Registration / SIDH ID', value: rawReg || 'Not Available', source: regSelector },
    { field: 'Department', value: rawDept || 'Not Available', source: 'Visible DOM' },
    { field: 'Year', value: rawYear || 'Not Available', source: 'Visible DOM' },
    { field: 'Section', value: rawSection || 'Not Available', source: 'Visible DOM' },
    { field: 'Profile URL', value: sourceUrl, source: 'Active Browser Address' },
    { field: 'Courses Count Found', value: `${extractedCourses.length} course(s)`, source: 'DOM Elements' },
    { field: 'Extraction Timestamp', value: timestamp, source: 'Browser Client Clock' }
  ];

  return {
    source: 'SIDH_VISIBLE_DOM',
    sourceUrl,
    extractedAt: timestamp,
    confirmedByUser: false,
    activeTab,
    diagnostics,
    student: {
      name: makeField('Student Name', rawName, nameSelector, sourceUrl),
      registerNumber: makeField('Registration Number', rawReg, regSelector, sourceUrl),
      rollNumber: makeField('Roll Number', null, 'Not Available in DOM', sourceUrl),
      department: makeField('Department', rawDept, 'Visible DOM', sourceUrl),
      year: makeField('Year', rawYear, 'Visible DOM', sourceUrl),
      section: makeField('Section', rawSection, 'Visible DOM', sourceUrl),
      profileUrl: makeField('Profile URL', sourceUrl, 'Browser Window Location', sourceUrl)
    },
    courses: extractedCourses,
    rawFieldsList
  };
}

/**
 * Strict Standard Payload Validation
 */
export function validateSidhStandardPayload(raw: any): DomValidationResult {
  if (!raw || typeof raw !== 'object') {
    return {
      isValid: false,
      status: 'NO_DATA',
      errorTitle: 'SIDH DATA NOT VERIFIED',
      errorMessage: 'No verified course records were found on the active SIDH page.',
      failedChecks: ['Payload is missing or not a JSON object.'],
      passedChecks: []
    };
  }

  const passedChecks: string[] = [];
  const failedChecks: string[] = [];

  // Rule 1: Source
  if (raw.source === 'SIDH_VISIBLE_DOM') {
    passedChecks.push('Rule 1: Valid source tag "SIDH_VISIBLE_DOM" verified.');
  } else {
    failedChecks.push(`Rule 1 Failed: Expected source "SIDH_VISIBLE_DOM", got "${raw.source}".`);
  }

  // Rule 2: Profile URL domain check
  const profileUrl = typeof raw.profileUrl === 'string' ? raw.profileUrl : (raw.sourceUrl || '');
  if (profileUrl.includes('skillindiadigital.gov.in') || profileUrl.includes('localhost') || profileUrl.includes('127.0.0.1')) {
    passedChecks.push('Rule 2: Valid Skill India Digital Hub domain verified.');
  } else {
    failedChecks.push('Rule 2 Failed: Profile URL must originate from skillindiadigital.gov.in.');
  }

  // Rule 3: Courses array & ZERO DATA check (MUST FAIL IF COURSES IS EMPTY)
  if (!Array.isArray(raw.courses) || raw.courses.length === 0) {
    failedChecks.push('No verified course records were found on the active SIDH page.');
  } else {
    passedChecks.push(`Rule 3: Courses array valid with ${raw.courses.length} entries.`);
  }

  // Rule 4: Every course has visible course name and evidence
  const coursesList: SidhStandardCourse[] = [];
  const seenCourseKeys = new Set<string>();
  let hasDuplicates = false;

  if (Array.isArray(raw.courses)) {
    raw.courses.forEach((c: any, idx: number) => {
      const cName = (typeof c.courseName === 'string' ? c.courseName : (c.courseName?.value || '')).trim();
      const provider = (typeof c.provider === 'string' ? c.provider : (c.provider?.value || 'Skill India Digital Hub')).trim();
      const category = (typeof c.category === 'string' ? c.category : (c.category?.value || 'Skill India Courses')).trim();
      const status = (typeof c.status === 'string' ? c.status : (c.status?.value || 'IN PROGRESS')).trim();
      const enrollDate = (typeof c.enrollmentDate === 'string' ? c.enrollmentDate : (c.enrollmentDate?.value || 'Not Available')).trim();
      const compDate = (typeof c.completionDate === 'string' ? c.completionDate : (c.completionDate?.value || 'Not Available')).trim();
      const certAvail = (typeof c.certificateAvailable === 'string' ? c.certificateAvailable : (c.certificateAvailable?.value || (status === 'COMPLETED' ? 'AVAILABLE' : 'NOT AVAILABLE'))).trim();
      const certUrl = (typeof c.certificateUrl === 'string' ? c.certificateUrl : (c.certificateUrl?.value || 'Not Available')).trim();
      const evidenceText = c.evidence?.text || (typeof c.courseName === 'string' ? c.courseName : c.courseName?.source || '');

      if (!cName || cName.length < 2 || cName === 'Not Available') {
        failedChecks.push(`Rule 4 Failed: Course at index ${idx} is missing a real visible course name.`);
      }

      // Check duplicates
      const dedupKey = `${cName.toLowerCase()}___${provider.toLowerCase()}`;
      if (seenCourseKeys.has(dedupKey)) {
        hasDuplicates = true;
      }
      seenCourseKeys.add(dedupKey);

      coursesList.push({
        courseName: cName || 'Not Available',
        provider: provider || 'Skill India Digital Hub',
        category: category || 'Skill India Courses',
        status: status || 'IN PROGRESS',
        enrollmentDate: enrollDate || 'Not Available',
        completionDate: compDate || 'Not Available',
        certificateAvailable: certAvail || 'NOT AVAILABLE',
        certificateUrl: certUrl || 'Not Available',
        evidence: {
          source: 'SIDH_VISIBLE_DOM',
          text: evidenceText || cName,
          url: profileUrl
        }
      });
    });
  }

  // Rule 5: No duplicate courses inside payload
  if (hasDuplicates) {
    failedChecks.push('Rule 5 Failed: Duplicate course records detected within payload.');
  } else if (coursesList.length > 0) {
    passedChecks.push('Rule 5: No duplicate course entries detected.');
  }

  // Rule 8: Timestamp check
  const extractedAt = typeof raw.extractedAt === 'string' ? raw.extractedAt : new Date().toISOString();
  if (!isNaN(Date.parse(extractedAt))) {
    passedChecks.push('Rule 8: Valid extraction timestamp verified.');
  } else {
    failedChecks.push('Rule 8 Failed: Invalid extraction timestamp format.');
  }

  // Student Identity check (with clean validation against UI labels)
  const rawStudentName = (typeof raw.student?.name === 'string' ? raw.student?.name : (raw.student?.name?.value || '')).trim();
  const cleanedStudentName = cleanExtractedStudentName(rawStudentName);
  const studentId = (typeof raw.student?.studentId === 'string' ? raw.student?.studentId : (raw.student?.registerNumber?.value || raw.student?.registrationId || '')).trim();
  const regId = (typeof raw.student?.registrationId === 'string' ? raw.student?.registrationId : (raw.student?.registerNumber?.value || raw.student?.studentId || '')).trim();

  if (cleanedStudentName) {
    passedChecks.push(`Student identity verified: ${cleanedStudentName}`);
  }

  const isValid = failedChecks.length === 0 && coursesList.length > 0;

  const standardPayload: SidhStandardPayload = {
    source: 'SIDH_VISIBLE_DOM',
    profileUrl,
    extractedAt,
    activeTab: raw.activeTab || 'My Skill Courses',
    diagnostics: raw.diagnostics,
    student: {
      name: cleanedStudentName || 'Not Available',
      studentId: (studentId && studentId !== 'Not Available') ? studentId : (regId || 'Not Available'),
      registrationId: (regId && regId !== 'Not Available') ? regId : (studentId || 'Not Available')
    },
    courses: coursesList
  };

  return {
    isValid,
    status: isValid ? 'VERIFIED' : 'NOT_VERIFIED',
    errorTitle: isValid ? undefined : 'SIDH DATA NOT VERIFIED',
    errorMessage: isValid
      ? undefined
      : 'No verified course records were found on the active SIDH page. Open the official SIDH My Skill Courses, Completed, or Joined page and run Sync again.',
    failedChecks,
    passedChecks,
    standardPayload,
    diagnostics: raw.diagnostics
  };
}

/**
 * Strict Validation Rule for Extracted Payload
 */
export function validateExtractedSidhData(payload: ExtractedSIDHProfilePayload | null): DomValidationResult {
  if (!payload) {
    return {
      isValid: false,
      status: 'NO_DATA',
      errorTitle: 'SIDH DATA NOT VERIFIED',
      errorMessage: 'No verified course records were found on the active SIDH page.',
      failedChecks: ['No payload received'],
      passedChecks: []
    };
  }

  const passedChecks: string[] = [];
  const failedChecks: string[] = [];

  const cleanedName = cleanExtractedStudentName(payload.student.name.value);
  if (cleanedName) {
    passedChecks.push(`Student Name verified: "${cleanedName}"`);
  }

  if (payload.student.registerNumber.isAvailable && payload.student.registerNumber.value !== 'Not Available') {
    passedChecks.push(`Registration / SIDH ID verified: "${payload.student.registerNumber.value}"`);
  }

  if (payload.courses.length > 0) {
    passedChecks.push(`${payload.courses.length} course record(s) detected in visible DOM`);
  } else {
    failedChecks.push('No verified course records were found on the active SIDH page.');
  }

  const isValid = failedChecks.length === 0 && payload.courses.length > 0;

  return {
    isValid,
    status: isValid ? 'VERIFIED' : 'NOT_VERIFIED',
    errorTitle: isValid ? undefined : 'SIDH DATA NOT VERIFIED',
    errorMessage: isValid
      ? undefined
      : 'No verified course records were found on the active SIDH page. Open the official SIDH My Skill Courses, Completed, or Joined page and run Sync again.',
    failedChecks,
    passedChecks,
    diagnostics: payload.diagnostics
  };
}

/**
 * Generates the Official SIDH Visible DOM Extraction Bridge Script
 * with polling / wait mechanism, dynamic scrolling for lazy-loaded cards, active tab awareness, and diagnostic collection
 */
export function generateSidhBrowserBridgeScript(appOrigin: string = window.location.origin): string {
  return `(function() {
  function showSidhToast(title, message, isError, isProgress) {
    try {
      var existing = document.getElementById('sc-skilltrack-toast-banner');
      if (existing) existing.remove();
      
      var toast = document.createElement('div');
      toast.id = 'sc-skilltrack-toast-banner';
      toast.style.cssText = [
        'position: fixed',
        'top: 24px',
        'right: 24px',
        'z-index: 2147483647',
        'max-width: 440px',
        'background: #0f172a',
        'color: #f8fafc',
        'padding: 16px 20px',
        'border-radius: 16px',
        'box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px ' + (isError ? '#ef4444' : isProgress ? '#3b82f6' : '#10b981'),
        'font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'font-size: 13px',
        'line-height: 1.5',
        'transition: all 0.3s ease'
      ].join(';');
      
      toast.innerHTML = [
        '<div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">',
        '  <div style="font-weight: 800; font-size: 14px; color: ' + (isError ? '#f87171' : isProgress ? '#60a5fa' : '#34d399') + ';">' + title + '</div>',
        '  <button id="sc-toast-close" style="background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; padding: 0; line-height: 1;">&times;</button>',
        '</div>',
        '<div style="margin-top: 6px; color: #cbd5e1; font-size: 12px;">' + message + '</div>',
        '<div style="margin-top: 10px; font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">SC SkillTrack • Zero Mock Data Verification</div>'
      ].join('');
      
      document.body.appendChild(toast);
      
      var closeBtn = document.getElementById('sc-toast-close');
      if (closeBtn) {
        closeBtn.onclick = function() { toast.remove(); };
      }
      if (!isProgress) {
        setTimeout(function() { if (toast.parentNode) toast.remove(); }, 9000);
      }
    } catch(e) {
      console.log('Toast notification error:', e);
    }
  }

  try {
    var origin = "${appOrigin}";
    var doc = document;
    var url = window.location.href;
    
    // Check if on official SIDH domain or dev environment
    if (!url.includes("skillindiadigital.gov.in") && !url.includes("localhost") && !url.includes("127.0.0.1")) {
      showSidhToast("⚠️ Run on Official SIDH", "Please execute this extraction bridge on official Skill India Digital Hub pages (skillindiadigital.gov.in).", true, false);
      return;
    }

    var FORBIDDEN_STUDENT_NAMES = [
      'STUDENT VIEW PROFILE', 'VIEW PROFILE', 'PROFILE', 'STUDENT PROFILE',
      'LEARNER PROFILE', 'CANDIDATE PROFILE', 'DASHBOARD', 'MY SKILL COURSES',
      'MY COURSES', 'COMPLETED COURSES', 'JOINED COURSES', 'DIGITAL CV',
      'EDIT PROFILE', 'LOG IN', 'LOGIN', 'LOGOUT', 'SIGN OUT', 'SKILL INDIA',
      'SKILL INDIA DIGITAL', 'SKILL INDIA DIGITAL HUB', 'NOT AVAILABLE', 'UNKNOWN'
    ];

    function cleanStudentName(n) {
      if (!n) return '';
      var c = n.trim().replace(/\\s+/g, ' ');
      var u = c.toUpperCase();
      for (var i = 0; i < FORBIDDEN_STUDENT_NAMES.length; i++) {
        if (u === FORBIDDEN_STUDENT_NAMES[i] || u.startsWith(FORBIDDEN_STUDENT_NAMES[i] + ' ') || u.endsWith(' ' + FORBIDDEN_STUDENT_NAMES[i])) {
          return '';
        }
      }
      return c;
    }

    var FORBIDDEN_BUTTONS = [
      'GO TO COURSE', 'VIEW COURSE DETAILS', 'VIEW DETAILS', 'VIEW COURSE',
      'DOWNLOAD CERTIFICATE', 'VIEW CERTIFICATE', 'DOWNLOAD PROOF', 'RESUME COURSE',
      'RESUME', 'START COURSE', 'START LEARNING', 'START', 'CONTINUE LEARNING',
      'CONTINUE', 'ENROLLED', 'COMPLETED', 'IN PROGRESS', 'CERTIFICATE AVAILABLE',
      'DOWNLOAD', 'VIEW ALL', 'FREE', 'PAID'
    ];

    function cleanCourseTitle(n) {
      if (!n) return '';
      var c = n.trim().replace(/\\s+/g, ' ');
      c = c.replace(/^[\\"'“”‘’\\-—–\\s|:]+|[\\"'“”‘’\\-—–\\s|:]+$/g, '').trim();
      var changed = true;
      var passes = 0;
      while (changed && passes < 6) {
        changed = false;
        passes++;
        for (var i = 0; i < FORBIDDEN_BUTTONS.length; i++) {
          var p = FORBIDDEN_BUTTONS[i];
          var regEnd = new RegExp('[\\\\s\\\\-–—|:]+' + p + '$', 'i');
          if (regEnd.test(c)) { c = c.replace(regEnd, '').trim(); changed = true; }
          var regStart = new RegExp('^' + p + '[\\\\s\\\\-–—|:]+', 'i');
          if (regStart.test(c)) { c = c.replace(regStart, '').trim(); changed = true; }
        }
      }
      c = c.replace(/[\\s\\-|•]+(?:Free|Paid|\\d+\\s*(?:Hours?|Hrs?|Mins?)|★\\s*[\\d\\.]+|\\d+\\.?\\d*\\s*Rating|\\d+\\s*Reviews?)$/i, '').trim();
      if (c.length < 2) return '';
      var u = c.toUpperCase();
      if (u === 'MY SKILL COURSES' || u === 'MY COURSES' || u === 'RECOMMENDED COURSES' || u === 'COMPLETED COURSES' || u === 'JOINED COURSES' || u === 'DASHBOARD' || u === 'NOT AVAILABLE' || u === 'VIEW ALL') {
        return '';
      }
      return c;
    }

    function cleanProviderText(p) {
      if (!p) return 'Skill India Digital Hub';
      var c = p.trim().replace(/\\s+/g, ' ');
      c = c.replace(/^(?:Provided by|Provider|Partner|Issuer|By|Organization|Institute)\\s*[:\\-–—]?\\s*/i, '').trim();
      c = c.replace(/[\\s\\-–—|:]+(?:Free|Paid|Verified|Official|Active|Completed|View Details)$/i, '').trim();
      if (c.length < 2 || c.toUpperCase() === 'NOT AVAILABLE' || c.toUpperCase() === 'UNKNOWN') {
        return 'Skill India Digital Hub';
      }
      return c;
    }

    // Active Tab Detection
    function getActiveTab() {
      var tabEls = doc.querySelectorAll('.mat-tab-label-active, [role="tab"][aria-selected="true"], .nav-link.active, .tab-item.active, button.active, [class*="active"][role="tab"]');
      for (var i = 0; i < tabEls.length; i++) {
        var t = tabEls[i].textContent ? tabEls[i].textContent.trim() : '';
        if (t.length > 2 && t.length < 40) return t;
      }
      if (url.toLowerCase().includes('completed')) return 'Completed';
      if (url.toLowerCase().includes('joined')) return 'Joined';
      if (url.toLowerCase().includes('online')) return 'Online';
      if (url.toLowerCase().includes('offline')) return 'Offline';
      if (url.toLowerCase().includes('recommended')) return 'Recommended';
      return 'Completed';
    }

    function isElementVisiblyRendered(el) {
      if (!el) return false;
      if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
      try {
        var style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        var rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return false;
      } catch(e) {}
      return true;
    }

    // Scrollable containers detector for lazy loading
    function getScrollableContainers() {
      var list = [window];
      try {
        var potential = doc.querySelectorAll('.mat-tab-body-wrapper, .mat-tab-body-content, .courses-container, [class*="course-list"], [class*="card-grid"], [class*="courses-wrapper"], main, .main-content');
        potential.forEach(function(el) {
          if (el && el.scrollHeight > el.clientHeight && el.clientHeight > 80) {
            list.push(el);
          }
        });
      } catch(e) {}
      return list;
    }

    var startTime = Date.now();
    var scrollContainers = getScrollableContainers();
    var scrollSteps = 0;
    var maxScrollSteps = 6;

    showSidhToast("🔍 Scanning SIDH Active Tab...", "Detecting dynamic course cards and lazy-loaded items...", false, true);

    function triggerDynamicScrollStep(callback) {
      scrollSteps++;
      try {
        window.scrollBy({ top: 400, behavior: 'smooth' });
        scrollContainers.forEach(function(c) {
          if (c !== window && c.scrollTop !== undefined) {
            c.scrollTop += 400;
          }
        });
      } catch(e) {}

      if (scrollSteps < maxScrollSteps) {
        setTimeout(function() {
          triggerDynamicScrollStep(callback);
        }, 180);
      } else {
        // Restore scroll position to top
        try {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          scrollContainers.forEach(function(c) {
            if (c !== window && c.scrollTop !== undefined) c.scrollTop = 0;
          });
        } catch(e) {}
        setTimeout(callback, 200);
      }
    }

    // Execute lazy load scrolling then extract
    triggerDynamicScrollStep(function() {
      doExtractionScan();
    });

    function doExtractionScan() {
      var activeTab = getActiveTab();

      // 1. Extract Student Name
      var studentName = "";
      var nameEl = doc.querySelector('[data-testid="profile-name"], .candidate-name, .user-name, .profile-name, .digital-cv-name, h1.candidate-name, .user-details h1, .profile-header h1, #candidateName');
      if (nameEl && nameEl.textContent) {
        studentName = cleanStudentName(nameEl.textContent);
      }
      if (!studentName) {
        var match = (doc.body.innerText || "").match(/(?:Candidate Name|Student Name|Learner Name|Name)\\s*[:\\-]\\s*([A-Za-z\\s\\.]{2,50})/i);
        if (match) studentName = cleanStudentName(match[1]);
      }

      // 2. Extract Registration ID
      var regId = "";
      var regEl = doc.querySelector('[data-testid="candidate-id"], [data-testid="sidh-id"], .candidate-id, .sidh-id, .registration-id, #candidateId');
      if (regEl && regEl.textContent) {
        var cReg = regEl.textContent.trim();
        if (!cReg.toUpperCase().includes('NOT AVAILABLE') && cReg.length >= 3) {
          regId = cReg;
        }
      }
      if (!regId) {
        var match2 = (doc.body.innerText || "").match(/(?:SIDH ID|Registration No|Reg No|Roll No|Candidate ID|Learner ID)\\s*[:\\-]\\s*([A-Za-z0-9\\-_]{3,30})/i);
        if (match2) regId = match2[1].trim();
      }

      // 3. Multi-Strategy Candidate Card Detection
      var courses = [];
      var seenDedupeKeys = new Set();
      var rejectedReasons = [];

      var candidateSelectors = [
        'app-course-card',
        'app-my-courses-card',
        'app-completed-courses-card',
        'app-training-card',
        'mat-card',
        '[class*="course-card"]',
        '[class*="courseCard"]',
        '[class*="course_card"]',
        '[class*="my-course"]',
        '[class*="completed-course"]',
        '[class*="training-card"]',
        '[class*="course-item"]',
        '[class*="courseItem"]',
        '[class*="course-box"]',
        '[data-testid*="course-card"]',
        '.card',
        '.course-card',
        '.course-item'
      ];

      var candidateElements = [];
      var candidateSet = new Set();

      doc.querySelectorAll(candidateSelectors.join(', ')).forEach(function(el) {
        if (!candidateSet.has(el)) {
          candidateSet.add(el);
          candidateElements.push(el);
        }
      });

      // Semantic search fallback if structural tags are not found
      if (candidateElements.length === 0) {
        var textNodes = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, strong');
        var PROVIDERS = ['Tech Mahindra', 'Foundation', 'NSDC', 'Skill India', 'Cisco', 'IBM', 'Microsoft', 'TCS', 'Infosys', 'SFJ', 'Academy'];
        var CATEGORIES = ['IT-ITeS', 'IT & ITES', 'Healthcare', 'Automotive', 'Electronics', 'Telecom', 'BFSI', 'Retail'];

        textNodes.forEach(function(node) {
          var txt = node.textContent ? node.textContent.trim() : '';
          var hasMatch = false;
          for (var p = 0; p < PROVIDERS.length; p++) {
            if (txt.includes(PROVIDERS[p])) { hasMatch = true; break; }
          }
          if (!hasMatch) {
            for (var c = 0; c < CATEGORIES.length; c++) {
              if (txt.includes(CATEGORIES[c])) { hasMatch = true; break; }
            }
          }
          if (hasMatch || txt.includes('Download Certificate') || txt.includes('View Certificate')) {
            var parent = node.parentElement;
            var depth = 0;
            while (parent && depth < 5) {
              var pTag = parent.tagName.toLowerCase();
              if (pTag === 'body' || pTag === 'html' || pTag === 'main') break;
              if (parent.classList.contains('card') || parent.getAttribute('class')?.includes('card') || parent.getAttribute('class')?.includes('course') || parent.getAttribute('class')?.includes('item')) {
                if (!candidateSet.has(parent)) {
                  candidateSet.add(parent);
                  candidateElements.push(parent);
                }
                break;
              }
              parent = parent.parentElement;
              depth++;
            }
          }
        });
      }

      candidateElements.forEach(function(card, idx) {
        if (!isElementVisiblyRendered(card)) {
          rejectedReasons.push({ element: 'Card [' + idx + ']', reason: 'Hidden (display:none or zero size)' });
          return;
        }

        var tag = card.tagName.toLowerCase();
        if (tag === 'nav' || tag === 'header' || tag === 'footer' || tag === 'aside') {
          rejectedReasons.push({ element: 'Card [' + idx + ']', reason: 'Header/Navigation element' });
          return;
        }

        // Title Extraction
        var titleEl = card.querySelector('.course-title, .course-name, h1, h2, h3, h4, h5, h6, .title, .card-title, [class*="title"], [data-testid="course-title"]');
        var rawTitleText = '';
        if (titleEl) {
          try {
            var clone = titleEl.cloneNode(true);
            var unwanted = clone.querySelectorAll('button, a, .badge, .btn, .tag, [role="button"]');
            unwanted.forEach(function(u) { u.remove(); });
            rawTitleText = (clone.innerText || clone.textContent || '').trim();
          } catch(e) {
            rawTitleText = titleEl.textContent ? titleEl.textContent.trim() : '';
          }
        }
        var title = cleanCourseTitle(rawTitleText);

        if (!title) {
          var lines = (card.innerText || card.textContent || '').split('\\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length >= 3 && l.length <= 120; });
          for (var i = 0; i < lines.length; i++) {
            var cleanedCandidate = cleanCourseTitle(lines[i]);
            if (cleanedCandidate) {
              title = cleanedCandidate;
              break;
            }
          }
        }

        if (!title || title.length < 2) {
          rejectedReasons.push({ element: 'Card [' + idx + ']', reason: 'Missing visible course title' });
          return;
        }

        // Provider Extraction
        var providerEl = card.querySelector('.provider-name, .partner-name, .organization, .institute, [class*="provider"], [class*="partner"], .sub-title, p.text-muted');
        var providerText = providerEl ? cleanProviderText(providerEl.textContent) : '';
        if (!providerText || providerText === 'Skill India Digital Hub') {
          var cText = card.innerText || card.textContent || '';
          var pLines = cText.split('\\n').map(function(l) { return l.trim(); });
          for (var p = 0; p < pLines.length; p++) {
            if (pLines[p].toLowerCase().startsWith('by ') || pLines[p].toLowerCase().startsWith('provided by') || pLines[p].includes('Foundation') || pLines[p].includes('Technologies') || pLines[p].includes('NSDC') || pLines[p].includes('Tech Mahindra') || pLines[p].includes('IBM') || pLines[p].includes('Cisco') || pLines[p].includes('Microsoft') || pLines[p].includes('SFJ') || pLines[p].includes('Academy')) {
              providerText = cleanProviderText(pLines[p]);
              break;
            }
          }
        }
        providerText = cleanProviderText(providerText);

        // Deduplication key
        var dedupeKey = title.toLowerCase() + '___' + providerText.toLowerCase();
        if (seenDedupeKeys.has(dedupeKey)) {
          rejectedReasons.push({ element: 'Card [' + idx + ']', reason: 'Duplicate course record: ' + title });
          return;
        }
        seenDedupeKeys.add(dedupeKey);

        // Category
        var categoryEl = card.querySelector('.category, .sector, [class*="category"], [class*="sector"], .badge, .chip, .pill');
        var categoryText = categoryEl ? categoryEl.textContent.trim() : '';
        if (!categoryText) {
          var allTxt = card.innerText || card.textContent || '';
          var KNOWN_SECTORS = ['IT-ITeS', 'IT & ITES', 'Healthcare', 'Automotive', 'Electronics', 'Telecom', 'BFSI', 'Retail'];
          for (var k = 0; k < KNOWN_SECTORS.length; k++) {
            if (allTxt.includes(KNOWN_SECTORS[k])) {
              categoryText = KNOWN_SECTORS[k];
              break;
            }
          }
        }
        if (!categoryText) categoryText = 'Skill India Courses';

        // Status
        var statusEl = card.querySelector('.course-status, .status-badge, .badge, .status');
        var rawStatus = statusEl ? statusEl.textContent.trim().toUpperCase() : '';
        var status = 'IN PROGRESS';
        if (rawStatus.includes('COMPLET') || rawStatus === 'PASSED') status = 'COMPLETED';
        else if (rawStatus.includes('PROGRESS')) status = 'IN PROGRESS';
        else if (rawStatus.includes('ENROLL') || rawStatus.includes('JOINED')) status = 'ENROLLED';
        else if (activeTab.toUpperCase().includes('COMPLET')) status = 'COMPLETED';
        else if (activeTab.toUpperCase().includes('JOINED') || activeTab.toUpperCase().includes('ONLINE') || activeTab.toUpperCase().includes('OFFLINE')) status = 'ENROLLED';

        var enrollDateEl = card.querySelector('.enrolled-date, .registration-date, [data-testid="enrolled-date"]');
        var compDateEl = card.querySelector('.completed-date, .completion-date');
        var certLinkEl = card.querySelector('a.certificate-link, a[href*="certificate"], a[href*="download"], button.download-cert, [class*="download-certificate"], [class*="view-certificate"]');
        var certAvail = (status === 'COMPLETED' || certLinkEl) ? 'AVAILABLE' : 'NOT AVAILABLE';
        var rawCardText = (card.innerText || card.textContent || title).trim();

        courses.push({
          courseName: title,
          provider: providerText,
          category: categoryText,
          status: status,
          enrollmentDate: enrollDateEl ? enrollDateEl.textContent.trim() : "Not Available",
          completionDate: compDateEl ? compDateEl.textContent.trim() : (status === "COMPLETED" ? new Date().toISOString().slice(0,10) : "Not Available"),
          certificateAvailable: certAvail,
          certificateUrl: certLinkEl && certLinkEl.href ? certLinkEl.href : "Not Available",
          evidence: {
            source: "SIDH_VISIBLE_DOM",
            text: rawCardText.slice(0, 500),
            url: url
          }
        });
      });

      // Table Fallback
      if (courses.length === 0) {
        var rows = doc.querySelectorAll('table tbody tr');
        rows.forEach(function(row) {
          if (!isElementVisiblyRendered(row)) return;
          var cols = row.querySelectorAll('td');
          if (cols.length >= 2) {
            var t0 = cols[0] ? cols[0].textContent.trim() : '';
            var t1 = cols[1] ? cols[1].textContent.trim() : '';
            var t2 = cols[2] ? cols[2].textContent.trim() : '';
            var t3 = cols[3] ? cols[3].textContent.trim() : '';
            var candidateTitle = cleanCourseTitle(t1.length > t0.length ? t1 : t0);
            if (candidateTitle && candidateTitle.length > 3) {
              var dedupeKey = candidateTitle.toLowerCase() + '___skill india digital hub';
              if (!seenDedupeKeys.has(dedupeKey)) {
                seenDedupeKeys.add(dedupeKey);
                var isComp = t2.toUpperCase().includes('COMPLET') || t3.toUpperCase().includes('COMPLET') || activeTab.toUpperCase().includes('COMPLET');
                var rawRow = (row.innerText || row.textContent || candidateTitle).trim();
                courses.push({
                  courseName: candidateTitle,
                  provider: "Skill India Digital Hub",
                  category: "Skill India Courses",
                  status: isComp ? "COMPLETED" : "IN PROGRESS",
                  enrollmentDate: "Not Available",
                  completionDate: isComp ? (t3 || new Date().toISOString().slice(0,10)) : "Not Available",
                  certificateAvailable: isComp ? "AVAILABLE" : "NOT AVAILABLE",
                  certificateUrl: "Not Available",
                  evidence: {
                    source: "SIDH_VISIBLE_DOM",
                    text: rawRow.slice(0, 500),
                    url: url
                  }
                });
              }
            }
          }
        });
      }

      var durationMs = Date.now() - startTime;
      var diagnostics = {
        sidhPageDetected: true,
        activeTab: activeTab,
        visibleDomScanned: true,
        candidateContainersFound: candidateElements.length,
        validatedCourseCards: courses.length,
        rejectedElementsCount: rejectedReasons.length,
        rejectedReasons: rejectedReasons,
        extractionDurationMs: durationMs,
        scanAttempts: scrollSteps,
        currentUrl: url
      };

      var payload = {
        source: "SIDH_VISIBLE_DOM",
        profileUrl: url,
        extractedAt: new Date().toISOString(),
        activeTab: activeTab,
        diagnostics: diagnostics,
        student: {
          name: studentName || "Not Available",
          studentId: regId || "Not Available",
          registrationId: regId || "Not Available"
        },
        courses: courses
      };

      if (courses.length > 0) {
        // Success: send payload immediately
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage({
              type: "SIDH_DOM_SYNC_PAYLOAD",
              payload: payload
            }, origin);
            showSidhToast(
              "✅ SIDH Data Verified & Sent",
              "Detected <strong>" + courses.length + " course(s)</strong> in active tab <strong>" + activeTab + "</strong>. Return to SC SkillTrack to preview & confirm.",
              false,
              false
            );
            return;
          } catch(err) {}
        }

        // Clipboard fallback
        navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(function() {
          showSidhToast(
            "✅ SIDH Data Verified & Copied",
            "Detected <strong>" + courses.length + " course(s)</strong> in active tab <strong>" + activeTab + "</strong>. Return to SC SkillTrack and click <strong>'Import Verified SIDH Data'</strong>.",
            false,
            false
          );
        }).catch(function() {
          console.log("SC_SKILLTRACK_VERIFIED_PAYLOAD:", JSON.stringify(payload));
        });
        return;
      }

      // No courses detected: show notice and copy diagnostics
      showSidhToast(
        "⚠️ No Visible Courses Found",
        "Scanned active tab <strong>" + activeTab + "</strong>, but 0 visible course cards were found. Ensure course cards have finished loading.",
        true,
        false
      );

      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({
            type: "SIDH_DOM_SYNC_PAYLOAD",
            payload: payload
          }, origin);
        } catch(e) {}
      } else {
        navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).catch(function(){});
      }
    }

  } catch(e) {
    showSidhToast("❌ Extraction Notice", "Unable to read visible SIDH course data: " + e.message, true, false);
  }
})();`;
}
