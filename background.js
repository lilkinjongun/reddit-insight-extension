import { pipeline } from './lib/transformers.min.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log("Reddit Insight Extension installed.");
});

let sentimentPipeline = null;
let summarizationPipeline = null;
let lastAnalysisResults = null; // Store the last analysis results for export and AI response

async function initializeSentimentPipeline() {
  if (!sentimentPipeline) {
    console.log("Initializing sentiment analysis pipeline...");
    try {
      sentimentPipeline = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { quantized: true } // Use quantized model for better performance
      );
      console.log("Sentiment analysis pipeline initialized.");
    } catch (error) {
      console.error("Error initializing sentiment analysis pipeline:", error);
    }
  }
}

async function initializeSummarizationPipeline() {
  if (!summarizationPipeline) {
    console.log("Initializing summarization pipeline...");
    try {
      summarizationPipeline = await pipeline(
        'summarization',
        'Xenova/distilbart-cnn-6-6',
        { quantized: true } // Use quantized model for better performance
      );
      console.log("Summarization pipeline initialized.");
    } catch (error) {
      console.error("Error initializing summarization pipeline:", error);
    }
  }
}

function extractComments(data) {
  const comments = [];

  function parseComment(comment) {
    if (comment.kind === 't1' && comment.data) {
      const commentData = {
        id: comment.data.id,
        author: comment.data.author,
        body: comment.data.body,
        score: comment.data.score,
        created_utc: comment.data.created_utc,
        replies: []
      };

      if (comment.data.replies && comment.data.replies.data && comment.data.replies.data.children) {
        comment.data.replies.data.children.forEach(reply => {
          const parsedReply = parseComment(reply);
          if (parsedReply) {
            commentData.replies.push(parsedReply);
          }
        });
      }
      return commentData;
    }
    return null;
  }

  if (data && data.length > 1 && data[1].data && data[1].data.children) {
    data[1].data.children.forEach(item => {
      const comment = parseComment(item);
      if (comment) {
        comments.push(comment);
      }
    });
  }
  return comments;
}

async function analyzeSentiment(comments) {
  if (!sentimentPipeline) {
    await initializeSentimentPipeline();
  }

  if (!sentimentPipeline) {
    console.error("Sentiment pipeline not available for analysis.");
    return comments;
  }

  for (const comment of comments) {
    if (comment.body) {
      try {
        const result = await sentimentPipeline(comment.body);
        comment.sentiment = result[0]; // Assuming result is an array like [{label: 'POSITIVE', score: 0.99}]
      } catch (error) {
        console.error(`Error analyzing sentiment for comment ${comment.id}:`, error);
        comment.sentiment = { label: 'NEUTRAL', score: 0 }; // Default to neutral on error
      }
    }
    if (comment.replies.length > 0) {
      await analyzeSentiment(comment.replies); // Recursively analyze replies
    }
  }
  return comments;
}

async function generateSummary(text) {
  if (!summarizationPipeline) {
    await initializeSummarizationPipeline();
  }

  if (!summarizationPipeline) {
    console.error("Summarization pipeline not available.");
    return "";
  }

  try {
    const result = await summarizationPipeline(text);
    return result[0].summary_text;
  } catch (error) {
    console.error("Error generating summary:", error);
    return "";
  }
}

function calculatePolarization(comments) {
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  let totalScore = 0;
  let commentCount = 0;

  function countSentiment(comment) {
    if (comment.sentiment) {
      commentCount++;
      totalScore += comment.sentiment.score;
      if (comment.sentiment.label === 'POSITIVE') {
        positiveCount++;
      } else if (comment.sentiment.label === 'NEGATIVE') {
        negativeCount++;
      } else {
        neutralCount++;
      }
    }
    comment.replies.forEach(countSentiment);
  }

  comments.forEach(countSentiment);

  const polarizationScore = commentCount > 0 ? Math.abs(positiveCount - negativeCount) / commentCount : 0;
  const overallSentiment = commentCount > 0 ? totalScore / commentCount : 0;

  return {
    positive: positiveCount,
    negative: negativeCount,
    neutral: neutralCount,
    polarization: polarizationScore,
    overallSentiment: overallSentiment
  };
}

