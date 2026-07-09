"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { TicketType, TicketTypeStatus } from "@/lib/types";

export function TicketTypeForm({
  eventId,
  initial,
  onSaved,
  onCancel,
}: {
  eventId: string;
  initial?: TicketType;
  onSaved: (tt: TicketType) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    priceInr: initial?.priceInr ?? 0,
    seatsPerTicket: initial?.seatsPerTicket ?? 1,
    tagline: initial?.tagline ?? "",
    perks: (initial?.perks ?? []).join("\n"),
    isFeatured: initial?.isFeatured ?? false,
    sortOrder: initial?.sortOrder ?? 0,
    status: (initial?.status ?? "active") as TicketTypeStatus,
    maxQtyPerOrder: initial?.maxQtyPerOrder ?? 20,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        code: values.code,
        name: values.name,
        priceInr: Number(values.priceInr),
        seatsPerTicket: Number(values.seatsPerTicket),
        tagline: values.tagline || null,
        perks: values.perks.split("\n").map((p) => p.trim()).filter(Boolean),
        isFeatured: values.isFeatured,
        sortOrder: Number(values.sortOrder),
        status: values.status,
        maxQtyPerOrder: Number(values.maxQtyPerOrder),
      };
      const res = await fetch(
        initial
          ? `/api/admin/events/${eventId}/ticket-types/${initial.id}`
          : `/api/admin/events/${eventId}/ticket-types`,
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the ticket type.");
      onSaved(data.ticketType as TicketType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Code" value={values.code} onChange={(v) => setValues((s) => ({ ...s, code: v }))} placeholder="vip" required />
        <Field label="Name" value={values.name} onChange={(v) => setValues((s) => ({ ...s, name: v }))} placeholder="VIP" required />
        <NumField label="Price (₹)" value={values.priceInr} onChange={(v) => setValues((s) => ({ ...s, priceInr: v }))} />
        <NumField label="Seats per ticket" value={values.seatsPerTicket} onChange={(v) => setValues((s) => ({ ...s, seatsPerTicket: v }))} min={1} />
        <NumField label="Max qty / order" value={values.maxQtyPerOrder} onChange={(v) => setValues((s) => ({ ...s, maxQtyPerOrder: v }))} min={1} />
        <NumField label="Sort order" value={values.sortOrder} onChange={(v) => setValues((s) => ({ ...s, sortOrder: v }))} />
        <div className="sm:col-span-2">
          <Field label="Tagline" value={values.tagline} onChange={(v) => setValues((s) => ({ ...s, tagline: v }))} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">Perks (one per line)</label>
          <textarea
            rows={4}
            value={values.perks}
            onChange={(e) => setValues((s) => ({ ...s, perks: e.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-violet-glow/50 focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={values.isFeatured}
            onChange={(e) => setValues((s) => ({ ...s, isFeatured: e.target.checked }))}
            className="h-4 w-4 rounded border-white/20 bg-white/5"
          />
          Featured (Most popular)
        </label>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-300">Status</label>
          <select
            value={values.status}
            onChange={(e) => setValues((s) => ({ ...s, status: e.target.value as TicketTypeStatus }))}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-violet-glow/50 focus:outline-none"
          >
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : initial ? "Save" : "Add ticket type"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-300">{label}</label>
      <input
        type="text"
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none"
      />
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-300">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-violet-glow/50 focus:outline-none"
      />
    </div>
  );
}
