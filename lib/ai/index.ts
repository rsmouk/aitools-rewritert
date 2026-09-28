import "server-only";
import type { ProviderId } from "@/types";
import { getSettings } from "@/lib/settings";
import { HttpError } from "@/lib/route";
import { generateWithOpenAI } from "@/lib/ai/openai";
import { generateWithGemini } from "@/lib/ai/gemini";
import { generateWithOpenRouter } from "@/lib/ai/openrouter";
import { JSON_SYSTEM_PROMPT, parseAIJson } from "@/lib/ai/prompt";

const KEY_BY_PROVIDER: Record<ProviderId, "openai_api_key" | "gemini_api_key" | "openrouter_api_key"> = {
  openai: "openai_api_key",
  gemini: "gemini_api_key",
  openrouter: "openrouter_api_key",
};

export async function runArticleModel(provider: ProviderId, model: string, user: string) {
  const settings = await getSettings();
  const apiKey = settings[KEY_BY_PROVIDER[provider]];
  if (!apiKey) {
    throw new HttpError(`Add the ${provider} API key in Admin settings.`, 400);
  }

  let raw = "";
  if (provider === "openai") raw = await generateWithOpenAI(apiKey, model, JSON_SYSTEM_PROMPT, user);
  if (provider === "gemini") raw = await generateWithGemini(apiKey, model, JSON_SYSTEM_PROMPT, user);
  if (provider === "openrouter") {
    raw = await generateWithOpenRouter(apiKey, model, JSON_SYSTEM_PROMPT, user);
  }
  if (!raw) throw new Error("The model returned an empty response.");
  return parseAIJson(raw);
}
