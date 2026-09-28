import { htmlToMarkdown } from "@/lib/markdown";
import { fail, ok } from "@/lib/route";
import { wpFetch } from "@/lib/wordpress";
import type { WpPostList } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const perPage = 10;
    const data = await wpFetch<WpPostList>(`/posts?page=${page}&per_page=${perPage}`);
    return ok({
      ...data,
      posts: (data.posts || []).map((post) => ({
        ...post,
        content: htmlToMarkdown(post.content || ""),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}
