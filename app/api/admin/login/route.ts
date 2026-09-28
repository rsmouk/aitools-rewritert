import { NextResponse } from "next/server";
import { ADMIN_COOKIE, passwordMatches } from "@/lib/auth";
import { signSession } from "@/lib/crypto";
import { fail, HttpError, ok } from "@/lib/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const password = body.password || "";
    if (!password) throw new HttpError("Password is required.", 400);
    if (!(await passwordMatches(password))) throw new HttpError("Incorrect password.", 401);

    const response = ok({ ok: true });
    response.cookies.set(ADMIN_COOKIE, signSession(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    return fail(error);
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
