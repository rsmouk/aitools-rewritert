import "server-only";
import { GoogleGenAI } from "@google/genai";

function usesThinkingLevel(model: string) {
  return /^gemini-3\.(5|6|7|8)/.test(model);
}

export async function generateWithGemini(apiKey: string, model: string, system: string, user: string) {
  const client = new GoogleGenAI({ apiKey });
  const interaction = await client.interactions.create({
    model,
    input: user,
    system_instruction: system,
    store: false,
    generation_config: {
      max_output_tokens: 8192,
      ...(usesThinkingLevel(model) ? { thinking_level: "low" as const } : {}),
    },
  });
  const text = interaction.output_text?.trim() || "";
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}
