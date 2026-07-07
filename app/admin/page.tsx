"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Loader2,
  Search,
  Ticket as TicketIcon,
  Users,
  IndianRupee,
  LogIn,
  RefreshCw,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import type { Ticket, TicketStatus } from "@/lib/types";
import type { AdminStats } from "@/lib/store";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { EVENT } from "@/lib/passes";

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
const STORAGE_KEY = "hob-admin-passcode";

type Filter = "all" | TicketStatus;

export default function AdminPage() {
  const [passcode, setPasscode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(
    async (code: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/tickets", {
          headers: { "x-admin-passcode": code },
        });
        if (res.status === 401) {
          setAuthed(false);
          sessionStorage.removeItem(STORAGE_KEY);
          throw new Error("Incorrect passcode.");
        }
        if (!res.ok) throw new Error("Failed to load tickets.");
        const data = await res.json();
        setTickets(data.tickets);
        setStats(data.stats);
        setAuthed(true);
        sessionStorage.setItem(STORAGE_KEY, code);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      setPasscode(saved);
      load(saved);
    }
  }, [load]);

  async function updateStatus(id: string, status: TicketStatus) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": passcode,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await load(passcode);
    } catch {
      setError("Could not update the ticket.");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.phone.toLowerCase().includes(q)
      );
    });
  }, [tickets, filter, query]);

  if (!authed) {
    return (
      <main className="relative grid min-h-dvh place-items-center px-6">
        <AmbientGlow />
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onSubmit={(e) => {
            e.preventDefault();
            load(passcode);
          }}
          className="w-full max-w-sm rounded-3xl glass-strong p-8"
        >
          <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-glow/20 to-violet-deep/20 ring-1 ring-inset ring-white/10">
            <Lock className="h-6 w-6 text-violet-soft" />
          </div>
          <h1 className="text-2xl font-semibold">Admin access</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Enter the passcode to manage {EVENT.name} tickets.
          </p>

          <label htmlFor="passcode" className="mt-6 mb-1.5 block text-sm font-medium text-neutral-300">
            Passcode
          </label>
          <input
            id="passcode"
            type="password"
            autoComplete="current-password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="••••••"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none focus:ring-2 focus:ring-violet-glow/25"
          />

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Enter dashboard
              </>
            )}
          </button>
          <p className="mt-4 text-center text-xs text-neutral-500">
            Demo passcode: <span className="font-mono text-neutral-400">wolves</span>
          </p>
        </motion.form>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh px-5 py-10 sm:px-8">
      <AmbientGlow />
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="section-eyebrow">{EVENT.presenter}</span>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Ticket Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={() => load(passcode)}
            className="btn-ghost"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<IndianRupee className="h-5 w-5" />}
            label="Revenue"
            value={stats ? inr(stats.totalRevenue) : "—"}
          />
          <StatCard
            icon={<TicketIcon className="h-5 w-5" />}
            label="Tickets sold"
            value={stats ? String(stats.totalTickets) : "—"}
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Total guests"
            value={stats ? String(stats.totalGuests) : "—"}
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Checked in"
            value={stats ? `${stats.checkedIn}/${stats.totalTickets}` : "—"}
          />
        </div>

        {/* Pass breakdown */}
        {stats && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {(["normal", "vip", "group"] as const).map((p) => (
              <div key={p} className="rounded-2xl glass px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize text-white">{p}</span>
                  <span className="text-sm text-neutral-400">
                    {stats.byPass[p].count} sold
                  </span>
                </div>
                <p className="mt-1 font-display text-xl text-violet-soft">
                  {inr(stats.byPass[p].revenue)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, ticket ID…"
              className="w-full rounded-full border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none focus:ring-2 focus:ring-violet-glow/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "confirmed", "checked-in", "cancelled"] as Filter[]).map((f) => (
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
                {f.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
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
                      {tickets.length === 0
                        ? "No tickets sold yet. Bookings will appear here in real time."
                        : "No tickets match your search."}
                    </td>
                  </tr>
                )}
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-white/[0.05] transition-colors hover:bg-white/[0.02]"
                  >
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
                      <p className="text-white">{t.name}</p>
                      <p className="text-xs text-neutral-500">{t.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-neutral-200">{t.passName}</span>
                      <span className="text-neutral-500"> × {t.quantity}</span>
                      <p className="text-xs text-neutral-500">{t.seats} guests</p>
                    </td>
                    <td className="px-5 py-4 tabular-nums text-white">{inr(t.amount)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {busyId === t.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                        ) : t.status === "checked-in" ? (
                          <IconBtn
                            title="Undo check-in"
                            onClick={() => updateStatus(t.id, "confirmed")}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </IconBtn>
                        ) : t.status === "confirmed" ? (
                          <>
                            <IconBtn
                              title="Check in"
                              accent
                              onClick={() => updateStatus(t.id, "checked-in")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </IconBtn>
                            <IconBtn
                              title="Cancel"
                              danger
                              onClick={() => updateStatus(t.id, "cancelled")}
                            >
                              <XCircle className="h-4 w-4" />
                            </IconBtn>
                          </>
                        ) : (
                          <IconBtn
                            title="Restore"
                            onClick={() => updateStatus(t.id, "confirmed")}
                          >
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

        {error && authed && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    </main>
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
        <span className="text-xs uppercase tracking-wider text-neutral-400">
          {label}
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    confirmed: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    "checked-in": "bg-violet-glow/15 text-violet-soft ring-violet-glow/30",
    cancelled: "bg-red-500/15 text-red-300 ring-red-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${styles[status]}`}
    >
      {status.replace("-", " ")}
    </span>
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
