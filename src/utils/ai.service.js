// import dotenv from 'dotenv';
// dotenv.config({
//   path: '../.env'
// })
import { InferenceClient } from '@huggingface/inference';
import { VoyageAIClient } from 'voyageai';

// --- Setup for AI Clients ---
const voyageClient = new VoyageAIClient({ apiKey: "pa-jAuzCIcrm2tH-fA9ox31_TjiDVd-EwoTu4GDqVe87W0" });
const hf = new InferenceClient(process.env.HUGGING_FACE_API_KEY);

// --- Model Definitions ---
const VOYAGE_MODEL = process.env.VOYAGE_MODEL || "voyage-lite-02-instruct";
const SUMMARIZATION_MODEL = "facebook/bart-large-cnn";
const CLASSIFICATION_MODEL = "facebook/bart-large-mnli"; // Model for zero-shot classification

// console.log("Voyage API Key:", process.env.VOYAGE_API_KEY ? "Loaded ✅" : "Missing ❌");


// --- AI Functions ---

export async function generateQueryEmbedding(queryText) {
  try {
    const response = await voyageClient.embed({ input: queryText, model: VOYAGE_MODEL, input_type: 'query' });

    // ✅ CORRECTED: Check for the embedding at response.data[0].embedding
    if (response && response.data && response.data[0] && response.data[0].embedding) {
      return response.data[0].embedding;
    }
    
    // This will run if the structure is not what we expect
    console.error("Unexpected response structure from Voyage AI:", JSON.stringify(response, null, 2));
    throw new Error("Invalid response from Voyage AI: No embeddings found.");

  } catch(error) {
    console.error("Full error from Voyage AI client:", error);
    throw new Error("Failed to generate query embedding due to an API error.");
  }
}

export async function generateSummary(textToSummarize) {
  // ... (this function remains unchanged)
  try {
    const response = await hf.summarization({ model: SUMMARIZATION_MODEL, inputs: textToSummarize });
    return `<p>${response.summary_text}</p>`;
  } catch (error) {
    console.error("Hugging Face summarization error:", error);
    throw new Error("Failed to generate summary.");
  }
}

// ✅ NEW, SMARTER AI TAGGING FUNCTION
export async function generateAITagWithModel(content) {
  // Define the candidate tags the model can choose from.
  const candidateLabels = ["Technology", "Meeting Notes", "Project Idea", "Personal", "Work", "Code Snippet"];
  
  // Clean the HTML from the content to get plain text
  const plainTextContent = content.replace(/<[^>]*>?/gm, ' ');

  try {
    const response = await hf.zeroShotClassification({
      model: CLASSIFICATION_MODEL,
      inputs: plainTextContent,
      parameters: { candidate_labels: candidateLabels }
    });

    // The model returns a list of labels sorted by score. We take the one with the highest score.
    if (response && response.length > 0) {
      return response[0].label; // Return the top-scoring label
    }
    return "General"; // Fallback if the model fails
  } catch (error) {
    console.error("Hugging Face classification error:", error);
    // Fallback to your original simple tagging logic if the AI service fails
    return generateAITag(content);
  }
}

// Your original, simple tagging function (used as a fallback)
export function generateAITag(content) {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes("express") || lowerContent.includes("node")) return "Backend-Dev";
    if (lowerContent.includes("meeting") || lowerContent.includes("agenda")) return "Meeting-Notes";
    if (lowerContent.includes("idea") || lowerContent.includes("project")) return "Project-Idea";
    return "General";
}

// --- Add this new function to ai.service.js ---
export async function generateDocumentEmbedding(docText) {
  try {
    // Clean the HTML from the content to get plain text
    const plainText = docText.replace(/<[^>]*>?/gm, ' ');
    const response = await voyageClient.embed({ input: plainText, model: VOYAGE_MODEL, input_type: 'document' });

    if (response && response.data && response.data[0] && response.data[0].embedding) {
      return response.data[0].embedding;
    }

    console.error("Unexpected document embedding response:", JSON.stringify(response, null, 2));
    throw new Error("Invalid response from Voyage AI for document.");

  } catch(error) {
    console.error("Full error from Voyage AI document embedding:", error);
    throw new Error("Failed to generate document embedding.");
  }
}