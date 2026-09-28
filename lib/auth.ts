import "server-only";
import { cookies } from "next/headers";
import { readSession, safeEqual, verifyPassword } from "@/lib/crypto";
import { getSettings } from "@/lib/settings";
import { HttpError } from "@/lib/route";

export const ADMIN_COOKIE = "ai_writer_admin";

export async function isAdmin() {
  return readSession(cookies().get(ADMIN_COOKIE)?.value);
}

export async function assertAdmin() {
  if (!(await isAdmin())) {
    throw new HttpError("Admin sign-in is required.", 401);
  }
}

export async function passwordMatches(password: string) {
  const settings = await getSettings();
  if (settings.admin_password_hash) {
    return verifyPassword(password, settings.admin_password_hash);
  }
  const envPassword = process.env.ADMIN_PASSWORD || "";
  if (!envPassword) {
    throw new HttpError("Set ADMIN_PASSWORD in the environment before signing in.", 500);
  }
  return safeEqual(password, envPassword);
}
