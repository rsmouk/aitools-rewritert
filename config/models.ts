import type { AIModelOption, ProviderId } from "@/types";

export const AI_MODELS: AIModelOption[] = [
  { id: "gpt-4o", label: "GPT-4o", provider: "openai" },
  { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "openai" },
  { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", provider: "gemini" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", provider: "gemini" },
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite", provider: "gemini" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", provider: "gemini" },
  {
    id: "meta-llama/llama-3-8b-instruct:free",
    label: "Llama 3 8B",
    provider: "openrouter",
    free: true,
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    label: "Mistral 7B",
    provider: "openrouter",
    free: true,
  },
  {
    id: "google/gemma-2-9b-it:free",
    label: "Gemma 2 9B",
    provider: "openrouter",
    free: true,
  },
  {
    id: "qwen/qwen-2-7b-instruct:free",
    label: "Qwen 2 7B",
    provider: "openrouter",
    free: true,
  },
  {
    id: "huggingfaceh4/zephyr-7b-beta:free",
    label: "Zephyr 7B",
    provider: "openrouter",
    free: true,
  },
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini", provider: "openrouter" },
  { id: "anthropic/claude-3.5-haiku", label: "Claude 3.5 Haiku", provider: "openrouter" },
  { id: "google/gemini-3.8-flash", label: "Gemini 3.8 Flash", provider: "openrouter" },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    label: "Llama 3.1 70B",
    provider: "openrouter",
  },
  { id: "mistralai/mistral-small", label: "Mistral Small", provider: "openrouter" },
];

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  openai: "OpenAI",
  gemini: "Gemini",
  openrouter: "OpenRouter",
};

export function modelValue(model: AIModelOption) {
  return `${model.provider}:${model.id}`;
}

export function parseModelValue(value: string): { provider: ProviderId; model: string } {
  const index = value.indexOf(":");
  const provider = value.slice(0, index) as ProviderId;
  const model = value.slice(index + 1);
  if (provider !== "openai" && provider !== "gemini" && provider !== "openrouter") {
    throw new Error("Unknown AI provider.");
  }
  if (!model) throw new Error("Choose an AI model.");
  return { provider, model };
}

export function findModel(value: string) {
  const { provider, model } = parseModelValue(value);
  return AI_MODELS.find((item) => item.provider === provider && item.id === model) ?? null;
}
