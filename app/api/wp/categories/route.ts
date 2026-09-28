import { fail, HttpError, ok } from "@/lib/route";
import { wpFetch } from "@/lib/wordpress";
import type { WpTerm } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await wpFetch<WpTerm[]>("/categories");
    return ok(categories);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim();
    if (!name) throw new HttpError("Category name is required.", 400);
    const category = await wpFetch<WpTerm>("/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    return ok(category, 201);
  } catch (error) {
    return fail(error);
  }
}
