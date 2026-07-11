"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, UserPlus, Copy } from "lucide-react";

interface EventAdminRow {
  id: string;
  email: string | null;
  fullName?: string | null;
}

/**
 * Super-admin-only: assign event admins to this event. Assigning an email that
 * doesn't exist yet creates the account and returns a one-time password.
 */
export function EventAdmins({ eventId }: { eventId: string }) {
  const [admins, setAdmins] = useState<EventAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<{ email: string; password: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/admins`);
      if (res.ok) setAdmins((await res.json()).admins);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setCreatedPassword(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName: fullName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add the admin.");
      if (data.admin?.createdPassword) {
        setCreatedPassword({ email: data.admin.email, password: data.admin.createdPassword });
      }
      setEmail("");
      setFullName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(userId: string) {
    await fetch(`/api/admin/events/${eventId}/admins/${userId}`, { method: "DELETE" });
    setAdmins((a) => a.filter((x) => x.id !== userId));
  }

  return (
    <div>
      <h3 className="mb-1 text-lg font-semibold">Event admins</h3>
      <p className="mb-4 text-sm text-neutral-500">
        Event admins can manage bookings, check-ins and settings for this event only.
      </p>

      <form onSubmit={add} className="rounded-2xl glass p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@email.com"
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none"
          />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name (optional)"
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none"
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Assign
          </button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        {createdPassword && (
          <div className="mt-3 rounded-xl border border-violet-glow/30 bg-violet-glow/10 px-4 py-3 text-sm text-violet-soft">
            <p className="font-medium">Account created for {createdPassword.email}</p>
            <p className="mt-1 flex items-center gap-2 text-neutral-200">
              Temporary password:{" "}
              <code className="rounded bg-black/30 px-2 py-0.5 font-mono text-white">
                {createdPassword.password}
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(createdPassword.password)}
                className="text-neutral-400 hover:text-white"
                title="Copy"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Share this securely — it won&rsquo;t be shown again.
            </p>
          </div>
        )}
      </form>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : admins.length === 0 ? (
          <p className="text-sm text-neutral-500">No event admins assigned yet.</p>
        ) : (
          admins.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-2xl glass px-5 py-3">
              <div>
                <p className="text-sm text-white">{a.email}</p>
                {a.fullName && <p className="text-xs text-neutral-500">{a.fullName}</p>}
              </div>
              <button
                type="button"
                onClick={() => remove(a.id)}
                title="Remove"
                aria-label="Remove admin"
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-neutral-300 transition-colors hover:bg-red-500/15 hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
