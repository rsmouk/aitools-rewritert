import { getSupabase } from "@/lib/supabase";
import { fail, HttpError, ok } from "@/lib/route";
import type { TemplateType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json()) as { name?: string; type?: string; content?: string };
    const name = body.name?.trim();
    const content = body.content?.trim();
    if (!name || !content) throw new HttpError("Name and content are required.", 400);
    if (body.type !== "writing" && body.type !== "checking") {
      throw new HttpError("Template type must be writing or checking.", 400);
    }
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("instruction_templates")
      .update({ name, type: body.type as TemplateType, content })
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
    const { error } = await supabase.from("instruction_templates").delete().eq("id", params.id);
    if (error) throw new Error(error.message);
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
