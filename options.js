document.addEventListener("DOMContentLoaded", () => {
  const openaiApiKeyInput = document.getElementById("openaiApiKey");
  const saveApiKeyButton = document.getElementById("saveApiKeyButton");
  const removeApiKeyButton = document.getElementById("removeApiKeyButton");
  const apiKeyStatus = document.getElementById("apiKeyStatus");

  // Load API key status on page open
  chrome.storage.local.get(["openaiApiKey"], (result) => {
    if (result.openaiApiKey) {
      apiKeyStatus.innerText = "API Key is set.";
      removeApiKeyButton.style.display = "block";
    } else {
      apiKeyStatus.innerText = "No API Key set.";
      removeApiKeyButton.style.display = "none";
    }
  });

  saveApiKeyButton.addEventListener("click", () => {
    const apiKey = openaiApiKeyInput.value;
    if (apiKey) {
      chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
        apiKeyStatus.innerText = "API Key saved!";
        openaiApiKeyInput.value = ""; // Clear input after saving
        removeApiKeyButton.style.display = "block";
      });
    } else {
      apiKeyStatus.innerText = "Please enter an API Key.";
    }
  });

  removeApiKeyButton.addEventListener("click", () => {
    chrome.storage.local.remove(["openaiApiKey"], () => {
      apiKeyStatus.innerText = "API Key removed.";
      removeApiKeyButton.style.display = "none";
    });
  });
});
