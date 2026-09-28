export const JSON_SYSTEM_PROMPT = `Respond ONLY with a valid JSON object. No markdown fences. No explanation.
Format:
{
  "title": "...",
  "description": "...",
  "slug": "english-slug-here",
  "content": "full markdown content here",
  "suggested_categories": ["cat1", "cat2"],
  "suggested_tags": ["tag1", "tag2"],
  "changes_summary": ["change 1", "change 2"]
}
Use an empty changes_summary array when you are writing a new article.
The slug must be lowercase English words separated by hyphens.
The content field must be markdown.`;

export function applyTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function parseAIJson(raw: string) {
  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) text = fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("The model did not return valid JSON.");
  }

  const list = (value: unknown) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

  return {
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    slug: typeof data.slug === "string" ? data.slug : "",
    content: typeof data.content === "string" ? data.content : "",
    suggested_categories: list(data.suggested_categories),
    suggested_tags: list(data.suggested_tags),
    changes_summary: list(data.changes_summary),
  };
}
