import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hardenAuthCookie } from "@/lib/supabase/cookies";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Session lifetime controls (defence-in-depth on top of Supabase JWT expiry).
const IDLE_MINUTES = Math.max(5, parseInt(process.env.ADMIN_IDLE_TIMEOUT_MINUTES || "60", 10) || 60);
const ABSOLUTE_HOURS = Math.max(1, parseInt(process.env.ADMIN_SESSION_MAX_HOURS || "12", 10) || 12);
const LAST_SEEN_COOKIE = "nl-last-seen";
const SESSION_START_COOKIE = "nl-session-start";

/** Fire-and-forget audit insert usable from the edge runtime. */
function edgeAudit(entry: {
  actorId: string | null;
  action: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  void fetch(`${url}/rest/v1/admin_audit_log`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      actor_id: entry.actorId,
      action: entry.action,
      metadata: entry.metadata ?? {},
      ip: entry.ip ?? null,
    }),
  }).catch(() => {});
}

/**
 * Gates /admin. Layers, in order:
 *  1. Authentication (verified via getUser(), never a decoded cookie alone).
 *  2. Idle + absolute session timeouts.
 *  3. MFA: a session whose account has a verified TOTP factor must present a
 *     code (aal2) before ANY admin page; accounts where MFA is required but
 *     not yet enrolled are confined to /admin/security to enroll.
 *  4. Role isolation: super_admin everywhere; event_admin only their event
 *     pages + /admin/security.
 * Every layer is re-checked in page loaders / API routes / RLS — the
 * middleware is the outer wall, not the only wall.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, hardenAuthCookie(options)),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const isSecurity = pathname === "/admin/security";
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const redirect = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
    return NextResponse.redirect(url);
  };

  if (!user) {
    if (isLogin) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // ── Session timeouts (idle + absolute) ──
  const now = Date.now();
  const lastSeen = parseInt(request.cookies.get(LAST_SEEN_COOKIE)?.value || "0", 10) || 0;
  const sessionStart = parseInt(request.cookies.get(SESSION_START_COOKIE)?.value || "0", 10) || 0;
  const idleExpired = lastSeen > 0 && now - lastSeen > IDLE_MINUTES * 60_000;
  const absoluteExpired = sessionStart > 0 && now - sessionStart > ABSOLUTE_HOURS * 3_600_000;
  if (idleExpired || absoluteExpired) {
    try {
      await supabase.auth.signOut();
    } catch {
      /* still clear cookies below */
    }
    edgeAudit({
      actorId: user.id,
      action: "auth.session_timeout",
      metadata: { kind: idleExpired ? "idle" : "absolute" },
      ip,
    });
    const out = redirect("/admin/login", { timeout: "1" });
    out.cookies.delete(LAST_SEEN_COOKIE);
    out.cookies.delete(SESSION_START_COOKIE);
    // Belt-and-braces: expire Supabase auth cookies on the response.
    for (const c of request.cookies.getAll()) {
      if (c.name.startsWith("sb-")) out.cookies.delete(c.name);
    }
    return out;
  }
  const touchActivity = (res: NextResponse) => {
    const opts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };
    res.cookies.set(LAST_SEEN_COOKIE, String(now), opts);
    if (!sessionStart) res.cookies.set(SESSION_START_COOKIE, String(now), opts);
    return res;
  };

  // ── Role (authoritative, from the database) ──
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const role = profile?.role as "super_admin" | "event_admin" | undefined;

  if (role !== "super_admin" && role !== "event_admin") {
    if (isLogin) return response;
    return redirect("/admin/login");
  }

  // ── MFA gating ──
  let aalCurrent = "aal1";
  let aalNext = "aal1";
  try {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal) {
      aalCurrent = aal.currentLevel ?? "aal1";
      aalNext = aal.nextLevel ?? aalCurrent;
    }
  } catch {
    /* infrastructure error — enforcement re-checks in getAdminContext */
  }
  const mfaEnforced = role === "super_admin" || profile?.mfa_enforced === true;

  // Factor enrolled but this session hasn't presented a code → finish MFA at
  // the login screen before touching anything else.
  if (aalNext === "aal2" && aalCurrent !== "aal2") {
    if (isLogin) return touchActivity(response); // login page shows the code step
    return redirect("/admin/login", { mfa: "1", next: pathname });
  }

  // MFA required by policy but no authenticator enrolled yet → confine to the
  // enrollment page (never locked out, never able to skip).
  if (mfaEnforced && aalNext !== "aal2") {
    if (isSecurity) return touchActivity(response);
    return redirect("/admin/security");
  }

  // ── super_admin: unrestricted ──
  if (role === "super_admin") {
    if (isLogin) return redirect("/admin");
    return touchActivity(response);
  }

  // ── event_admin: locked to assigned event(s) + the security page ──
  if (isSecurity) return touchActivity(response);

  const { data: rows } = await supabase
    .from("event_admins")
    .select("event_id")
    .eq("user_id", user.id);
  const eventIds = (rows ?? []).map((r) => r.event_id as string);

  let landing = "/admin/login";
  if (eventIds.length > 0) {
    const { data: ev } = await supabase
      .from("events")
      .select("slug")
      .eq("id", eventIds[0])
      .maybeSingle();
    landing = ev?.slug
      ? `/admin/events/${ev.slug}`
      : `/admin/events/${eventIds[0]}`;
  }

  if (isLogin) {
    return landing === "/admin/login" ? response : redirect(landing);
  }

  const eventMatch = pathname.match(/^\/admin\/events\/([^/]+)/);
  if (eventMatch) {
    const seg = eventMatch[1];
    let eventId: string | null = UUID_RE.test(seg) ? seg : null;
    if (!eventId) {
      const { data: ev } = await supabase
        .from("events")
        .select("id")
        .eq("slug", seg)
        .maybeSingle();
      eventId = (ev?.id as string) ?? null;
    }
    if (eventId && eventIds.includes(eventId)) return touchActivity(response);
    edgeAudit({
      actorId: user.id,
      action: "auth.denied_403",
      metadata: { route: pathname, reason: "event-not-assigned" },
      ip,
    });
    return redirect(landing);
  }

  // Everything else under /admin (dashboard, events list, user management,
  // event creation) is off-limits to an event_admin.
  return redirect(landing);
}

export const config = {
  matcher: ["/admin/:path*"],
};
