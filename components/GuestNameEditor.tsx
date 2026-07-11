"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Pencil } from "lucide-react";
import { TurnstileWidget } from "@/components/TurnstileWidget";

export interface EditableGuest {
  seatIndex: number;
  name: string | null;
}

/**
 * Lets the purchaser rename the guests on their booking before the event. Posts
 * to /api/booking/[id]/attendees (authority = possession of the booking link).
 * Blank names revert to the "Guest #N" placeholder.
 */
export function GuestNameEditor({
  bookingId,
  initial,
}: {
  bookingId: string;
  initial: EditableGuest[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState<string[]>(
    initial.map((g) => g.name ?? ""),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  function set(i: number, value: string) {
    setNames((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/booking/${bookingId}/attendees`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          names: initial.map((g, i) => ({
            seatIndex: g.seatIndex,
            name: names[i] ?? "",
          })),
          turnstileToken: turnstileToken ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 text-sm text-violet-soft transition-colors hover:text-white"
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit guest names
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-sm font-medium text-white">Guest names</p>
      <p className="mb-3 mt-0.5 text-xs text-neutral-500">
        Optional. Leave blank to show “Guest #N”.
      </p>
      <div className="space-y-2">
        {initial.map((g, i) => (
          <input
            key={g.seatIndex}
            type="text"
            value={names[i] ?? ""}
            onChange={(e) => set(i, e.target.value)}
            maxLength={80}
            aria-label={`Guest ${g.seatIndex} name`}
            placeholder={`Guest #${g.seatIndex}`}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none focus:ring-2 focus:ring-violet-glow/25"
          />
        ))}
      </div>
      <div className="mt-3">
        <TurnstileWidget onToken={setTurnstileToken} />
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
      <div className="mt-4 flex items-center gap-2">
        <button type="button" onClick={save} className="btn-primary" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : null}
          {saved ? "Saved" : "Save names"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
          Done
        </button>
      </div>
    </div>
  );
}
