import "server-only";
import { getSupabase } from "@/lib/supabase";
import { decrypt, encrypt } from "@/lib/crypto";

export const SETTING_KEYS = [
  "openai_api_key",
  "gemini_api_key",
  "openrouter_api_key",
  "wp_site_url",
  "wp_api_key",
  "admin_password_hash",
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

export type AppSettings = Record<SettingKey, string>;

const EMPTY: AppSettings = {
  openai_api_key: "",
  gemini_api_key: "",
  openrouter_api_key: "",
  wp_site_url: "",
  wp_api_key: "",
  admin_password_hash: "",
};

export async function getSettings(): Promise<AppSettings> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("app_settings").select("key, value");
  if (error) throw new Error(error.message);

  const settings = { ...EMPTY };
  for (const row of data ?? []) {
    if (!SETTING_KEYS.includes(row.key as SettingKey)) continue;
    settings[row.key as SettingKey] = decrypt(row.value ?? "");
  }
  return settings;
}

export async function setSettings(partial: Partial<AppSettings>) {
  const supabase = getSupabase();
  const rows = Object.entries(partial)
    .filter((entry): entry is [SettingKey, string] => SETTING_KEYS.includes(entry[0] as SettingKey))
    .filter(([, value]) => value.trim() !== "")
    .map(([key, value]) => ({ key, value: encrypt(value) }));

  if (rows.length === 0) return;
  const { error } = await supabase.from("app_settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);
}
