"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { COMPANY } from "@/lib/company";

/**
 * Simple contact form. With no backend endpoint wired yet, submitting opens the
 * user's mail client pre-filled to support — a safe, dependency-free default
 * that never silently drops a message. Swap for an API route when ready.
 */
export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(form.subject || `Enquiry from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`,
    );
    window.location.href = `mailto:${COMPANY.supportEmail}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-3xl glass p-8 text-center"
      >
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
        <h3 className="mt-4 text-lg font-semibold">Thanks — almost there</h3>
        <p className="mt-2 text-sm text-neutral-400">
          Your email app should have opened with your message ready to send. If it
          didn&rsquo;t, email us directly at{" "}
          <a className="text-violet-soft hover:underline" href={`mailto:${COMPANY.supportEmail}`}>
            {COMPANY.supportEmail}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl glass p-6 sm:p-8" aria-label="Contact form">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Your name" value={form.name} onChange={(v) => set("name", v)} required autoComplete="name" />
        <Field id="email" label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} required autoComplete="email" />
      </div>
      <div className="mt-4">
        <Field id="subject" label="Subject" value={form.subject} onChange={(v) => set("subject", v)} />
      </div>
      <div className="mt-4">
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-neutral-300">
          Message
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none focus:ring-2 focus:ring-violet-glow/25"
          placeholder="How can we help?"
        />
      </div>
      <button type="submit" className="btn-primary mt-6 w-full sm:w-auto">
        <Send className="h-4 w-4" />
        Send message
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-neutral-300">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none focus:ring-2 focus:ring-violet-glow/25"
      />
    </div>
  );
}
