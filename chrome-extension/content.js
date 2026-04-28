const PENDING_QUESTION_MAX_AGE_MS = 30 * 60 * 1000;

function buildQuestionKey(sessionId, questionId) {
  return `attentivo:${sessionId}:${questionId}`;
}

function removeExistingPopup() {
  const existing = document.getElementById("attentivo-popup");
  if (existing) existing.remove();
}

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type !== "ATTENTIVO_QUESTION") return;

  const { sessionId, question, appUrl } = message.payload;

  if (!question) return;

  const questionKey = buildQuestionKey(sessionId, question.id);

  chrome.storage.local.get(["submittedQuestionKeys"], (result) => {
    const submittedQuestionKeys = result.submittedQuestionKeys || [];

    if (submittedQuestionKeys.includes(questionKey)) return;

    chrome.storage.local.set({
      pendingQuestionPayload: {
        sessionId,
        question,
        appUrl,
        savedAt: Date.now()
      }
    });

    showQuestionPopup(sessionId, question, appUrl);
  });
});

chrome.storage.local.get(
  ["pendingQuestionPayload", "submittedQuestionKeys"],
  (result) => {
    const pending = result.pendingQuestionPayload;
    const submittedQuestionKeys = result.submittedQuestionKeys || [];

    if (!pending?.sessionId || !pending?.question?.id) return;

    const isExpired =
      typeof pending.savedAt === "number" &&
      Date.now() - pending.savedAt > PENDING_QUESTION_MAX_AGE_MS;

    if (isExpired) {
      chrome.storage.local.set({
        pendingQuestionPayload: null,
        pendingAnswer: null
      });

      return;
    }

    const questionKey = buildQuestionKey(
      pending.sessionId,
      pending.question.id
    );

    if (submittedQuestionKeys.includes(questionKey)) return;

    showQuestionPopup(pending.sessionId, pending.question, pending.appUrl);
  }
);

function showQuestionPopup(sessionId, question, appUrl) {
  removeExistingPopup();

  const popup = document.createElement("div");
  popup.id = "attentivo-popup";

  popup.style.position = "fixed";
  popup.style.bottom = "24px";
  popup.style.right = "24px";
  popup.style.width = "360px";
  popup.style.background = "#ffffff";
  popup.style.border = "2px solid #840808";
  popup.style.borderRadius = "14px";
  popup.style.padding = "16px";
  popup.style.zIndex = "2147483647";
  popup.style.boxShadow = "0 12px 30px rgba(0,0,0,0.25)";
  popup.style.fontFamily = "Arial, sans-serif";

  popup.innerHTML = `
    <div style="font-weight:700;color:#840808;font-size:16px;margin-bottom:8px;">
      ATTENTIVO Quick Check
    </div>

    <div style="font-size:14px;margin-bottom:12px;">
      ${escapeHtml(question.prompt)}
    </div>

    ${renderOption("A", question.options.A)}
    ${renderOption("B", question.options.B)}
    ${renderOption("C", question.options.C)}
    ${renderOption("D", question.options.D)}

    <div id="attentivo-status" style="font-size:12px;margin-top:10px;color:#555;"></div>
  `;

  document.body.appendChild(popup);

  popup.querySelectorAll("[data-option]").forEach((button) => {
    button.addEventListener("click", async () => {
      const selectedOption = button.getAttribute("data-option");

      chrome.storage.local.set({
        pendingAnswer: {
          sessionId,
          questionId: question.id,
          selectedOption
        }
      });

      await submitAnswer(appUrl, sessionId, question.id, selectedOption);
    });
  });
}

function renderOption(letter, text) {
  return `
    <button
      data-option="${letter}"
      style="
        display:block;
        width:100%;
        text-align:left;
        padding:9px;
        margin-bottom:7px;
        border:1px solid #ddd;
        border-radius:8px;
        background:#f9fafb;
        cursor:pointer;
      "
    >
      <strong>${letter}.</strong> ${escapeHtml(text)}
    </button>
  `;
}

async function submitAnswer(appUrl, sessionId, questionId, selectedOption) {
  const status = document.getElementById("attentivo-status");

  if (status) {
    status.textContent = "Submitting...";
  }

  chrome.storage.local.get(
    ["extensionToken", "submittedQuestionKeys"],
    async (result) => {
      try {
        const response = await fetch(`${appUrl}/api/responses/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            extensionToken: result.extensionToken,
            sessionId,
            questionId,
            selectedOption
          })
        });

        if (!response.ok) {
          if (status) {
            status.textContent = "Answer was not submitted. Please try again.";
          }

          return;
        }

        const questionKey = buildQuestionKey(sessionId, questionId);
        const submittedQuestionKeys = result.submittedQuestionKeys || [];

        chrome.storage.local.set({
          submittedQuestionKeys: Array.from(
            new Set([...submittedQuestionKeys, questionKey])
          ),
          pendingQuestionPayload: null,
          pendingAnswer: null
        });

        if (status) {
          status.textContent = "Submitted. Thank you.";
        }

        setTimeout(() => {
          removeExistingPopup();
        }, 1000);
      } catch {
        if (status) {
          status.textContent =
            "Network error. Your selected answer was saved locally and can be retried.";
        }
      }
    }
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}