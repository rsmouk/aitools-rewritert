import "server-only";
import TurndownService from "turndown";
import { marked } from "marked";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

export function htmlToMarkdown(html: string) {
  const source = html?.trim() ?? "";
  if (!source) return "";
  if (!/<[a-z][\s\S]*>/i.test(source)) return source;
  return turndown.turndown(source);
}

export function markdownToHtml(markdown: string) {
  const source = markdown?.trim() ?? "";
  if (!source) return "";
  return marked.parse(source, { async: false, gfm: true }) as string;
}
