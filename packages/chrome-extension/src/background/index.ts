// Background service worker for Stellar Wallet extension

// Keep-alive ping — extensions can go idle
chrome.alarms.create("keep-alive", { periodInMinutes: 4 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keep-alive") {
    // Just keep the service worker alive
    console.log("Stellar Wallet: keep-alive ping");
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "KEEP_ALIVE") {
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
