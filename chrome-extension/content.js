let activePopupKey = null;

function buildQuestionKey(sessionId, questionId) {
  return `attentivo:${sessionId}:${questionId}`;
}

function removeExistingPopup() {
  const existing = document.getElementById("attentivo-popup");
  if (existing) existing.remove();
}

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type !== "ATTENTIVO_QUESTION") return;

  const { sessionId, question } = message.payload;

  if (!question) return;

  const questionKey = buildQuestionKey(sessionId, question.id);

  chrome.storage.local.get(["submittedQuestionKeys", "pendingQuestionKey"], (result) => {
    const submittedQuestionKeys = result.submittedQuestionKeys || [];

    if (submittedQuestionKeys.includes(questionKey)) {
      return;
    }

    activePopupKey = questionKey;

    chrome.storage.local.set({
      pendingQuestionKey: questionKey,
      pendingQuestionPayload: {
        sessionId,
        question
      }
    });

    showQuestionPopup(sessionId, question);
  });
});

chrome.storage.local.get(["pendingQuestionPayload", "submittedQuestionKeys"], (result) => {
  const pending = result.pendingQuestionPayload;
  const submittedQuestionKeys = result.submittedQuestionKeys || [];

  if (!pending?.sessionId || !pending?.question?.id) return;

  const questionKey = buildQuestionKey(pending.sessionId, pending.question.id);

  if (submittedQuestionKeys.includes(questionKey)) return;

  activePopupKey = questionKey;
  showQuestionPopup(pending.sessionId, pending.question);
});

function showQuestionPopup(sessionId, question) {
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

      await submitAnswer(sessionId, question.id, selectedOption);
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

async function submitAnswer(sessionId, questionId, selectedOption) {
  const status = document.getElementById("attentivo-status");

  if (status) {
    status.textContent = "Submitting...";
  }

  chrome.storage.local.get(["extensionToken", "submittedQuestionKeys"], async (result) => {
    try {
      const response = await fetch("http://localhost:3000/api/responses/submit", {
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
        pendingQuestionKey: null,
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
        status.textContent = "Network error. Your selected answer was saved locally and can be retried.";
      }
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}