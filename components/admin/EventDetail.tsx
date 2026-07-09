"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  IndianRupee,
  Ticket as TicketIcon,
  Users,
  CheckCircle2,
  Search,
  RefreshCw,
  Loader2,
  XCircle,
  RotateCcw,
  Plus,
  Trash2,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import type { Event, Ticket, TicketStatus, TicketType, Order } from "@/lib/types";
import type { EventStats } from "@/lib/tickets";
import { inr, formatEventDate } from "@/lib/format";
import { EventForm } from "./EventForm";
import { TicketTypeForm } from "./TicketTypeForm";
import { QRScanner } from "./QRScanner";

type Tab = "overview" | "bookings" | "checkin" | "settings";
type Filter = "all" | TicketStatus;

const STATUS_STYLES: Record<TicketStatus, string> = {
  confirmed: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  checked_in: "bg-violet-glow/15 text-violet-soft ring-violet-glow/30",
  cancelled: "bg-red-500/15 text-red-300 ring-red-500/30",
};

export function EventDetail({
  event: initialEvent,
  initialTicketTypes,
  initialTickets,
  initialStats,
  initialOrders,
}: {
  event: Event;
  initialTicketTypes: TicketType[];
  initialTickets: Ticket[];
  initialStats: EventStats;
  initialOrders: Order[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [event, setEvent] = useState(initialEvent);
  const [ticketTypes, setTicketTypes] = useState(initialTicketTypes);
  const [tickets, setTickets] = useState(initialTickets);
  const [stats, setStats] = useState(initialStats);
  const [orders, setOrders] = useState(initialOrders);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${event.id}/tickets`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
        setStats(data.stats);
        setOrders(data.orders);
      }
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "bookings", label: "Bookings" },
    { id: "checkin", label: "Check-in" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/admin/events"
        className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        All events
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="section-eyebrow">{event.presenter}</span>
          <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">{event.name}</h1>
          <p className="mt-1 text-sm text-neutral-400">{formatEventDate(event.eventDate)}</p>
        </div>
        <div className="flex items-center gap-2">
          {event.status === "published" && (
            <Link href={`/events/${event.slug}`} target="_blank" className="btn-ghost">
              <ExternalLink className="h-4 w-4" />
              View live
            </Link>
          )}
          <button type="button" onClick={refresh} className="btn-ghost" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-violet-glow/20 text-violet-soft ring-1 ring-inset ring-violet-glow/40"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {tab === "overview" && <Overview stats={stats} orders={orders} />}
        {tab === "bookings" && (
          <Bookings tickets={tickets} onRefresh={refresh} />
        )}
        {tab === "checkin" && <QRScanner onChanged={refresh} />}
        {tab === "settings" && (
          <Settings
            event={event}
            ticketTypes={ticketTypes}
            onEventSaved={setEvent}
            onTicketTypesChanged={setTicketTypes}
          />
        )}
      </div>
    </div>
  );
}

function Overview({ stats, orders }: { stats: EventStats; orders: Order[] }) {
  const paid = orders.filter((o) => o.status === "paid").length;
  const failed = orders.filter((o) => o.status === "failed").length;
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<IndianRupee className="h-5 w-5" />} label="Revenue" value={inr(stats.totalRevenue)} />
        <StatCard icon={<TicketIcon className="h-5 w-5" />} label="Tickets sold" value={String(stats.totalTickets)} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Total guests" value={String(stats.totalGuests)} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Checked in" value={`${stats.checkedIn}/${stats.totalTickets}`} />
      </div>

      <h3 className="mt-8 text-lg font-semibold">By ticket type</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {Object.entries(stats.byTicketType).length === 0 && (
          <p className="text-sm text-neutral-500">No sales yet.</p>
        )}
        {Object.entries(stats.byTicketType).map(([code, b]) => (
          <div key={code} className="rounded-2xl glass px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">{b.name}</span>
              <span className="text-sm text-neutral-400">{b.count} sold</span>
            </div>
            <p className="mt-1 font-display text-xl text-violet-soft">{inr(b.revenue)}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-8 text-lg font-semibold">Payments</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Paid orders" value={String(paid)} />
        <StatCard icon={<XCircle className="h-5 w-5" />} label="Failed orders" value={String(failed)} />
        <StatCard icon={<TicketIcon className="h-5 w-5" />} label="Total orders" value={String(orders.length)} />
      </div>
    </div>
  );
}

function Bookings({
  tickets,
  onRefresh,
}: {
  tickets: Ticket[];
  onRefresh: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.buyerName.toLowerCase().includes(q) ||
        t.buyerEmail.toLowerCase().includes(q) ||
        t.buyerPhone.toLowerCase().includes(q)
      );
    });
  }, [tickets, filter, query]);

  async function update(id: string, status: TicketStatus) {
    setBusyId(id);
    try {
      await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, ticket ID…"
            className="w-full rounded-full border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "confirmed", "checked_in", "cancelled"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-violet-glow/20 text-violet-soft ring-1 ring-inset ring-violet-glow/40"
                  : "border border-white/10 text-neutral-400 hover:text-white"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl glass">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-5 py-4 font-medium">Ticket</th>
                <th className="px-5 py-4 font-medium">Guest</th>
                <th className="px-5 py-4 font-medium">Pass</th>
                <th className="px-5 py-4 font-medium">Amount</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-neutral-500">
                    {tickets.length === 0 ? "No bookings yet." : "No tickets match your search."}
                  </td>
                </tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-white">{t.id}</span>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {new Date(t.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-white">{t.buyerName}</p>
                    <p className="text-xs text-neutral-500">{t.buyerEmail}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-neutral-200">{t.ticketTypeName}</span>
                    <span className="text-neutral-500"> × {t.quantity}</span>
                    <p className="text-xs text-neutral-500">{t.seats} guests</p>
                  </td>
                  <td className="px-5 py-4 tabular-nums text-white">{inr(t.amountInr)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_STYLES[t.status]}`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {busyId === t.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                      ) : t.status === "checked_in" ? (
                        <IconBtn title="Undo check-in" onClick={() => update(t.id, "confirmed")}>
                          <RotateCcw className="h-4 w-4" />
                        </IconBtn>
                      ) : t.status === "confirmed" ? (
                        <>
                          <IconBtn title="Check in" accent onClick={() => update(t.id, "checked_in")}>
                            <CheckCircle2 className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn title="Cancel" danger onClick={() => update(t.id, "cancelled")}>
                            <XCircle className="h-4 w-4" />
                          </IconBtn>
                        </>
                      ) : (
                        <IconBtn title="Restore" onClick={() => update(t.id, "confirmed")}>
                          <RotateCcw className="h-4 w-4" />
                        </IconBtn>
                      )}
                    </div>
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

function Settings({
  event,
  ticketTypes,
  onEventSaved,
  onTicketTypesChanged,
}: {
  event: Event;
  ticketTypes: TicketType[];
  onEventSaved: (e: Event) => void;
  onTicketTypesChanged: (t: TicketType[]) => void;
}) {
  const [addingType, setAddingType] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function removeType(id: string) {
    await fetch(`/api/admin/events/${event.id}/ticket-types/${id}`, { method: "DELETE" });
    onTicketTypesChanged(ticketTypes.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-10">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Event details</h3>
        <EventForm initial={event} onSaved={onEventSaved} />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ticket types</h3>
          <button
            type="button"
            onClick={() => setAddingType((v) => !v)}
            className={addingType ? "btn-ghost" : "btn-primary"}
          >
            <Plus className="h-4 w-4" />
            {addingType ? "Close" : "Add type"}
          </button>
        </div>

        {addingType && (
          <div className="mb-4">
            <TicketTypeForm
              eventId={event.id}
              onSaved={(tt) => {
                onTicketTypesChanged([...ticketTypes, tt]);
                setAddingType(false);
              }}
              onCancel={() => setAddingType(false)}
            />
          </div>
        )}

        <div className="space-y-3">
          {ticketTypes.map((tt) =>
            editingId === tt.id ? (
              <TicketTypeForm
                key={tt.id}
                eventId={event.id}
                initial={tt}
                onSaved={(next) => {
                  onTicketTypesChanged(ticketTypes.map((t) => (t.id === next.id ? next : t)));
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={tt.id} className="flex items-center justify-between rounded-2xl glass px-5 py-4">
                <div>
                  <p className="font-medium text-white">
                    {tt.name}{" "}
                    {tt.isFeatured && (
                      <span className="ml-1 rounded-full bg-violet-glow/15 px-2 py-0.5 text-[10px] text-violet-soft">
                        Featured
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {inr(tt.priceInr)} · {tt.seatsPerTicket} seat(s) · {tt.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setEditingId(tt.id)} className="btn-ghost">
                    Edit
                  </button>
                  <IconBtn title="Delete" danger onClick={() => removeType(tt.id)}>
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>
              </div>
            ),
          )}
          {ticketTypes.length === 0 && (
            <p className="text-sm text-neutral-500">No ticket types yet. Add one above.</p>
          )}
        </div>
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
      <p className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">{value}</p>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  accent,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  accent?: boolean;
  danger?: boolean;
}) {
  const tone = accent
    ? "hover:bg-emerald-500/15 hover:text-emerald-300 text-neutral-300"
    : danger
      ? "hover:bg-red-500/15 hover:text-red-300 text-neutral-300"
      : "hover:bg-white/10 text-neutral-300 hover:text-white";
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-xl border border-white/10 transition-colors ${tone}`}
    >
      {children}
    </button>
  );
}
