// ScopeCreep Notary — background service worker (MV3)
// Stub for T-011. Real wiring lands with content-script integration in T-013+.

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.storage.local.set({
      onboarded: false,
      sow: null,
      hourlyRate: null,
      flagged: []
    });
  }
});
