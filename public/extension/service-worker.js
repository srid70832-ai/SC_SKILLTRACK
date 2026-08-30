// SC SkillTrack AI - SIDH Sync Background Service Worker (Manifest V3)
chrome.runtime.onInstalled.addListener(() => {
  console.log('[SC SkillTrack SIDH Sync] Extension installed and ready.');
});

// Setup side panel behavior
if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));
}

// Listen for message events between content scripts, side panels, and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_ACTIVE_TAB_INFO') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        sendResponse({ tab: tabs[0] });
      } else {
        sendResponse({ tab: null });
      }
    });
    return true;
  }
});
