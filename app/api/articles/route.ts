import { getSupabase } from "@/lib/supabase";
import { fail, HttpError, ok } from "@/lib/route";
import type { ArticleStatus } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim() !== "").map((item) => item.trim()) : [];
}

function articleRow(body: {
  title?: string;
  description?: string;
  slug?: string;
  content?: string;
  categories?: unknown;
  tags?: unknown;
  featured_image_url?: string | null;
  wp_post_id?: number | null;
  status?: string;
}) {
  const status: ArticleStatus =
    body.status === "draft" || body.status === "published" || body.status === "saved" ? body.status : "saved";
  const image = body.featured_image_url?.trim() || "";
  return {
    title: body.title?.trim() || "Untitled",
    description: body.description?.trim() || "",
    slug: body.slug?.trim() || "",
    content: body.content || "",
    categories: cleanList(body.categories),
    tags: cleanList(body.tags),
    featured_image_url: /^https?:\/\//i.test(image) ? image : null,
    wp_post_id: typeof body.wp_post_id === "number" ? body.wp_post_id : null,
    status,
  };
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("generated_articles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ok(data ?? []);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.title?.trim() && !body?.content?.trim()) {
      throw new HttpError("Add a title or content before saving.", 400);
    }
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("generated_articles")
      .insert(articleRow(body))
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return ok(data, 201);
  } catch (error) {
    return fail(error);
  }
}
