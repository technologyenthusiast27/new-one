"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Minus, Plus, ShieldCheck, Users } from "lucide-react";
import type { Event, TicketType } from "@/lib/types";
import { inr } from "@/lib/format";
import { TurnstileWidget } from "@/components/TurnstileWidget";

interface Consents {
  terms: boolean;
  privacy: boolean;
  refund: boolean;
}

const EMPTY_CONSENTS: Consents = {
  terms: false,
  privacy: false,
  refund: false,
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface BookingModalProps {
  event: Event;
  ticketType: TicketType | null;
  onClose: () => void;
}

export function BookingModal({ event, ticketType, onClose }: BookingModalProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [consents, setConsents] = useState<Consents>(EMPTY_CONSENTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuantity(1);
    setForm({ name: "", email: "", phone: "" });
    setGuestNames([]);
    setConsents(EMPTY_CONSENTS);
    setError(null);
    setLoading(false);
  }, [ticketType]);

  function setGuestName(index: number, value: string) {
    setGuestNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  // Lock body scroll while open
  useEffect(() => {
    if (ticketType) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [ticketType]);

  if (!ticketType) return null;

  const maxQty = ticketType.maxQtyPerOrder;
  const total = ticketType.priceInr * quantity;
  const totalSeats = ticketType.seatsPerTicket * quantity;

  const allConsented = consents.terms && consents.privacy && consents.refund;

  function toggle(key: keyof Consents) {
    setConsents((c) => ({ ...c, [key]: !c[key] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!ticketType) return;
    if (form.name.trim().length < 2) return setError("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return setError("Please enter a valid email address.");
    if (form.phone.replace(/\D/g, "").length < 8)
      return setError("Please enter a valid phone number.");
    if (!allConsented)
      return setError("Please accept all the required confirmations to continue.");

    setLoading(true);
    try {
      // 1. Create the order (amount is computed server-side from the DB).
      // Guest names are optional; send one slot per seat (index 0 = seat 1).
      const namesPayload =
        totalSeats > 1
          ? Array.from({ length: totalSeats }, (_, i) => guestNames[i] ?? "")
          : undefined;
      const orderRes = await fetch(`/api/events/${event.slug}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketTypeCode: ticketType.code,
          quantity,
          ...form,
          guestNames: namesPayload,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Could not start checkout.");

      // 2. Verify: the browser sends only the payment proof — nothing about
      // price/qty/type, which the server reads from the stored order.
      const finalize = async (paymentId: string, signature: string) => {
        const verifyRes = await fetch(`/api/events/${event.slug}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.orderId, paymentId, signature }),
        });
        const result = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(result.error || "Verification failed.");
        router.push(`/ticket/${result.ticketId}`);
      };

      // 2a. Demo mode — no real gateway configured
      if (order.demo || !order.keyId) {
        await new Promise((r) => setTimeout(r, 900)); // simulate processing
        await finalize(`demo_pay_${Date.now()}`, "demo_signature");
        return;
      }

      // 2b. Real Razorpay checkout
      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) throw new Error("Couldn't load the payment gateway.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: event.name,
        description: `${ticketType.name} Pass × ${quantity}`,
        order_id: order.orderId,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#8b5cf6" },
        handler: (resp: {
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          finalize(resp.razorpay_payment_id, resp.razorpay_signature).catch((err) => {
            setError(err.message);
            setLoading(false);
          });
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md overflow-hidden rounded-t-3xl glass-strong p-6 sm:rounded-3xl sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Book ${ticketType.name} pass`}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/10 text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <span className="section-eyebrow">Checkout</span>
          <h3 className="mt-2 text-2xl font-semibold">{ticketType.name} Pass</h3>
          {ticketType.tagline && (
            <p className="mt-1 text-sm text-neutral-400">{ticketType.tagline}</p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field
              label="Full name"
              id="name"
              autoComplete="name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Your name"
            />
            <Field
              label="Email"
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="you@email.com"
            />
            <Field
              label="Phone"
              id="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="+91 90000 00000"
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                Quantity
              </label>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-white transition-colors hover:bg-white/5 disabled:opacity-40"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-display text-xl tabular-nums text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-white transition-colors hover:bg-white/5 disabled:opacity-40"
                  disabled={quantity >= maxQty}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {ticketType.seatsPerTicket > 1 && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-neutral-400">
                  <Users className="h-3.5 w-3.5 text-violet-soft" />
                  Admits {totalSeats} guests in total
                </p>
              )}
            </div>

            {/* Per-guest names — optional. Each guest gets their own QR ticket;
                names shown on tickets and to door staff. Editable later too. */}
            {totalSeats > 1 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                  Guest names{" "}
                  <span className="font-normal text-neutral-500">
                    (optional — you can edit these later)
                  </span>
                </label>
                <div className="space-y-2">
                  {Array.from({ length: totalSeats }, (_, i) => (
                    <input
                      key={i}
                      type="text"
                      value={guestNames[i] ?? ""}
                      onChange={(e) => setGuestName(i, e.target.value)}
                      autoComplete="off"
                      maxLength={80}
                      aria-label={`Guest ${i + 1} name`}
                      placeholder={i === 0 ? "Guest 1 (e.g. you)" : `Guest ${i + 1}`}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-neutral-500 transition-colors focus:border-violet-glow/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-violet-glow/25"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Required confirmations — the Pay button stays disabled until all
                are checked. */}
            <fieldset className="space-y-2.5 border-t border-white/10 pt-4">
              <legend className="mb-1 text-xs font-medium uppercase tracking-wider text-neutral-500">
                Before you continue
              </legend>
              <Consent id="c-terms" checked={consents.terms} onChange={() => toggle("terms")}>
                I agree to the{" "}
                <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-violet-soft hover:underline">
                  Terms &amp; Conditions
                </a>
                .
              </Consent>
              <Consent id="c-privacy" checked={consents.privacy} onChange={() => toggle("privacy")}>
                I have read the{" "}
                <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-violet-soft hover:underline">
                  Privacy Policy
                </a>
                .
              </Consent>
              <Consent id="c-refund" checked={consents.refund} onChange={() => toggle("refund")}>
                I understand the{" "}
                <a href="/legal/refund" target="_blank" rel="noopener noreferrer" className="text-violet-soft hover:underline">
                  Refund Policy
                </a>
                .
              </Consent>
            </fieldset>

            {/* Bot check — renders nothing unless Turnstile is configured. */}
            <TurnstileWidget onToken={setTurnstileToken} />

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
              >
                {error}
              </p>
            )}

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div>
                <p className="text-xs text-neutral-400">Total</p>
                <p className="font-display text-2xl font-semibold tabular-nums text-white">
                  {inr(total)}
                </p>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !allConsented}
                aria-disabled={loading || !allConsented}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>Pay {inr(total)}</>
                )}
              </button>
            </div>

            <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-neutral-500">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-soft/70" />
              Secured by Razorpay · Instant QR ticket by email
            </p>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface FieldProps {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-300">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-500 transition-colors focus:border-violet-glow/50 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-violet-glow/25"
      />
    </div>
  );
}

function Consent({
  id,
  checked,
  onChange,
  children,
}: {
  id: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-sm text-neutral-300">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-white/5 text-violet-glow accent-violet-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-glow/60"
      />
      <span>{children}</span>
    </label>
  );
}
