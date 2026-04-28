const APP_URL = "http://localhost:3000";
const CHECK_INTERVAL_MS = 10000;

async function getExtensionToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["extensionToken"], (result) => {
      resolve(result.extensionToken || null);
    });
  });
}

function sendMessageToGoogleMeetTabs(message) {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue;

      const isGoogleMeet = tab.url.includes("meet.google.com");

      if (!isGoogleMeet) continue;

      chrome.tabs.sendMessage(tab.id, message, () => {
        if (chrome.runtime.lastError) {
          // Content script may not be ready yet. Safe to ignore.
        }
      });
    }
  });
}

async function clearMeetPopups() {
  chrome.storage.local.set({
    pendingQuestionPayload: null,
    pendingAnswer: null
  });

  sendMessageToGoogleMeetTabs({
    type: "ATTENTIVO_CLEAR_POPUP"
  });
}

async function checkActiveSession() {
  const token = await getExtensionToken();

  if (!token) {
    await clearMeetPopups();
    return;
  }

  try {
    const response = await fetch(`${APP_URL}/api/extension/active-session`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data.active) {
      console.log("ATTENTIVO: no active session.");
      await clearMeetPopups();
      return;
    }

    if (data.active && !data.question) {
      console.log(
        "ATTENTIVO: active session, but no question is due yet.",
        data.nextQuestionAt ? `Next question at ${data.nextQuestionAt}` : ""
      );
      return;
    }

    sendMessageToGoogleMeetTabs({
      type: "ATTENTIVO_QUESTION",
      payload: {
        ...data,
        appUrl: APP_URL
      }
    });
  } catch (error) {
    console.error("ATTENTIVO session check failed:", error);
  }
}

chrome.runtime.onInstalled.addListener(checkActiveSession);
chrome.runtime.onStartup.addListener(checkActiveSession);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.extensionToken) {
    checkActiveSession();
  }
});

setInterval(checkActiveSession, CHECK_INTERVAL_MS);