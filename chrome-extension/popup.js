const tokenInput = document.getElementById("token");
const saveButton = document.getElementById("save");
const statusText = document.getElementById("status");

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

chrome.storage.local.get(["extensionToken"], (result) => {
  if (result.extensionToken) {
    tokenInput.value = result.extensionToken;
    setStatus("Token loaded.");
  }
});

saveButton.addEventListener("click", () => {
  const token = tokenInput.value.trim();

  if (!token) {
    chrome.storage.local.remove(["extensionToken"], () => {
      setStatus("Token cleared.", false);
    });

    return;
  }

  if (token.length < 20) {
    setStatus("Token seems too short. Please check your student token.", true);
    return;
  }

  chrome.storage.local.set(
    {
      extensionToken: token
    },
    () => {
      if (chrome.runtime.lastError) {
        setStatus(chrome.runtime.lastError.message, true);
        return;
      }

      setStatus("Token saved. Open Google Meet during an active session.");
    }
  );
});