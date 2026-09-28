import { isAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok({ authenticated: await isAdmin() });
  } catch (error) {
    return fail(error);
  }
}
