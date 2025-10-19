document.getElementById("analyzeButton").addEventListener("click", () => {
  const statusMessageDiv = document.getElementById("status-message");
  statusMessageDiv.style.display = "block";
  statusMessageDiv.innerHTML = "<p>Analyzing comments... This may take a moment.</p>";
  document.getElementById("results-container").innerHTML = ""; // Clear previous results
  
  // Disable buttons during analysis
  document.getElementById("analyzeButton").disabled = true;
  document.getElementById("exportPdfButton").disabled = true;
  document.getElementById("exportMarkdownButton").disabled = true;
  document.getElementById("cleanReadModeButton").disabled = true;
  document.getElementById("generateResponseButton").disabled = true;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.runtime.sendMessage({ action: "analyzeComments", tabId: tabs[0].id });
  });
});

document.getElementById("exportPdfButton").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "exportResults", format: "pdf" });
});

document.getElementById("exportMarkdownButton").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "exportResults", format: "md" });
});

document.getElementById("cleanReadModeButton").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "toggleCleanReadMode" });
  });
});

document.getElementById("clearResultsButton").addEventListener("click", () => {
  document.getElementById("results-container").innerHTML = "";
  document.getElementById("status-message").innerHTML = "";
  document.getElementById("status-message").style.display = "none";
  document.getElementById("exportPdfButton").style.display = "none";
  document.getElementById("exportMarkdownButton").style.display = "none";
  document.getElementById("cleanReadModeButton").style.display = "none";
  document.getElementById("clearResultsButton").style.display = "none";
  document.getElementById("generateResponseButton").style.display = "none";
  document.getElementById("analyzeButton").disabled = false;
  // Re-check API key status to re-enable AI button if key is present
  chrome.storage.local.get(["openaiApiKey"], (result) => {
    if (result.openaiApiKey) {
      document.getElementById("generateResponseButton").style.display = "block";
    }
  });
});

document.getElementById("saveApiKeyButton").addEventListener("click", () => {
  const apiKey = document.getElementById("openaiApiKey").value;
  if (apiKey) {
    chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
      document.getElementById("apiKeyStatus").innerText = "API Key saved!";
      document.getElementById("openaiApiKey").value = ""; // Clear input after saving
      document.getElementById("generateResponseButton").style.display = "block"; // Show generate button
      document.getElementById("removeApiKeyButton").style.display = "block";
    });
  } else {
    document.getElementById("apiKeyStatus").innerText = "Please enter an API Key.";
  }
});

document.getElementById("removeApiKeyButton").addEventListener("click", () => {
  chrome.storage.local.remove(["openaiApiKey"], () => {
    document.getElementById("apiKeyStatus").innerText = "API Key removed.";
    document.getElementById("generateResponseButton").style.display = "none";
    document.getElementById("removeApiKeyButton").style.display = "none";
  });
});

document.getElementById("generateResponseButton").addEventListener("click", () => {
  const statusMessageDiv = document.getElementById("status-message");
  statusMessageDiv.style.display = "block";
  statusMessageDiv.innerHTML = "<p>Generating AI response... This may take a moment.</p>";
  document.getElementById("generateResponseButton").disabled = true;
  chrome.runtime.sendMessage({ action: "generateAIResponse" });
});

// Load API key status on popup open
chrome.storage.local.get(["openaiApiKey"], (result) => {
  if (result.openaiApiKey) {
    document.getElementById("apiKeyStatus").innerText = "API Key is set.";
    document.getElementById("generateResponseButton").style.display = "block";
    document.getElementById("removeApiKeyButton").style.display = "block";
  } else {
    document.getElementById("apiKeyStatus").innerText = "No API Key set. Please enter one to enable AI features.";
    document.getElementById("generateResponseButton").style.display = "none";
    document.getElementById("removeApiKeyButton").style.display = "none";
  }
});

