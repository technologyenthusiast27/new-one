import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Gates /admin. Unauthenticated → /admin/login. Then role-aware routing,
 * enforced entirely server-side (never trusting client state):
 *
 *  - super_admin: full access to all admin areas.
 *  - event_admin: may ONLY reach the page(s) for the event(s) they are assigned
 *    to (`/admin/events/<their-event>`). The cross-event dashboard, the events
 *    list, event creation, and every other admin area redirect to their own
 *    event. Direct-URL access to another event is rejected here AND again in
 *    the page loader + API routes + database RLS (defence in depth).
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

  // getUser() verifies the JWT with the auth server — never trust getSession()
  // alone (that only decodes the cookie, which a client could tamper with).
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

  // Authenticated — resolve role from the database (authoritative).
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role as "super_admin" | "event_admin" | undefined;

  if (role !== "super_admin" && role !== "event_admin") {
    // Signed in but not an admin.
    if (isLogin) return response;
    return redirect("/admin/login");
  }

  // ── super_admin: unrestricted ──
  if (role === "super_admin") {
    if (isLogin) return redirect("/admin");
    return response;
  }

  // ── event_admin: locked to assigned event(s) ──
  const { data: rows } = await supabase
    .from("event_admins")
    .select("event_id")
    .eq("user_id", user.id);
  const eventIds = (rows ?? []).map((r) => r.event_id as string);

  // Landing page = their (first) assigned event, addressed by slug for a clean
  // URL. With no assigned event there is nothing to show; fall back to login.
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
    // Avoid a redirect loop when there is no landing other than login.
    return landing === "/admin/login" ? response : redirect(landing);
  }

  // The only pages an event_admin may open are their own event's pages.
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
    if (eventId && eventIds.includes(eventId)) return response;
    return redirect(landing);
  }

  // Everything else under /admin (dashboard, events list, analytics, user
  // management, event creation) is off-limits to an event_admin.
  return redirect(landing);
}

export const config = {
  matcher: ["/admin/:path*"],
};
