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
      prompt?: string;
      model?: string;
      templateId?: string;
    };
    const prompt = body.prompt?.trim() || "";
    if (!prompt) throw new HttpError("Write a prompt first.", 400);
    if (!body.model) throw new HttpError("Choose an AI model.", 400);

    let instructions = "";
    if (body.templateId) {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("instruction_templates")
        .select("content, type")
        .eq("id", body.templateId)
        .single();
      if (error) throw new Error(error.message);
      if (data.type !== "writing") throw new HttpError("Choose a writing template.", 400);
      instructions = data.content || "";
    }

    const { provider, model } = parseModelValue(body.model);
    const article = await runArticleModel(
      provider,
      model,
      `${instructions ? `Writing instructions:\n${applyTemplate(instructions, { prompt })}\n\n` : ""}User request:\n${prompt}`
    );

    return ok({
      ...article,
      slug: toSlug(article.slug || article.title),
    });
  } catch (error) {
    return fail(error);
  }
}
