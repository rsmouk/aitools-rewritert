import { markdownToHtml } from "@/lib/markdown";
import { fail, HttpError, ok } from "@/lib/route";
import { wpFetch } from "@/lib/wordpress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      slug?: string;
      content?: string;
      categories?: string[];
      tags?: string[];
      status?: "publish" | "draft";
      featured_image_base64?: string;
      featured_image_filename?: string;
      featured_image_alt?: string;
      featured_image_description?: string;
    };

    if (!body.title?.trim()) throw new HttpError("Title is required.", 400);
    const status = body.status === "draft" ? "draft" : "publish";

    const result = await wpFetch<{
      post_id: number;
      post_url: string;
      status: string;
      slug?: string;
      featured_image_url?: string;
      image_error?: string;
    }>("/posts", {
      method: "POST",
      body: JSON.stringify({
        title: body.title,
        description: body.description || "",
        slug: body.slug || "",
        content: markdownToHtml(body.content || ""),
        categories: body.categories || [],
        tags: body.tags || [],
        status,
        featured_image_base64: body.featured_image_base64 || "",
        featured_image_filename: body.featured_image_filename || "",
        featured_image_alt: body.featured_image_alt || body.title,
        featured_image_description: body.featured_image_description || body.title,
      }),
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
