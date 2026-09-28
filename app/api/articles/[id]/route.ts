import { getSupabase } from "@/lib/supabase";
import { fail, HttpError, ok } from "@/lib/route";
import type { ArticleStatus } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "").map((item) => item.trim())
    : [];
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const status: ArticleStatus =
      body.status === "draft" || body.status === "published" || body.status === "saved" ? body.status : "saved";
    const image = typeof body.featured_image_url === "string" ? body.featured_image_url.trim() : "";
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("generated_articles")
      .update({
        title: body.title?.trim() || "Untitled",
        description: body.description?.trim() || "",
        slug: body.slug?.trim() || "",
        content: body.content || "",
        categories: cleanList(body.categories),
        tags: cleanList(body.tags),
        featured_image_url: /^https?:\/\//i.test(image) ? image : null,
        wp_post_id: typeof body.wp_post_id === "number" ? body.wp_post_id : null,
        status,
      })
      .eq("id", params.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("generated_articles").delete().eq("id", params.id);
    if (error) throw new Error(error.message);
    return ok({ ok: true });
  } catch (error) {
    return fail(error instanceof Error ? error : new HttpError("Could not delete the article.", 500));
  }
}
