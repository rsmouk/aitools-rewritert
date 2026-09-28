import { assertAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/route";
import { wpFetch } from "@/lib/wordpress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await assertAdmin();
    const status = await wpFetch<{ ok: boolean; name?: string }>("/status");
    return ok({ ok: true, name: status.name || "AI Writer Connector" });
  } catch (error) {
    return fail(error);
  }
}
