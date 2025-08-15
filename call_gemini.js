import { GEMINI_API_KEY, GEMINI_MODEL, GEMINI_RESUME_PROMPT } from './config.js';


/**
 * Generic function to call Gemini API with a given prompt.
 */
async function callGeminiAPI(prompt) {
  console.log("Calling Gemini API...");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error: ${res.status} - ${errorText || res.statusText}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}


/**
 * Generates a summary from the given text.
 */
export async function generateSummary(text) {
  console.log("Generating summary...");
  return await callGeminiAPI(`${GEMINI_RESUME_PROMPT}\n\n${text}`);
}

/**
 * Generates a chat response given a message and context.
 */
export async function generateChatResponse(message, context) {
  const prompt = `The user asked: "${message}".\n\nHere is the page content for reference:\n${context}`;
  return await callGeminiAPI(prompt);
}
