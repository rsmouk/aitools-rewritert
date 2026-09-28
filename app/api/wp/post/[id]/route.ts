import { htmlToMarkdown } from "@/lib/markdown";
import { fail, ok } from "@/lib/route";
import { wpFetch } from "@/lib/wordpress";
import type { WpPostSummary } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const post = await wpFetch<WpPostSummary>(`/posts/${encodeURIComponent(params.id)}`);
    return ok({ ...post, content: htmlToMarkdown(post.content || "") });
  } catch (error) {
    return fail(error);
  }
}
