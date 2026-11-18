import OpenAI from "openai";

// Replit credentials take precedence. Local AI settings are loaded by pnpm dev.
const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? process.env.OPENAI_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
export const aiConfigured = Boolean(apiKey || (process.env.LOCAL_DEV === "1" && baseURL));
export const openai = new OpenAI({
  apiKey: apiKey ?? "local-model",
  baseURL,
  timeout: 120_000,
  maxRetries: 0,
});
