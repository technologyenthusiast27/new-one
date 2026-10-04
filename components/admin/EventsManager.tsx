"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ArrowUpRight, X } from "lucide-react";
import type { Event, EventStatus } from "@/lib/types";
import { formatEventDate } from "@/lib/format";
import { EventForm } from "./EventForm";

const STATUS_BADGE: Record<EventStatus, string> = {
  published: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  coming_soon: "bg-violet-glow/15 text-violet-soft ring-violet-glow/30",
  draft: "bg-white/5 text-neutral-400 ring-white/10",
  archived: "bg-neutral-500/15 text-neutral-400 ring-neutral-500/30",
};

export function EventsManager({
  initialEvents,
  canCreate = true,
}: {
  initialEvents: Event[];
  canCreate?: boolean;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [creating, setCreating] = useState(false);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="section-eyebrow">Manage</span>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Events</h1>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setCreating((v) => !v)}
            className={creating ? "btn-ghost" : "btn-primary"}
          >
            {creating ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {creating ? "Close" : "New event"}
          </button>
        )}
      </div>

      {canCreate && creating && (
        <div className="mt-6">
          <EventForm
            onSaved={(event) => {
              setEvents((prev) => [event, ...prev]);
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-3xl glass">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-5 py-4 font-medium">Event</th>
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 text-right font-medium">Manage</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-neutral-500">
                    No events yet. Create your first one above.
                  </td>
                </tr>
              )}
              {events.map((event) => (
                <tr key={event.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <p className="font-medium text-white">{event.name}</p>
                    <p className="text-xs text-neutral-500">{event.presenter} · /{event.slug}</p>
                  </td>
                  <td className="px-5 py-4 text-neutral-300">{formatEventDate(event.eventDate)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_BADGE[event.status]}`}
                    >
                      {event.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="inline-flex items-center gap-1.5 text-sm text-violet-soft hover:text-white"
                    >
                      Open
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
