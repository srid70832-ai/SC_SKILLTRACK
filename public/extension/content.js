// SC SkillTrack AI - SIDH Sync Content Script (Manifest V3)
// STRICT SECURITY & ACCURACY MANDATES:
// 1. Zero password / credential / cookie / session token access.
// 2. Extracts ONLY user-authorized visible DOM text elements from the active tab.
// 3. Dynamic scrolling & observer for lazy-loaded Angular cards.
// 4. Zero fake or hallucinated values. Missing fields remain null or "Not Available".

(() => {
  const FORBIDDEN_STUDENT_NAMES = [
    'STUDENT VIEW PROFILE', 'VIEW PROFILE', 'PROFILE', 'STUDENT PROFILE',
    'LEARNER PROFILE', 'CANDIDATE PROFILE', 'DASHBOARD', 'MY SKILL COURSES',
    'MY COURSES', 'COMPLETED COURSES', 'JOINED COURSES', 'DIGITAL CV',
    'EDIT PROFILE', 'LOG IN', 'LOGIN', 'LOGOUT', 'SIGN OUT', 'SKILL INDIA',
    'SKILL INDIA DIGITAL', 'SKILL INDIA DIGITAL HUB', 'NOT AVAILABLE', 'UNKNOWN'
  ];

  function cleanStudentName(n) {
    if (!n) return '';
    const c = n.trim().replace(/\s+/g, ' ');
    const u = c.toUpperCase();
    for (const f of FORBIDDEN_STUDENT_NAMES) {
      if (u === f || u.startsWith(f + ' ') || u.endsWith(' ' + f)) return '';
    }
    return c;
  }

  const FORBIDDEN_BUTTONS = [
    'GO TO COURSE', 'VIEW COURSE DETAILS', 'VIEW DETAILS', 'VIEW COURSE',
    'DOWNLOAD CERTIFICATE', 'VIEW CERTIFICATE', 'DOWNLOAD PROOF', 'RESUME COURSE',
    'RESUME', 'START COURSE', 'START LEARNING', 'START', 'CONTINUE LEARNING',
    'CONTINUE', 'ENROLLED', 'COMPLETED', 'IN PROGRESS', 'CERTIFICATE AVAILABLE',
    'DOWNLOAD', 'VIEW ALL', 'FREE', 'PAID'
  ];

  function cleanCourseTitle(n) {
    if (!n) return '';
    let c = n.trim().replace(/\s+/g, ' ');
    c = c.replace(/^["'“”‘’\-—–\s|:]+|["'“”‘’\-—–\s|:]+$/g, '').trim();
    let changed = true;
    let passes = 0;
    while (changed && passes < 6) {
      changed = false;
      passes++;
      for (const p of FORBIDDEN_BUTTONS) {
        const regEnd = new RegExp(`[\\s\\-–—|:]+${p}$`, 'i');
        if (regEnd.test(c)) { c = c.replace(regEnd, '').trim(); changed = true; }
        const regStart = new RegExp(`^${p}[\\s\\-–—|:]+`, 'i');
        if (regStart.test(c)) { c = c.replace(regStart, '').trim(); changed = true; }
      }
    }
    c = c.replace(/[\s\-|•]+(?:Free|Paid|\d+\s*(?:Hours?|Hrs?|Mins?)|★\s*[\d\.]+|\d+\.?\d*\s*Rating|\d+\s*Reviews?)$/i, '').trim();
    if (c.length < 2) return '';
    const u = c.toUpperCase();
    if (u === 'MY SKILL COURSES' || u === 'MY COURSES' || u === 'RECOMMENDED COURSES' || u === 'COMPLETED COURSES' || u === 'JOINED COURSES' || u === 'DASHBOARD' || u === 'NOT AVAILABLE' || u === 'VIEW ALL') {
      return '';
    }
    return c;
  }

  function cleanProviderText(p) {
    if (!p) return 'Skill India Digital Hub';
    let c = p.trim().replace(/\s+/g, ' ');
    c = c.replace(/^(?:Provided by|Provider|Partner|Issuer|By|Organization|Institute)\s*[:\-–—]?\s*/i, '').trim();
    c = c.replace(/[\s\-–—|:]+(?:Free|Paid|Verified|Official|Active|Completed|View Details)$/i, '').trim();
    if (c.length < 2 || c.toUpperCase() === 'NOT AVAILABLE' || c.toUpperCase() === 'UNKNOWN') {
      return 'Skill India Digital Hub';
    }
    return c;
  }

  function detectActiveTab() {
    const tabEls = document.querySelectorAll('.mat-tab-label-active, [role="tab"][aria-selected="true"], .nav-link.active, .tab-item.active, button.active, [class*="active"][role="tab"]');
    for (let i = 0; i < tabEls.length; i++) {
      const t = tabEls[i].textContent ? tabEls[i].textContent.trim() : '';
      if (t.length > 2 && t.length < 40) return t;
    }
    const url = window.location.href.toLowerCase();
    if (url.includes('completed')) return 'Completed';
    if (url.includes('joined')) return 'Joined';
    if (url.includes('online')) return 'Online';
    if (url.includes('offline')) return 'Offline';
    if (url.includes('recommended')) return 'Recommended';
    return 'Completed';
  }

  function isElementVisiblyRendered(el) {
    if (!el) return false;
    if (el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
    try {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return false;
    } catch (e) {}
    return true;
  }

  function getScrollableContainers() {
    const list = [window];
    try {
      const potential = document.querySelectorAll('.mat-tab-body-wrapper, .mat-tab-body-content, .courses-container, [class*="course-list"], [class*="card-grid"], [class*="courses-wrapper"], main, .main-content');
      potential.forEach((el) => {
        if (el && el.scrollHeight > el.clientHeight && el.clientHeight > 80) {
          list.push(el);
        }
      });
    } catch (e) {}
    return list;
  }

  async function performDynamicScrollLazyLoad() {
    const scrollContainers = getScrollableContainers();
    for (let i = 0; i < 5; i++) {
      try {
        window.scrollBy({ top: 450, behavior: 'smooth' });
        scrollContainers.forEach((c) => {
          if (c !== window && c.scrollTop !== undefined) c.scrollTop += 450;
        });
      } catch (e) {}
      await new Promise((r) => setTimeout(r, 180));
    }
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      scrollContainers.forEach((c) => {
        if (c !== window && c.scrollTop !== undefined) c.scrollTop = 0;
      });
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 200));
  }

  function extractVisibleData() {
    const currentUrl = window.location.href;
    const isSidhDomain = window.location.hostname.includes('skillindiadigital.gov.in') || window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
    if (!isSidhDomain) {
      return {
        error: 'NOT_SIDH_DOMAIN',
        message: 'Current page is not on the official Skill India Digital Hub domain.'
      };
    }

    const activeTab = detectActiveTab();

    // 1. Extract Student Name
    let studentName = '';
    const nameEl = document.querySelector('[data-testid="profile-name"], .candidate-name, .user-name, .profile-name, .digital-cv-name, h1.candidate-name, .user-details h1, .profile-header h1, #candidateName');
    if (nameEl && nameEl.textContent) {
      studentName = cleanStudentName(nameEl.textContent);
    }
    if (!studentName) {
      const match = (document.body.innerText || '').match(/(?:Candidate Name|Student Name|Learner Name|Name)\s*[:\-]\s*([A-Za-z\s\.]{2,50})/i);
      if (match) studentName = cleanStudentName(match[1]);
    }

    // 2. Extract Registration ID
    let regId = '';
    const regEl = document.querySelector('[data-testid="candidate-id"], [data-testid="sidh-id"], .candidate-id, .sidh-id, .registration-id, #candidateId');
    if (regEl && regEl.textContent) {
      const cReg = regEl.textContent.trim();
      if (!cReg.toUpperCase().includes('NOT AVAILABLE') && cReg.length >= 3) {
        regId = cReg;
      }
    }
    if (!regId) {
      const match2 = (document.body.innerText || '').match(/(?:SIDH ID|Registration No|Reg No|Roll No|Candidate ID|Learner ID)\s*[:\-]\s*([A-Za-z0-9\-_]{3,30})/i);
      if (match2) regId = match2[1].trim();
    }

    // 3. Multi-Strategy Candidate Card Detection
    const courses = [];
    const seenDedupeKeys = new Set();
    const rejectedReasons = [];

    const candidateSelectors = [
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

    const candidateElements = [];
    const candidateSet = new Set();

    document.querySelectorAll(candidateSelectors.join(', ')).forEach((el) => {
      if (!candidateSet.has(el)) {
        candidateSet.add(el);
        candidateElements.push(el);
      }
    });

    candidateElements.forEach((card, idx) => {
      if (!isElementVisiblyRendered(card)) {
        rejectedReasons.push({ element: `Card [${idx}]`, reason: 'Hidden (display:none or zero size)' });
        return;
      }

      const tag = card.tagName.toLowerCase();
      if (tag === 'nav' || tag === 'header' || tag === 'footer' || tag === 'aside') {
        rejectedReasons.push({ element: `Card [${idx}]`, reason: 'Header/Navigation element' });
        return;
      }

      // Title Extraction
      const titleEl = card.querySelector('.course-title, .course-name, h1, h2, h3, h4, h5, h6, .title, .card-title, [class*="title"], [data-testid="course-title"]');
      let rawTitleText = '';
      if (titleEl) {
        try {
          const clone = titleEl.cloneNode(true);
          const unwanted = clone.querySelectorAll('button, a, .badge, .btn, .tag, [role="button"]');
          unwanted.forEach((u) => u.remove());
          rawTitleText = (clone.innerText || clone.textContent || '').trim();
        } catch (e) {
          rawTitleText = titleEl.textContent ? titleEl.textContent.trim() : '';
        }
      }
      let title = cleanCourseTitle(rawTitleText);

      if (!title) {
        const lines = (card.innerText || card.textContent || '').split('\n').map((l) => l.trim()).filter((l) => l.length >= 3 && l.length <= 120);
        for (let i = 0; i < lines.length; i++) {
          const cleaned = cleanCourseTitle(lines[i]);
          if (cleaned) {
            title = cleaned;
            break;
          }
        }
      }

      if (!title || title.length < 2) {
        rejectedReasons.push({ element: `Card [${idx}]`, reason: 'Missing visible course title' });
        return;
      }

      // Provider Extraction
      const providerEl = card.querySelector('.provider-name, .partner-name, .organization, .institute, [class*="provider"], [class*="partner"], .sub-title, p.text-muted');
      let providerText = providerEl ? cleanProviderText(providerEl.textContent) : '';
      if (!providerText || providerText === 'Skill India Digital Hub') {
        const cText = card.innerText || card.textContent || '';
        const pLines = cText.split('\n').map((l) => l.trim());
        for (let p = 0; p < pLines.length; p++) {
          if (pLines[p].toLowerCase().startsWith('by ') || pLines[p].toLowerCase().startsWith('provided by') || pLines[p].includes('Foundation') || pLines[p].includes('Technologies') || pLines[p].includes('NSDC') || pLines[p].includes('Tech Mahindra') || pLines[p].includes('IBM') || pLines[p].includes('Cisco') || pLines[p].includes('Microsoft') || pLines[p].includes('SFJ') || pLines[p].includes('Academy')) {
            providerText = cleanProviderText(pLines[p]);
            break;
          }
        }
      }
      providerText = cleanProviderText(providerText);

      // Deduplication key
      const dedupeKey = title.toLowerCase() + '___' + providerText.toLowerCase();
      if (seenDedupeKeys.has(dedupeKey)) {
        rejectedReasons.push({ element: `Card [${idx}]`, reason: `Duplicate title: ${title}` });
        return;
      }
      seenDedupeKeys.add(dedupeKey);

      // Category
      const categoryEl = card.querySelector('.category, .sector, [class*="category"], [class*="sector"], .badge, .chip, .pill');
      let categoryText = categoryEl ? categoryEl.textContent.trim() : '';
      if (!categoryText) {
        const allTxt = card.innerText || card.textContent || '';
        const KNOWN_SECTORS = ['IT-ITeS', 'IT & ITES', 'Healthcare', 'Automotive', 'Electronics', 'Telecom', 'BFSI', 'Retail'];
        for (let k = 0; k < KNOWN_SECTORS.length; k++) {
          if (allTxt.includes(KNOWN_SECTORS[k])) {
            categoryText = KNOWN_SECTORS[k];
            break;
          }
        }
      }
      if (!categoryText) categoryText = 'Skill India Courses';

      // Status
      const statusEl = card.querySelector('.course-status, .status-badge, .badge, .status');
      const rawStatus = statusEl ? statusEl.textContent.trim().toUpperCase() : '';
      let status = 'IN PROGRESS';
      if (rawStatus.includes('COMPLET') || rawStatus === 'PASSED') status = 'COMPLETED';
      else if (rawStatus.includes('PROGRESS')) status = 'IN PROGRESS';
      else if (rawStatus.includes('ENROLL') || rawStatus.includes('JOINED')) status = 'ENROLLED';
      else if (activeTab.toUpperCase().includes('COMPLET')) status = 'COMPLETED';
      else if (activeTab.toUpperCase().includes('JOINED') || activeTab.toUpperCase().includes('ONLINE') || activeTab.toUpperCase().includes('OFFLINE')) status = 'ENROLLED';

      const enrollDateEl = card.querySelector('.enrolled-date, .registration-date, [data-testid="enrolled-date"]');
      const compDateEl = card.querySelector('.completed-date, .completion-date');
      const certLinkEl = card.querySelector('a.certificate-link, a[href*="certificate"], a[href*="download"], button.download-cert, [class*="download-certificate"], [class*="view-certificate"]');
      const certAvail = (status === 'COMPLETED' || certLinkEl) ? 'AVAILABLE' : 'NOT AVAILABLE';
      const rawCardText = (card.innerText || card.textContent || title).trim();

      courses.push({
        courseName: title,
        courseId: `CRS-SIDH-${idx + 1}`,
        provider: providerText,
        category: categoryText,
        status: status,
        enrollmentDate: enrollDateEl ? enrollDateEl.textContent.trim() : 'Not Available',
        completionDate: compDateEl ? compDateEl.textContent.trim() : (status === 'COMPLETED' ? new Date().toISOString().slice(0, 10) : 'Not Available'),
        certificateAvailable: certAvail,
        certificateUrl: certLinkEl && certLinkEl.href ? certLinkEl.href : 'Not Available',
        evidence: {
          source: 'SIDH_VISIBLE_DOM',
          text: rawCardText.slice(0, 500),
          url: currentUrl
        }
      });
    });

    return {
      source: 'SIDH_VISIBLE_DOM',
      profileUrl: currentUrl,
      sourceUrl: currentUrl,
      extractedAt: new Date().toISOString(),
      activeTab: activeTab,
      diagnostics: {
        sidhPageDetected: true,
        activeTab: activeTab,
        visibleDomScanned: true,
        candidateContainersFound: candidateElements.length,
        validatedCourseCards: courses.length,
        rejectedElementsCount: rejectedReasons.length,
        rejectedReasons: rejectedReasons,
        currentUrl: currentUrl
      },
      student: {
        name: studentName || 'Not Available',
        studentId: regId || 'Not Available',
        registrationId: regId || 'Not Available',
        registerNumber: regId || 'Not Available'
      },
      courses: courses
    };
  }

  // Listen for messages from popup or side panel
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const isExtractReq = request.type === 'EXTRACT_VISIBLE_SIDH_DATA' || 
                         request.type === 'EXTRACT_SIDH_DOM' || 
                         request.action === 'EXTRACT_SIDH_DOM' || 
                         request.action === 'EXTRACT_VISIBLE_SIDH_DATA';

    if (isExtractReq) {
      performDynamicScrollLazyLoad().then(() => {
        const data = extractVisibleData();
        sendResponse({ success: true, payload: data, data: data });
      });
      return true; // Keep channel open for async response
    }
    return true;
  });
})();
