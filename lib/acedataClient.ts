import axios from "axios";

const BASE = process.env.ACEDATA_BASE_URL || "https://api.acedata.cloud";
const KEY  = process.env.ACEDATA_API_KEY!;

const client = axios.create({
  baseURL: BASE,
  headers: { Authorization: `Bearer ${KEY}` },
});

// Service 1: Summarize invoice/payment description
export async function summarizeText(text: string): Promise<string> {
  const res = await client.post("/v1/text/summary", { text, max_length: 100 });
  return res.data.summary;
}

// Service 2: Extract structured data from a document/receipt
export async function extractDocumentData(content: string): Promise<Record<string, unknown>> {
  const res = await client.post("/v1/document/extract", { content });
  return res.data.fields;
}

// Service 3: Sentiment analysis on payment notes
export async function analyzeSentiment(text: string): Promise<{ label: string; score: number }> {
  const res = await client.post("/v1/text/sentiment", { text });
  return { label: res.data.label, score: res.data.score };
}

// Bonus Service 4: Translate description (optional, extra API diversity)
export async function translateText(text: string, targetLang: string): Promise<string> {
  const res = await client.post("/v1/text/translate", { text, target: targetLang });
  return res.data.translated;
}
