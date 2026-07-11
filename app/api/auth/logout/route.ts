import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readJson, rejectCrossOrigin } from "@/lib/apiGuards";
import { logoutSchema } from "@/lib/schemas";
import { logAdminAction, requestContext } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Server-side sign-out. scope "global" revokes every session for this user on
 * all devices (refresh tokens invalidated server-side by Supabase) — the
 * "log out everywhere / revoke compromised sessions" control.
 */
export async function POST(req: Request) {
  const csrf = rejectCrossOrigin(req);
  if (csrf) return csrf;

  let scope: "local" | "global" = "local";
  try {
    const parsed = await readJson(req, logoutSchema);
    if (parsed.ok && parsed.data.scope) scope = parsed.data.scope;
  } catch {
    /* empty body is fine — default local */
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    await supabase.auth.signOut({ scope });
  } catch {
    /* already signed out — still clear our cookies below */
  }

  if (user) {
    const ctx = requestContext(req);
    void logAdminAction({
      actorId: user.id,
      action: scope === "global" ? "auth.logout_all" : "auth.logout",
      ...ctx,
    });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete("nl-session-start");
  res.cookies.delete("nl-last-seen");
  return res;
}
