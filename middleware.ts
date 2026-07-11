import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Gates /admin. Unauthenticated → /admin/login. Then role-aware routing:
 *  - super_admin: full access.
 *  - event_admin: may only reach /admin/events and event pages they are
 *    assigned to; the cross-event dashboard and any other admin area redirect
 *    to their own landing. Per-event assignment is rejected here AND again
 *    server-side in the page (defence in depth).
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
            response.cookies.set(name, value, options),
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

  const redirect = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = "";
    return NextResponse.redirect(url);
  };

  if (!user) {
    if (isLogin) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated — resolve role + assigned events.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role as "super_admin" | "event_admin" | undefined;

  if (role !== "super_admin" && role !== "event_admin") {
    // Signed in but not an admin — send to login (will show no access).
    if (isLogin) return response;
    return redirect("/admin/login");
  }

  let eventIds: string[] = [];
  if (role === "event_admin") {
    const { data: rows } = await supabase
      .from("event_admins")
      .select("event_id")
      .eq("user_id", user.id);
    eventIds = (rows ?? []).map((r) => r.event_id as string);
  }

  const landing =
    role === "super_admin"
      ? "/admin"
      : eventIds.length === 1
        ? `/admin/events/${eventIds[0]}`
        : "/admin/events";

  if (isLogin) return redirect(landing);

  if (role === "super_admin") return response;

  // ── event_admin route gating ──
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
    if (!eventId || !eventIds.includes(eventId)) return redirect(landing);
    return response;
  }

  // The events list is allowed (it is server-filtered to their events).
  if (pathname === "/admin/events") return response;

  // Everything else under /admin (cross-event dashboard, user mgmt) is off-limits.
  return redirect(landing);
}

export const config = {
  matcher: ["/admin/:path*"],
};
