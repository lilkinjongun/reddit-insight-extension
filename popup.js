document.getElementById("analyzeButton").addEventListener("click", () => {
  document.getElementById("results").innerHTML = "<p>Analyzing comments... This may take a moment.</p>";
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "analyzeComments" });
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

document.getElementById("saveApiKeyButton").addEventListener("click", () => {
  const apiKey = document.getElementById("openaiApiKey").value;
  if (apiKey) {
    chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
      document.getElementById("apiKeyStatus").innerText = "API Key saved!";
      document.getElementById("openaiApiKey").value = ""; // Clear input after saving
      document.getElementById("generateResponseButton").style.display = "block"; // Show generate button
    });
  } else {
    document.getElementById("apiKeyStatus").innerText = "Please enter an API Key.";
  }
});

document.getElementById("generateResponseButton").addEventListener("click", () => {
  document.getElementById("results").innerHTML += "<p>Generating AI response... This may take a moment.</p>";
  chrome.runtime.sendMessage({ action: "generateAIResponse" });
});

// Load API key status on popup open
chrome.storage.local.get(["openaiApiKey"], (result) => {
  if (result.openaiApiKey) {
    document.getElementById("apiKeyStatus").innerText = "API Key is set.";
    document.getElementById("generateResponseButton").style.display = "block";
  } else {
    document.getElementById("apiKeyStatus").innerText = "No API Key set. Please enter one to enable AI features.";
    document.getElementById("generateResponseButton").style.display = "none";
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "displayResults") {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = ""; // Clear previous results

    // Show export and clean read mode buttons
    document.getElementById("exportPdfButton").style.display = "block";
    document.getElementById("exportMarkdownButton").style.display = "block";
    document.getElementById("cleanReadModeButton").style.display = "block";

    // Display Summary
    const summarySection = document.createElement("div");
    summarySection.innerHTML = `<h2>Summary</h2><p>${request.summary || "No summary available."}</p>`;
    resultsDiv.appendChild(summarySection);

    // Display Polarization
    const polarizationSection = document.createElement("div");
    if (request.polarization) {
      polarizationSection.innerHTML = `
        <h2>Polarization Analysis</h2>
        <p>Positive Comments: ${request.polarization.positive}</p>
        <p>Negative Comments: ${request.polarization.negative}</p>
        <p>Neutral Comments: ${request.polarization.neutral}</p>
        <p>Polarization Score: ${request.polarization.polarization.toFixed(2)}</p>
      `;
    } else {
      polarizationSection.innerHTML = `<h2>Polarization Analysis</h2><p>No polarization data available.</p>`;
    }
    resultsDiv.appendChild(polarizationSection);

    // Display Relevant Comments
    const relevantCommentsSection = document.createElement("div");
    if (request.relevantComments && request.relevantComments.length > 0) {
      let commentsHtml = "<h2>Most Relevant Comments</h2><ul>";
      request.relevantComments.forEach(comment => {
        commentsHtml += `<li><strong>Author:</strong> ${comment.author} (Score: ${comment.score}, Sentiment: ${comment.sentiment ? comment.sentiment.label : "N/A"})<br>${comment.body}</li>`;
      });
      commentsHtml += "</ul>";
      relevantCommentsSection.innerHTML = commentsHtml;
    } else {
      relevantCommentsSection.innerHTML = `<h2>Most Relevant Comments</h2><p>No relevant comments found.</p>`;
    }
    resultsDiv.appendChild(relevantCommentsSection);

    // Display all comments with sentiment (for debugging/detailed view)
    const allCommentsSection = document.createElement("div");
    if (request.comments && request.comments.length > 0) {
      let allCommentsHtml = "<h2>All Comments with Sentiment</h2>";
      function renderComment(comment) {
        const sentimentLabel = comment.sentiment ? comment.sentiment.label : "N/A";
        const sentimentScore = comment.sentiment ? comment.sentiment.score.toFixed(2) : "N/A";
        allCommentsHtml += `<div style="margin-left: ${comment.depth * 20}px; border-left: 1px solid #ccc; padding-left: 5px; margin-bottom: 5px;">
          <strong>Author:</strong> ${comment.author} (Score: ${comment.score}, Sentiment: ${sentimentLabel} [${sentimentScore}])<br>
          ${comment.body}
        </div>`;
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.forEach(reply => renderComment(reply));
        }
      }
      request.comments.forEach(comment => renderComment(comment));
      allCommentsSection.innerHTML = allCommentsHtml;
    } else {
      allCommentsSection.innerHTML = `<h2>All Comments with Sentiment</h2><p>No comments found.</p>`;
    }
    resultsDiv.appendChild(allCommentsSection);
    sendResponse({ status: "success" });
  } else if (request.action === "displayAIResponse") {
    const resultsDiv = document.getElementById("results");
    const aiResponseSection = document.createElement("div");
    aiResponseSection.innerHTML = `<h2>AI Generated Response</h2><p>${request.aiResponse || "No AI response generated."}</p>`;
    resultsDiv.appendChild(aiResponseSection);
  }
});
