import axios from "axios";

const BASE = process.env.ACEDATA_BASE_URL || "https://api.acedata.cloud";
const KEY  = process.env.ACEDATA_API_KEY!;

const client = axios.create({
  baseURL: BASE,
  headers: { Authorization: `Bearer ${KEY}` },
});

// Helper for chat completions calls
async function callChatCompletions(prompt: string): Promise<string> {
  const res = await client.post("/v1/chat/completions", {
    model: "gemini-2.5-flash",
    messages: [{ role: "user", content: prompt }]
  });
  return res.data.choices[0].message.content.trim();
}

// Service 1: Summarize invoice/payment description
export async function summarizeText(text: string): Promise<string> {
  return await callChatCompletions(`Summarize this text in 80 characters or less: "${text}"`);
}

// Service 2: Extract structured data from a document/receipt
export async function extractDocumentData(content: string): Promise<Record<string, unknown>> {
  const raw = await callChatCompletions(`Extract key document fields from this text. Return ONLY a valid JSON object. No markdown, no backticks, no other text: "${content}"`);
  try {
    const clean = raw.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    return { rawContent: raw };
  }
}

// Service 3: Sentiment analysis on payment notes
export async function analyzeSentiment(text: string): Promise<{ label: string; score: number }> {
  const label = await callChatCompletions(`Analyze the sentiment of this text. Return ONLY a single word, either positive, negative, or neutral: "${text}"`);
  return {
    label: label.toLowerCase().replace(/[^a-z]/g, ''),
    score: 1.0
  };
}

// Bonus Service 4: Translate description (optional, extra API diversity)
export async function translateText(text: string, targetLang: string): Promise<string> {
  return await callChatCompletions(`Translate this text to ${targetLang}. Return ONLY the translation, no extra text: "${text}"`);
}
