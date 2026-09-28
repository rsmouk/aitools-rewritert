import { fail, HttpError, ok } from "@/lib/route";
import { wpFetch } from "@/lib/wordpress";
import type { WpTerm } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tags = await wpFetch<WpTerm[]>("/tags");
    return ok(tags);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim();
    if (!name) throw new HttpError("Tag name is required.", 400);
    const tag = await wpFetch<WpTerm>("/tags", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    return ok(tag, 201);
  } catch (error) {
    return fail(error);
  }
}
