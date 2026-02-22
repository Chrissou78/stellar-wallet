// Background service worker for Stellar Wallet extension

// Auto-lock after 15 minutes of inactivity
const LOCK_TIMEOUT_MINUTES = 15;

chrome.alarms.create("auto-lock", { periodInMinutes: LOCK_TIMEOUT_MINUTES });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "auto-lock") {
    chrome.storage.local.get("stellar-wallet", (data) => {
      if (data["stellar-wallet"]) {
        const state = JSON.parse(data["stellar-wallet"]);
        if (state.state?.isUnlocked) {
          state.state.isUnlocked = false;
          state.state._secretKey = null;
          chrome.storage.local.set({ "stellar-wallet": JSON.stringify(state) });
        }
      }
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "KEEP_ALIVE") {
    // Reset auto-lock timer
    chrome.alarms.create("auto-lock", { periodInMinutes: LOCK_TIMEOUT_MINUTES });
    sendResponse({ ok: true });
  }

  if (message.type === "GET_STATE") {
    chrome.storage.local.get("stellar-wallet", (data) => {
      sendResponse(data["stellar-wallet"] || null);
    });
    return true; // async response
  }

  if (message.type === "NOTIFICATION") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon-128.png",
      title: message.title || "Stellar Wallet",
      message: message.message || "",
    });
    sendResponse({ ok: true });
  }
});

console.log("Stellar Wallet background service worker started");
