import "server-only";
import { getSettings } from "@/lib/settings";
import { HttpError } from "@/lib/route";

export function normalizeWpUrl(url: string) {
  let value = url.trim().replace(/\/+$/, "");
  value = value.replace(/\/wp-json(\/ai-writer\/v1)?$/i, "");
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  return value;
}

export async function wpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const settings = await getSettings();
  if (!settings.wp_site_url || !settings.wp_api_key) {
    throw new HttpError("WordPress URL and API key are required. Add them in Admin.", 400);
  }

  const url = `${normalizeWpUrl(settings.wp_site_url)}/wp-json/ai-writer/v1${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-AI-Writer-Key": settings.wp_api_key,
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new HttpError("Could not reach the WordPress site.", 502);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message
        : "WordPress request failed.";
    throw new HttpError(message, response.status || 502);
  }
  return body as T;
}
