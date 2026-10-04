import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarRange, Plus, ArrowUpRight, Radio } from "lucide-react";
import { createClient, getAdminContext } from "@/lib/supabase/server";
import { listEventsForAdmin } from "@/lib/events";
import { eventAdminLandingPath } from "@/lib/adminRoutes";
import { formatEventDate } from "@/lib/format";
import type { EventStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<EventStatus, string> = {
  published: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  coming_soon: "bg-violet-glow/15 text-violet-soft ring-violet-glow/30",
  draft: "bg-white/5 text-neutral-400 ring-white/10",
  archived: "bg-neutral-500/15 text-neutral-400 ring-neutral-500/30",
};

export default async function AdminDashboard() {
  const admin = await getAdminContext();
  if (!admin) redirect("/admin/login");

  const supabase = await createClient();

  // The cross-event dashboard is super-admin only. Event admins are sent to
  // their own event (server-side guard mirroring the middleware).
  if (admin.role !== "super_admin") {
    redirect(await eventAdminLandingPath(supabase, admin));
  }

  const events = await listEventsForAdmin(supabase, admin);

  const published = events.filter((e) => e.status === "published").length;
  const upcoming = events.filter(
    (e) => new Date(e.eventDate).getTime() > Date.now(),
  ).length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="section-eyebrow">Overview</span>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Dashboard</h1>
        </div>
        {admin.role === "super_admin" && (
          <Link href="/admin/events" className="btn-primary">
            <Plus className="h-4 w-4" />
            New event
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<CalendarRange className="h-5 w-5" />} label="Total events" value={String(events.length)} />
        <StatCard icon={<Radio className="h-5 w-5" />} label="Published" value={String(published)} />
        <StatCard icon={<ArrowUpRight className="h-5 w-5" />} label="Upcoming" value={String(upcoming)} />
      </div>

      <h2 className="mt-10 text-lg font-semibold">All events</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.length === 0 && (
          <p className="text-sm text-neutral-500">
            No events yet. Create your first one from the Events page.
          </p>
        )}
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/admin/events/${event.id}`}
            className="group rounded-2xl glass p-5 transition-all hover:-translate-y-0.5 hover:ring-1 hover:ring-violet-glow/30"
          >
            <div className="flex items-center justify-between">
              <span className="section-eyebrow">{event.presenter}</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_BADGE[event.status]}`}
              >
                {event.status.replace("_", " ")}
              </span>
            </div>
            <h3 className="mt-3 font-display text-xl font-semibold text-white">
              {event.name}
            </h3>
            <p className="mt-2 text-sm text-neutral-400">
              {formatEventDate(event.eventDate)}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-violet-soft">
              Manage
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center gap-2 text-violet-soft">
        {icon}
        <span className="text-xs uppercase tracking-wider text-neutral-400">{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
