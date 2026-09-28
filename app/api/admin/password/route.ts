import { assertAdmin, passwordMatches } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { setSettings } from "@/lib/settings";
import { fail, HttpError, ok } from "@/lib/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await assertAdmin();
    const body = (await request.json()) as { currentPassword?: string; newPassword?: string };
    const currentPassword = body.currentPassword || "";
    const newPassword = body.newPassword?.trim() || "";
    if (newPassword.length < 8) throw new HttpError("Use at least 8 characters.", 400);
    if (!(await passwordMatches(currentPassword))) throw new HttpError("Current password is incorrect.", 401);
    await setSettings({ admin_password_hash: hashPassword(newPassword) });
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
