// SC SkillTrack AI - SIDH Side Panel Logic (Manifest V3)
let extractedPayload = null;
let targetApiBase = 'https://ais-dev-duqdfmls6yy4byc6te7qol-186814008368.asia-southeast1.run.app';

document.addEventListener('DOMContentLoaded', async () => {
  const connBadge = document.getElementById('conn-badge');
  const domainStatus = document.getElementById('domain-status');
  const pageStatus = document.getElementById('page-status');
  const dataStatus = document.getElementById('data-status');
  const btnSync = document.getElementById('btn-sync');
  const btnReview = document.getElementById('btn-review');
  const btnSend = document.getElementById('btn-send');
  const studentNameEl = document.getElementById('student-name');
  const statFound = document.getElementById('stat-found');
  const statCompleted = document.getElementById('stat-completed');
  const statProgress = document.getElementById('stat-progress');
  const statCerts = document.getElementById('stat-certs');
  const recordsContainer = document.getElementById('records-container');
  const msgBox = document.getElementById('msg-box');

  // Check active tab
  async function checkActiveTab() {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          const url = tabs[0].url;
          const isSidh = url.includes('skillindiadigital.gov.in');
          if (isSidh) {
            connBadge.className = 'status-badge connected';
            connBadge.innerText = 'CONNECTED';
            domainStatus.innerText = 'skillindiadigital.gov.in';
            btnSync.disabled = false;

            if (url.includes('digital-cv') || url.includes('cv-preview')) {
              pageStatus.innerText = 'Digital CV';
            } else if (url.includes('certificate')) {
              pageStatus.innerText = 'Certificates';
            } else if (url.includes('completed')) {
              pageStatus.innerText = 'Completed Courses';
            } else if (url.includes('enrolled') || url.includes('my-course')) {
              pageStatus.innerText = 'Enrolled Courses';
            } else {
              pageStatus.innerText = 'Courses Page';
            }
          } else {
            connBadge.className = 'status-badge disconnected';
            connBadge.innerText = 'NOT DETECTED';
            domainStatus.innerText = 'Not on SIDH';
            pageStatus.innerText = 'Open skillindiadigital.gov.in';
            btnSync.disabled = true;
          }
        }
      });
    }
  }

  await checkActiveTab();

  // Sync Button Click
  btnSync.addEventListener('click', () => {
    btnSync.innerText = 'Extracting Visible DOM...';
    btnSync.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs[0]) {
        btnSync.innerText = 'Sync Data';
        btnSync.disabled = false;
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, { type: 'EXTRACT_VISIBLE_SIDH_DATA' }, (response) => {
        btnSync.innerText = 'Sync Data';
        btnSync.disabled = false;

        if (chrome.runtime.lastError || !response || !response.payload) {
          dataStatus.innerText = 'NO DATA';
          recordsContainer.innerHTML = '<div class="empty-state">No verified SIDH records were received. Ensure you are on a courses page.</div>';
          return;
        }

        extractedPayload = response.payload;
        const courses = extractedPayload.courses || [];
        const student = extractedPayload.student || {};

        if (courses.length > 0) {
          dataStatus.innerText = 'DATA FOUND';
          dataStatus.style.color = '#34d399';
          btnReview.disabled = false;
          btnSend.disabled = false;

          studentNameEl.innerText = student.name || 'Student Identified via Session';
          statFound.innerText = courses.length;
          statCompleted.innerText = courses.filter(c => c.status === 'COMPLETED').length;
          statProgress.innerText = courses.filter(c => c.status === 'IN PROGRESS' || c.status === 'ENROLLED').length;
          statCerts.innerText = courses.filter(c => c.certificateAvailable).length;

          renderRecords(courses);
        } else {
          dataStatus.innerText = 'NO DATA';
          statFound.innerText = '0';
          statCompleted.innerText = '0';
          statProgress.innerText = '0';
          statCerts.innerText = '0';
          recordsContainer.innerHTML = '<div class="empty-state">No verified SIDH records were received.</div>';
          btnReview.disabled = true;
          btnSend.disabled = true;
        }
      });
    });
  });

  function renderRecords(courses) {
    if (!courses || courses.length === 0) {
      recordsContainer.innerHTML = '<div class="empty-state">No verified SIDH records were received.</div>';
      return;
    }
    const html = `
      <div class="records-list">
        ${courses.map(c => `
          <div class="record-item">
            <div class="record-title">${escapeHtml(c.courseName || 'Course')}</div>
            <div class="record-meta">
              <span>${escapeHtml(c.provider || 'SIDH')}</span>
              <span class="pill ${c.status === 'COMPLETED' ? 'pill-green' : 'pill-blue'}">${escapeHtml(c.status || 'Active')}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    recordsContainer.innerHTML = html;
  }

  // Send to SC SkillTrack
  btnSend.addEventListener('click', async () => {
    if (!extractedPayload) return;

    btnSend.disabled = true;
    btnSend.innerText = 'Sending to Backend...';
    msgBox.style.display = 'block';
    msgBox.style.background = 'rgba(56, 189, 248, 0.15)';
    msgBox.style.color = '#38bdf8';
    msgBox.innerText = 'Validating and persisting verified records...';

    try {
      const res = await fetch(`${targetApiBase}/api/sidh/extension-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractedPayload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        msgBox.style.background = 'rgba(16, 185, 129, 0.2)';
        msgBox.style.color = '#34d399';
        msgBox.innerText = `✓ Successfully synchronized ${data.summary?.recordsAccepted || 0} verified record(s)!`;
        btnSend.innerText = 'Synced ✓';
      } else {
        msgBox.style.background = 'rgba(239, 68, 68, 0.2)';
        msgBox.style.color = '#f87171';
        msgBox.innerText = `Sync Error: ${data.error || 'Validation failed'}`;
        btnSend.disabled = false;
        btnSend.innerText = 'Send to SC SkillTrack';
      }
    } catch (e) {
      msgBox.style.background = 'rgba(239, 68, 68, 0.2)';
      msgBox.style.color = '#f87171';
      msgBox.innerText = `Network error connecting to SC SkillTrack: ${e.message}`;
      btnSend.disabled = false;
      btnSend.innerText = 'Send to SC SkillTrack';
    }
  });

  // Review Records Click
  btnReview.addEventListener('click', () => {
    if (extractedPayload && extractedPayload.courses) {
      renderRecords(extractedPayload.courses);
    }
  });

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