// Toggle collapsible sections
function setupCollapsibleSections() {
  document.querySelectorAll(".result-section h2").forEach(header => {
    header.addEventListener("click", () => {
      header.classList.toggle("collapsed");
      const content = header.nextElementSibling;
      if (content) {
        content.classList.toggle("hidden");
      }
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const resultsContainer = document.getElementById("results-container");
  const statusMessageDiv = document.getElementById("status-message");

  if (request.action === "displayResults") {
    statusMessageDiv.style.display = "none";
    resultsContainer.innerHTML = ""; // Clear previous results

    // Enable buttons after analysis
    document.getElementById("analyzeButton").disabled = false;
    document.getElementById("exportPdfButton").style.display = "block";
    document.getElementById("exportMarkdownButton").style.display = "block";
    document.getElementById("cleanReadModeButton").style.display = "block";
    document.getElementById("clearResultsButton").style.display = "block";
    document.getElementById("exportPdfButton").disabled = false;
    document.getElementById("exportMarkdownButton").disabled = false;
    document.getElementById("cleanReadModeButton").disabled = false;
    document.getElementById("generateResponseButton").disabled = false;

    if (request.status === "error") {
      resultsContainer.innerHTML = `<div class="result-section"><p style="color: red;">Error: ${request.message}</p></div>`;
      return;
    }

    // Display Summary
    const summarySection = document.createElement("div");
    summarySection.classList.add("result-section");
    summarySection.innerHTML = `<h2>Summary <span class="toggle-icon">&#9660;</span></h2><div class="result-content"><p>${request.summary || "No summary available."}</p></div>`;
    resultsContainer.appendChild(summarySection);

    // Display Polarization
    const polarizationSection = document.createElement("div");
    polarizationSection.classList.add("result-section");
    if (request.polarization) {
      polarizationSection.innerHTML = `
        <h2>Polarization Analysis <span class="toggle-icon">&#9660;</span></h2>
        <div class="result-content">
          <p>Positive Comments: ${request.polarization.positive}</p>
          <p>Negative Comments: ${request.polarization.negative}</p>
          <p>Neutral Comments: ${request.polarization.neutral}</p>
          <p>Polarization Score: ${request.polarization.polarization.toFixed(2)}</p>
        </div>
      `;
    } else {
      polarizationSection.innerHTML = `<h2>Polarization Analysis <span class="toggle-icon">&#9660;</span></h2><div class="result-content"><p>No polarization data available.</p></div>`;
    }
    resultsContainer.appendChild(polarizationSection);

    // Display Relevant Comments
    const relevantCommentsSection = document.createElement("div");
    relevantCommentsSection.classList.add("result-section");
    if (request.relevantComments && request.relevantComments.length > 0) {
      let commentsHtml = "<h2>Most Relevant Comments <span class="toggle-icon">&#9660;</span></h2><div class="result-content"><ul>";
      request.relevantComments.forEach(comment => {
        const sentimentLabel = comment.sentiment ? comment.sentiment.label : "N/A";
        commentsHtml += `<li class="comment-item"><strong>Author:</strong> ${comment.author} (Score: ${comment.score}, Sentiment: <span class="sentiment-${sentimentLabel.toLowerCase()}">${sentimentLabel}</span>)<br>${comment.body}</li>`;
      });
      commentsHtml += "</ul></div>";
      relevantCommentsSection.innerHTML = commentsHtml;
    } else {
      relevantCommentsSection.innerHTML = `<h2>Most Relevant Comments <span class="toggle-icon">&#9660;</span></h2><div class="result-content"><p>No relevant comments found.</p></div>`;
    }
    resultsContainer.appendChild(relevantCommentsSection);

    // Display all comments with sentiment (for debugging/detailed view)
    const allCommentsSection = document.createElement("div");
    allCommentsSection.classList.add("result-section");
    if (request.comments && request.comments.length > 0) {
      let allCommentsHtml = "<h2>All Comments <span class="toggle-icon">&#9660;</span></h2><div class="result-content">";
      function renderComment(comment) {
        const sentimentLabel = comment.sentiment ? comment.sentiment.label : "N/A";
        const sentimentScore = comment.sentiment ? comment.sentiment.score.toFixed(2) : "N/A";
        const indent = comment.depth * 20;
        allCommentsHtml += `<div class="comment-item" style="margin-left: ${indent}px;">
          <strong>Author:</strong> ${comment.author} (Score: ${comment.score}, Sentiment: <span class="sentiment-${sentimentLabel.toLowerCase()}">${sentimentLabel}</span> [${sentimentScore}])<br>
          ${comment.body}
        </div>`;
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.forEach(reply => renderComment(reply));
        }
      }
      request.comments.forEach(comment => renderComment(comment));
      allCommentsHtml += "</div>";
      allCommentsSection.innerHTML = allCommentsHtml;
    } else {
      allCommentsSection.innerHTML = `<h2>All Comments <span class="toggle-icon">&#9660;</span></h2><div class="result-content"><p>No comments found.</p></div>`;
    }
    resultsContainer.appendChild(allCommentsSection);

    setupCollapsibleSections();
    sendResponse({ status: "success" });

  } else if (request.action === "displayAIResponse") {
    document.getElementById("generateResponseButton").disabled = false;
    statusMessageDiv.style.display = "none";
    const aiResponseSection = document.createElement("div");
    aiResponseSection.id = "aiResponseSection";
    aiResponseSection.classList.add("result-section");
    aiResponseSection.innerHTML = `<h2>AI Generated Response <span class="toggle-icon">&#9660;</span></h2><div class="result-content"><p>${request.aiResponse || "No AI response generated."}</p></div>`;
    resultsContainer.appendChild(aiResponseSection);
    setupCollapsibleSections();
  } else if (request.action === "updateProgress") {
    statusMessageDiv.style.display = "block";
    statusMessageDiv.innerHTML = `<p>${request.message}</p>`;
  }
});
