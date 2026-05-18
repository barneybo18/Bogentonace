export const SAP_AGENT_ID =
  process.env.NEXT_PUBLIC_SAP_AGENT_ID || "";

export const SYNAPSE_SENTINEL_AGENT =
  "Ccr2yK3hLALU4p8oNRqrh4dGuvPJTth5KCLMio8cE1ph";

// Ace Data Cloud — pick 3+ of these API slugs for Cat. 2 compliance
export const ACEDATA_SERVICES = {
  textSummary:    "/v1/text/summary",
  imageAnalysis:  "/v1/vision/analyze",
  dataExtract:    "/v1/document/extract",
  translation:    "/v1/text/translate",
  sentiment:      "/v1/text/sentiment",
} as const;

// SOL token mint (for payment amounts if using SPL)
export const SOL_MINT = "So11111111111111111111111111111111111111112";
