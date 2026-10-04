"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CalendarRange, LogOut, Sparkles, ShieldCheck } from "lucide-react";
import type { AdminRole } from "@/lib/types";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; exact: boolean };

const SECURITY_NAV: NavItem = {
  href: "/admin/security",
  label: "Security",
  icon: ShieldCheck,
  exact: true,
};

const SUPER_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/events", label: "Events", icon: CalendarRange, exact: false },
  SECURITY_NAV,
];

export function AdminShell({
  email,
  role,
  eventHref,
  children,
}: {
  email: string | null;
  role: AdminRole;
  eventHref?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Event admins only ever see a link to their own event; super admins get the
  // full nav. This mirrors the server-side gating — it is not the enforcement.
  const NAV: NavItem[] =
    role === "super_admin"
      ? SUPER_NAV
      : eventHref && eventHref.startsWith("/admin/events/")
        ? [
            { href: eventHref, label: "My event", icon: CalendarRange, exact: false },
            SECURITY_NAV,
          ]
        : [SECURITY_NAV];

  async function signOut() {
    // Sign-out runs server-side so httpOnly auth cookies can be cleared and
    // the event is audit logged.
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <div className="relative min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <aside className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-white/10 bg-charcoal-950/70 px-5 py-3 backdrop-blur lg:h-dvh lg:flex-col lg:items-stretch lg:justify-start lg:border-b-0 lg:border-r lg:py-6">
        <Link href="/admin" className="flex items-center gap-2.5 lg:px-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-glow to-violet-deep shadow-glow">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-sm font-semibold text-white">NovaLabs</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-violet-soft/80">
              Admin
            </span>
          </span>
        </Link>

        <nav className="hidden gap-1 lg:mt-8 lg:flex lg:flex-col">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-violet-glow/15 text-violet-soft ring-1 ring-inset ring-violet-glow/30"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 lg:mt-auto lg:flex-col lg:items-stretch">
          {email && (
            <span className="hidden truncate px-3 text-xs text-neutral-500 lg:block">
              {email}
            </span>
          )}
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <nav className="flex gap-1 border-b border-white/10 px-4 py-2 lg:hidden">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                active ? "bg-violet-glow/15 text-violet-soft" : "text-neutral-400"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main className="relative min-w-0 px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
