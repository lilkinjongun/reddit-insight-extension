// Importar a biblioteca transformers.min.js
importScripts('./lib/transformers.min.js');
const { pipeline } = self.transformers;

let sentimentPipeline = null;
let summarizationPipeline = null;

async function initializeSentimentPipeline() {
  if (!sentimentPipeline) {
    console.log("Worker: Initializing sentiment analysis pipeline...");
    try {
      sentimentPipeline = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { quantized: true } // Use quantized model for better performance
      );
      console.log("Worker: Sentiment analysis pipeline initialized.");
    } catch (error) {
      console.error("Worker: Error initializing sentiment analysis pipeline:", error);
    }
  }
}

async function initializeSummarizationPipeline() {
  if (!summarizationPipeline) {
    console.log("Worker: Initializing summarization pipeline...");
    try {
      summarizationPipeline = await pipeline(
        'summarization',
        'Xenova/distilbart-cnn-6-6',
        { quantized: true } // Use quantized model for better performance
      );
      console.log("Worker: Summarization pipeline initialized.");
    } catch (error) {
      console.error("Worker: Error initializing summarization pipeline:", error);
    }
  }
}

async function analyzeSentiment(comments) {
  if (!sentimentPipeline) {
    await initializeSentimentPipeline();
  }

  if (!sentimentPipeline) {
    console.error("Worker: Sentiment pipeline not available for analysis.");
    return comments;
  }

  // Collect all comment bodies for batch processing
  const textsToAnalyze = [];
  const commentReferences = [];

  function collectTexts(comment) {
    if (comment.body) {
      textsToAnalyze.push(comment.body);
      commentReferences.push(comment);
    }
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.forEach(collectTexts);
    }
  }
  comments.forEach(collectTexts);

  if (textsToAnalyze.length > 0) {
    try {
      // Batch sentiment analysis
      const results = await sentimentPipeline(textsToAnalyze);
      results.forEach((result, index) => {
        commentReferences[index].sentiment = result; // Assuming result is an array like [{label: 'POSITIVE', score: 0.99}]
      });
    } catch (error) {
      console.error("Worker: Error during batch sentiment analysis:", error);
      // Fallback for errors: assign neutral sentiment
      commentReferences.forEach(comment => {
        comment.sentiment = { label: 'NEUTRAL', score: 0 };
      });
    }
  }
  return comments;
}

async function generateSummary(text) {
  if (!summarizationPipeline) {
    await initializeSummarizationPipeline();
  }

  if (!summarizationPipeline) {
    console.error("Worker: Summarization pipeline not available.");
    return "";
  }

  try {
    const result = await summarizationPipeline(text);
    return result[0].summary_text;
  } catch (error) {
    console.error("Worker: Error generating summary:", error);
    return "";
  }
}

self.onmessage = async (event) => {
  const { action, comments, allCommentText } = event.data;

  if (action === 'analyzeComments') {
    self.postMessage({ status: 'progress', message: 'Initializing AI models...' });
    await initializeSentimentPipeline();
    await initializeSummarizationPipeline();
    self.postMessage({ status: 'progress', message: 'Analyzing sentiment...' });
    const analyzedComments = await analyzeSentiment(comments);
    self.postMessage({ status: 'progress', message: 'Generating summary...' });
    const summary = await generateSummary(allCommentText);
    self.postMessage({ status: 'completed', analyzedComments, summary });
  }
};
