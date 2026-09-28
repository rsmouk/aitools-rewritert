import { fail, HttpError, ok } from "@/lib/route";
import { parseModelValue } from "@/config/models";
import { getSupabase } from "@/lib/supabase";
import { applyTemplate } from "@/lib/ai/prompt";
import { runArticleModel } from "@/lib/ai";
import { toSlug } from "@/lib/slugify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      model?: string;
      templateId?: string;
      article?: {
        title?: string;
        description?: string;
        slug?: string;
        content?: string;
        categories?: string[];
        tags?: string[];
      };
    };
    if (!body.model) throw new HttpError("Choose an AI model.", 400);
    if (!body.templateId) throw new HttpError("Choose a checking template.", 400);
    const article = body.article;
    if (!article?.content?.trim() && !article?.title?.trim()) {
      throw new HttpError("Add article content before verifying.", 400);
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("instruction_templates")
      .select("content, type")
      .eq("id", body.templateId)
      .single();
    if (error) throw new Error(error.message);
    if (data.type !== "checking") throw new HttpError("Choose a checking template.", 400);

    const vars = {
      title: article.title || "",
      description: article.description || "",
      slug: article.slug || "",
      content: article.content || "",
    };
    const instructions = applyTemplate(data.content || "", vars);
    const { provider, model } = parseModelValue(body.model);
    const rewritten = await runArticleModel(
      provider,
      model,
      `${instructions}\n\nArticle to check:\nTitle: ${vars.title}\nDescription: ${vars.description}\nSlug: ${vars.slug}\nCategories: ${(article.categories || []).join(", ")}\nTags: ${(article.tags || []).join(", ")}\nContent:\n${vars.content}`
    );

    return ok({
      ...rewritten,
      slug: toSlug(rewritten.slug || rewritten.title),
      categories: rewritten.suggested_categories.length
        ? rewritten.suggested_categories
        : article.categories || [],
      tags: rewritten.suggested_tags.length ? rewritten.suggested_tags : article.tags || [],
    });
  } catch (error) {
    return fail(error);
  }
}
