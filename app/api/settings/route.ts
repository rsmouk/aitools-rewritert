import { assertAdmin } from "@/lib/auth";
import { getSettings, setSettings, type SettingKey } from "@/lib/settings";
import { fail, ok } from "@/lib/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WRITABLE: SettingKey[] = [
  "openai_api_key",
  "gemini_api_key",
  "openrouter_api_key",
  "wp_site_url",
  "wp_api_key",
];

export async function GET() {
  try {
    await assertAdmin();
    const settings = await getSettings();
    return ok({
      wp_site_url: settings.wp_site_url,
      openai_api_key_set: Boolean(settings.openai_api_key),
      gemini_api_key_set: Boolean(settings.gemini_api_key),
      openrouter_api_key_set: Boolean(settings.openrouter_api_key),
      wp_api_key_set: Boolean(settings.wp_api_key),
      admin_password_set: Boolean(settings.admin_password_hash),
    });
  } catch (error) {
    return fail(error);
  }
}

export async function PUT(request: Request) {
  try {
    await assertAdmin();
    const body = (await request.json()) as Partial<Record<SettingKey, string>>;
    const next: Partial<Record<SettingKey, string>> = {};
    for (const key of WRITABLE) {
      const value = body[key];
      if (typeof value === "string" && value.trim()) next[key] = value.trim();
    }
    await setSettings(next);
    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
