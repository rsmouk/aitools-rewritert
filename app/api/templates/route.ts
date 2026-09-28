import { getSupabase } from "@/lib/supabase";
import { fail, HttpError, ok } from "@/lib/route";
import type { TemplateType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function assertType(value: unknown): TemplateType {
  if (value !== "writing" && value !== "checking") {
    throw new HttpError("Template type must be writing or checking.", 400);
  }
  return value;
}

export async function GET(request: Request) {
  try {
    const type = new URL(request.url).searchParams.get("type");
    const supabase = getSupabase();
    let query = supabase.from("instruction_templates").select("*").order("created_at", { ascending: false });
    if (type === "writing" || type === "checking") query = query.eq("type", type);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ok(data ?? []);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string; type?: string; content?: string };
    const name = body.name?.trim();
    const content = body.content?.trim();
    if (!name || !content) throw new HttpError("Name and content are required.", 400);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("instruction_templates")
      .insert({ name, type: assertType(body.type), content })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return ok(data, 201);
  } catch (error) {
    return fail(error);
  }
}