async function identifyRelevantComments(comments, summaryKeywords) {
  const relevantComments = [];

  function scoreComment(comment) {
    let relevance = 0;
    relevance += comment.score || 0;

    if (comment.sentiment) {
      relevance += Math.abs(comment.sentiment.score) * 10; 
    }

    if (summaryKeywords && comment.body) {
      const lowerCaseBody = comment.body.toLowerCase();
      summaryKeywords.forEach(keyword => {
        if (lowerCaseBody.includes(keyword.toLowerCase())) {
          relevance += 5; 
        }
      });
    }
    comment.relevanceScore = relevance;
    relevantComments.push(comment);

    comment.replies.forEach(scoreComment);
  }

  comments.forEach(scoreComment);

  relevantComments.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return relevantComments.slice(0, 5);
}

function addDepthToComments(comments, depth = 0) {
  comments.forEach(comment => {
    comment.depth = depth;
    if (comment.replies && comment.replies.length > 0) {
      addDepthToComments(comment.replies, depth + 1);
    }
  });
}

function formatResultsAsMarkdown(results) {
  let markdown = `# Reddit Thread Analysis\n\n`;

  markdown += `## Summary\n\n${results.summary || "No summary available."}\n\n`;

  if (results.polarization) {
    markdown += `## Polarization Analysis\n\n`;
    markdown += `- Positive Comments: ${results.polarization.positive}\n`;
    markdown += `- Negative Comments: ${results.polarization.negative}\n`;
    markdown += `- Neutral Comments: ${results.polarization.neutral}\n`;
    markdown += `- Polarization Score: ${results.polarization.polarization.toFixed(2)}\n\n`;
  }

  if (results.relevantComments && results.relevantComments.length > 0) {
    markdown += `## Most Relevant Comments\n\n`;
    results.relevantComments.forEach(comment => {
      markdown += `- **Author:** ${comment.author} (Score: ${comment.score}, Sentiment: ${comment.sentiment ? comment.sentiment.label : 'N/A'})\n`;
      markdown += `  ${comment.body}\n\n`;
    });
  }

  markdown += `## All Comments with Sentiment\n\n`;
  function renderCommentMarkdown(comment) {
    const sentimentLabel = comment.sentiment ? comment.sentiment.label : 'N/A';
    const sentimentScore = comment.sentiment ? comment.sentiment.score.toFixed(2) : 'N/A';
    const indent = '  '.repeat(comment.depth);
    markdown += `${indent}- **Author:** ${comment.author} (Score: ${comment.score}, Sentiment: ${sentimentLabel} [${sentimentScore}])\n`;
    markdown += `${indent}  ${comment.body}\n\n`;
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(reply => renderCommentMarkdown(reply));
    }
  }
  results.comments.forEach(comment => renderCommentMarkdown(comment));

  return markdown;
}

