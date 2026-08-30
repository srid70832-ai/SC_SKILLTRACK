// SC SkillTrack SIDH Sync - Extension Popup JS

document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('statusBadge');
  const stepLog = document.getElementById('stepLog');
  const studentNameEl = document.getElementById('studentName');
  const studentIdEl = document.getElementById('studentId');
  const coursesFoundEl = document.getElementById('coursesFound');
  const completedCoursesEl = document.getElementById('completedCourses');
  const inProgressCoursesEl = document.getElementById('inProgressCourses');
  const certificatesFoundEl = document.getElementById('certificatesFound');
  const syncBtn = document.getElementById('syncBtn');
  const cancelBtn = document.getElementById('cancelBtn');

  let extractedPayload = null;

  function updateStep(text, badgeText, isReady = false) {
    stepLog.innerText = text;
    statusBadge.innerText = badgeText;
    if (isReady) {
      statusBadge.className = 'status-badge';
      syncBtn.disabled = false;
    } else {
      statusBadge.className = 'status-badge waiting';
    }
  }

  updateStep("Waiting for SIDH page...", "● Checking SIDH Page");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.url || (!tab.url.includes('skillindiadigital.gov.in') && !tab.url.includes('www.skillindiadigital.gov.in'))) {
      updateStep("Please open an official SIDH page in this browser tab.", "○ Not an SIDH Page");
      studentNameEl.innerText = "N/A";
      studentIdEl.innerText = "N/A";
      return;
    }

    updateStep("SIDH page detected ↓ Reading visible profile data...", "● SIDH Page Detected");

    // Request DOM extraction from content script
    chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_SIDH_DOM' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        updateStep("SIDH page structure changed or required information is not visible.", "○ Extraction Issue");
        studentNameEl.innerText = "Not Available";
        studentIdEl.innerText = "Not Available";
        return;
      }

      extractedPayload = response.data;
      const student = extractedPayload.student || {};
      const courses = extractedPayload.courses || [];

      studentNameEl.innerText = student.name || "Not Available";
      studentIdEl.innerText = student.studentId || student.registrationId || "Not Available";
      coursesFoundEl.innerText = courses.length;

      const completed = courses.filter(c => c.status === 'COMPLETED').length;
      const inProgress = courses.filter(c => c.status === 'IN PROGRESS').length;
      const certs = courses.filter(c => c.certificateStatus === 'AVAILABLE' || c.certificateId !== 'Not Available').length;

      completedCoursesEl.innerText = completed;
      inProgressCoursesEl.innerText = inProgress;
      certificatesFoundEl.innerText = certs;

      updateStep("Data extracted ↓ Click below to confirm sync to SC SkillTrack", "● Data Extracted", true);
    });

  } catch (err) {
    updateStep("Error reading tab: " + err.message, "○ Error");
  }

  syncBtn.addEventListener('click', async () => {
    if (!extractedPayload) return;

    syncBtn.disabled = true;
    updateStep("User confirmation ↓ Syncing to SC SkillTrack...", "● Syncing...");

    try {
      const res = await fetch('/api/sidh/browser-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractedPayload)
      }).then(r => r.json());

      if (res.success) {
        updateStep("Synced to SC SkillTrack ✓ Status: " + (res.summary?.verificationStatus || "USER CONFIRMED"), "● Synced ✓");
        syncBtn.innerText = "✓ Synced Successfully";
      } else {
        updateStep("Sync failed: " + (res.error || "Server error"), "○ Failed");
        syncBtn.disabled = false;
      }
    } catch (err) {
      updateStep("Network error: " + err.message, "○ Sync Failed");
      syncBtn.disabled = false;
    }
  });

  cancelBtn.addEventListener('click', () => {
    window.close();
  });
});
