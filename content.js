let cleanReadModeActive = false;
let highlightedComments = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeComments") {
    const url = window.location.href;
    const regex = /reddit\\.com\\/r\\/([^\\/]+)\\/comments\\/([^\\/]+)/;
    const match = url.match(regex);

    if (match && match.length >= 3) {
      const subreddit = match[1];
      const articleId = match[2];
      console.log(`Subreddit: ${subreddit}, Article ID: ${articleId}`);

      chrome.runtime.sendMessage({action: "fetchComments", subreddit: subreddit, articleId: articleId}, (response) => {
        if (response && response.status === "success") {
          sendResponse({status: "success", message: "Comment fetching initiated by background script."});
        } else {
          sendResponse({status: "error", message: "Failed to initiate comment fetching in background script."});
        }
      });
      return true; 
    } else {
      sendResponse({status: "error", message: "Not a valid Reddit comment thread URL."});
    }
  } else if (request.action === "toggleCleanReadMode") {
    toggleCleanReadMode(request.relevantComments);
  }
});

function toggleCleanReadMode(relevantComments) {
  cleanReadModeActive = !cleanReadModeActive;

  if (cleanReadModeActive) {
    // Hide non-essential elements
    document.querySelectorAll("header, ._1O4jTk-dZ-VIOTisY5G3_U, ._396c-E_--_hIAnj1y_x4Y-, ._2_V_52I2-2L144-5H_2G_7, ._1r4smTyOEZp1i14_--2_V_5").forEach(el => el.style.display = 'none');

    // Highlight relevant comments
    if (relevantComments) {
      highlightedComments = relevantComments;
      relevantComments.forEach(comment => {
        const commentElement = document.getElementById(`t1_${comment.id}`);
        if (commentElement) {
          commentElement.style.border = "2px solid #FF4500";
          commentElement.style.padding = "10px";
          commentElement.style.borderRadius = "5px";
        }
      });
    }
  } else {
    // Restore hidden elements
    document.querySelectorAll("header, ._1O4jTk-dZ-VIOTisY5G3_U, ._396c-E_--_hIAnj1y_x4Y-, ._2_V_52I2-2L144-5H_2G_7, ._1r4smTyOEZp1i14_--2_V_5").forEach(el => el.style.display = '');

    // Remove highlights
    highlightedComments.forEach(comment => {
      const commentElement = document.getElementById(`t1_${comment.id}`);
      if (commentElement) {
        commentElement.style.border = "";
        commentElement.style.padding = "";
        commentElement.style.borderRadius = "";
      }
    });
    highlightedComments = [];
  }
}
