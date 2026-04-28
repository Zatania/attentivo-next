const APP_URL = "http://localhost:3000";
const CHECK_INTERVAL_MS = 10000;

async function getExtensionToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["extensionToken"], (result) => {
      resolve(result.extensionToken || null);
    });
  });
}

async function checkActiveSession() {
  const token = await getExtensionToken();

  if (!token) return;

  try {
    const response = await fetch(`${APP_URL}/api/extension/active-session`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!data.active || !data.question) return;

    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (!tab.id || !tab.url) continue;

        const isGoogleMeet = tab.url.includes("meet.google.com");

        if (!isGoogleMeet) continue;

        chrome.tabs.sendMessage(tab.id, {
          type: "ATTENTIVO_QUESTION",
          payload: {
            ...data,
            appUrl: APP_URL
          }
        });
      }
    });
  } catch (error) {
    console.error("ATTENTIVO session check failed:", error);
  }
}

chrome.runtime.onInstalled.addListener(checkActiveSession);
chrome.runtime.onStartup.addListener(checkActiveSession);

setInterval(checkActiveSession, CHECK_INTERVAL_MS);