async function generateAIResponse(analysisResults, apiKey) {
  if (!analysisResults || !apiKey) {
    console.error("Missing analysis results or API key for AI response generation.");
    return "";
  }

  const prompt = `Based on the following Reddit thread analysis:\n\n` +
                 `Summary: ${analysisResults.summary}\n\n` +
                 `Polarization: Positive: ${analysisResults.polarization.positive}, Negative: ${analysisResults.polarization.negative}, Neutral: ${analysisResults.polarization.neutral}, Score: ${analysisResults.polarization.polarization.toFixed(2)}\n\n` +
                 `Most Relevant Comments:\n` +
                 analysisResults.relevantComments.map(c => `- ${c.body} (Sentiment: ${c.sentiment ? c.sentiment.label : 'N/A'})`).join('\n') + `\n\n` +
                 `Generate a concise, intelligent response or comment that summarizes the discussion and highlights key points, considering the sentiment and polarization.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error.message}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return `Failed to generate AI response: ${error.message}`;
  }
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "analyzeComments") {
    const url = sender.tab.url;
    const regex = /reddit\.com\/r\/([^\/]+)\/comments\/([^\/]+)/;
    const match = url.match(regex);

    if (!match || match.length < 3) {
      chrome.runtime.sendMessage(sender.tab.id, { action: "displayResults", status: "error", message: "Not a valid Reddit comment thread URL." });
      sendResponse({ status: "error", message: "Not a valid Reddit comment thread URL." });
      return;
    }

    const subreddit = match[1];
    const articleId = match[2];
    const redditApiUrl = `https://www.reddit.com/r/${subreddit}/comments/${articleId}.json?raw_json=1`;

    console.log(`Fetching comments from: ${redditApiUrl}`);

    try {
      const response = await fetch(redditApiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      let extractedComments = extractComments(data);
      console.log("Extracted comments before analysis:", extractedComments);

      extractedComments = await analyzeSentiment(extractedComments);
      console.log("Extracted comments after sentiment analysis:", extractedComments);

      const polarizationData = calculatePolarization(extractedComments);
      console.log("Polarization data:", polarizationData);

      let allCommentText = "";
      function collectText(comment) {
        if (comment.body) {
          allCommentText += comment.body + " ";
        }
        comment.replies.forEach(collectText);
      }
      extractedComments.forEach(collectText);

      const summary = await generateSummary(allCommentText);
      console.log("Generated summary:", summary);

      const summaryKeywords = summary.split(/\s+/).filter(word => word.length > 3);

      const topRelevantComments = await identifyRelevantComments(extractedComments, summaryKeywords);
      console.log("Top relevant comments:", topRelevantComments);

      addDepthToComments(extractedComments); // Add depth before sending to popup

      lastAnalysisResults = { // Store results for export and AI response
        comments: extractedComments,
        summary: summary,
        polarization: polarizationData,
        relevantComments: topRelevantComments
      };

      // Send all results to the popup
      chrome.runtime.sendMessage(sender.tab.id, {
        action: "displayResults",
        comments: extractedComments,
        summary: summary,
        polarization: polarizationData,
        relevantComments: topRelevantComments
      });

      sendResponse({ status: "success", message: "Analysis complete and results sent to popup." });

    } catch (error) {
      console.error("Error fetching, analyzing or summarizing comments:", error);
      chrome.runtime.sendMessage(sender.tab.id, { action: "displayResults", status: "error", message: error.message });
      sendResponse({ status: "error", message: error.message });
    }

    return true; 
  } else if (request.action === "exportResults") {
    if (!lastAnalysisResults) {
      console.error("No analysis results to export.");
      return;
    }

    const filename = `reddit_insight_${Date.now()}`;
    let content = "";
    let mimeType = "";
    let extension = "";

    if (request.format === "md") {
      content = formatResultsAsMarkdown(lastAnalysisResults);
      mimeType = "text/markdown";
      extension = "md";
    } else if (request.format === "pdf") {
      // For PDF, we'll generate Markdown first and then convert it.
      // This requires a separate library or a more complex approach.
      // For now, we'll just export a markdown file and inform the user.
      content = formatResultsAsMarkdown(lastAnalysisResults);
      mimeType = "text/markdown";
      extension = "md";
      console.warn("PDF export is not fully implemented. Exporting as Markdown instead.");
      // In a real scenario, you'd use a library like jsPDF or html2pdf.js here.
      // These libraries are usually too large to include directly in a service worker
      // and might require a dedicated offscreen document or content script to run.
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: url,
      filename: `${filename}.${extension}`,
      saveAs: true
    });

  } else if (request.action === "toggleCleanReadMode") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "toggleCleanReadMode", relevantComments: lastAnalysisResults ? lastAnalysisResults.relevantComments : [] });
      }
    });
  } else if (request.action === "generateAIResponse") {
    if (!lastAnalysisResults) {
      console.error("No analysis results available to generate AI response.");
      chrome.runtime.sendMessage(sender.tab.id, { action: "displayAIResponse", aiResponse: "No analysis results available." });
      return;
    }

    chrome.storage.local.get(["openaiApiKey"], async (result) => {
      const apiKey = result.openaiApiKey;
      if (!apiKey) {
        console.error("OpenAI API Key not found in storage.");
        chrome.runtime.sendMessage(sender.tab.id, { action: "displayAIResponse", aiResponse: "OpenAI API Key not set. Please set it in the extension popup." });
        return;
      }

      const aiResponse = await generateAIResponse(lastAnalysisResults, apiKey);
      chrome.runtime.sendMessage(sender.tab.id, { action: "displayAIResponse", aiResponse: aiResponse });
    });
  }
});

initializeSentimentPipeline();
initializeSummarizationPipeline();
