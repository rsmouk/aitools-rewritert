import "server-only";
import OpenAI from "openai";

export async function generateWithOpenAI(apiKey: string, model: string, system: string, user: string) {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model,
    temperature: 0.7,
    max_tokens: 8000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return response.choices[0]?.message?.content?.trim() || "";
}
