"use client";

import { useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import type { AgeCategory, Event, EventStatus } from "@/lib/types";
import { AGE_CATEGORIES, ageCategoryLabel } from "@/lib/age";
import { missingComplianceForPublish } from "@/lib/compliance";

export interface EventFormValues {
  name: string;
  slug: string;
  code: string;
  presenter: string;
  tagline: string;
  status: EventStatus;
  eventDate: string; // datetime-local value
  doorsOpenAt: string;
  venueName: string;
  venueCity: string;
  ageCategory: AgeCategory;
  minorsAllowed: boolean;
  guardianConsentRequired: boolean;
  idRequired: boolean;
  // Compliance (organizer-configured, stored in events.compliance jsonb)
  entryInstructions: string;
  venueRules: string;
  safetyGuidelines: string;
  itemsAllowed: string; // newline-separated in the form
  itemsProhibited: string;
  accessibilityInfo: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

// Convert an ISO timestamp to a value the <input type=datetime-local> accepts.
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

export function EventForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: Event;
  onSaved: (event: Event) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<EventFormValues>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    code: initial?.code ?? "",
    presenter: initial?.presenter ?? "",
    tagline: initial?.tagline ?? "",
    status: initial?.status ?? "draft",
    eventDate: toLocalInput(initial?.eventDate ?? null),
    doorsOpenAt: toLocalInput(initial?.doorsOpenAt ?? null),
    venueName: initial?.venueName ?? "",
    venueCity: initial?.venueCity ?? "",
    ageCategory: initial?.ageCategory ?? "18_plus",
    minorsAllowed: initial?.minorsAllowed ?? false,
    guardianConsentRequired: initial?.guardianConsentRequired ?? false,
    idRequired: initial?.idRequired ?? true,
    entryInstructions: initial?.compliance?.entryInstructions ?? "",
    venueRules: initial?.compliance?.venueRules ?? "",
    safetyGuidelines: initial?.compliance?.safetyGuidelines ?? "",
    itemsAllowed: (initial?.compliance?.itemsAllowed ?? []).join("\n"),
    itemsProhibited: (initial?.compliance?.itemsProhibited ?? []).join("\n"),
    accessibilityInfo: initial?.compliance?.accessibilityInfo ?? "",
    emergencyContactName: initial?.compliance?.emergencyContactName ?? "",
    emergencyContactPhone: initial?.compliance?.emergencyContactPhone ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof EventFormValues>(k: K, v: EventFormValues[K]) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  function buildCompliance() {
    const lines = (s: string) =>
      s.split("\n").map((x) => x.trim()).filter(Boolean);
    return {
      entryInstructions: values.entryInstructions.trim(),
      venueRules: values.venueRules.trim(),
      safetyGuidelines: values.safetyGuidelines.trim(),
      itemsAllowed: lines(values.itemsAllowed),
      itemsProhibited: lines(values.itemsProhibited),
      accessibilityInfo: values.accessibilityInfo.trim(),
      emergencyContactName: values.emergencyContactName.trim(),
      emergencyContactPhone: values.emergencyContactPhone.trim(),
    };
  }

  // Live preview of what still blocks publishing.
  const missingForPublish = missingComplianceForPublish(buildCompliance());

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side guard: block publish until mandatory compliance is complete
    // (the server enforces this too).
    if (values.status === "published" && missingForPublish.length > 0) {
      setError(
        `Complete these before publishing: ${missingForPublish.join(", ")}.`,
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        code: values.code,
        presenter: values.presenter,
        tagline: values.tagline || null,
        status: values.status,
        eventDate: values.eventDate ? new Date(values.eventDate).toISOString() : undefined,
        doorsOpenAt: values.doorsOpenAt ? new Date(values.doorsOpenAt).toISOString() : null,
        venueName: values.venueName || null,
        venueCity: values.venueCity || null,
        ageCategory: values.ageCategory,
        minorsAllowed: values.minorsAllowed,
        guardianConsentRequired: values.guardianConsentRequired,
        idRequired: values.idRequired,
        compliance: buildCompliance(),
      };
      const res = await fetch(
        initial ? `/api/admin/events/${initial.id}` : "/api/admin/events",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the event.");
      onSaved(data.event as Event);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl glass p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Event name" value={values.name} onChange={(v) => set("name", v)} required />
        <TextField label="Presenter" value={values.presenter} onChange={(v) => set("presenter", v)} required />
        <TextField label="Slug (URL)" value={values.slug} onChange={(v) => set("slug", v)} placeholder="house-of-balloons" required />
        <TextField label="Code (ticket prefix)" value={values.code} onChange={(v) => set("code", v.toUpperCase())} placeholder="HOB" required />
        <div className="sm:col-span-2">
          <TextField label="Tagline" value={values.tagline} onChange={(v) => set("tagline", v)} />
        </div>
        <div>
          <Label>Status</Label>
          <select
            value={values.status}
            onChange={(e) => set("status", e.target.value as EventStatus)}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-violet-glow/50 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="coming_soon">Coming soon</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div />
        <DateField label="Event date & time" value={values.eventDate} onChange={(v) => set("eventDate", v)} required />
        <DateField label="Doors open" value={values.doorsOpenAt} onChange={(v) => set("doorsOpenAt", v)} />
        <TextField label="Venue name" value={values.venueName} onChange={(v) => set("venueName", v)} />
        <TextField label="Venue city" value={values.venueCity} onChange={(v) => set("venueCity", v)} />
      </div>

      {/* Age & entry policy */}
      <fieldset className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <legend className="px-2 text-sm font-medium text-neutral-300">Age &amp; entry policy</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Minimum age</Label>
            <select
              value={values.ageCategory}
              onChange={(e) => set("ageCategory", e.target.value as AgeCategory)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-violet-glow/50 focus:outline-none"
            >
              {AGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {ageCategoryLabel(c)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-center gap-3 pt-2">
            <Checkbox
              label="Attendees under 18 permitted"
              checked={values.minorsAllowed}
              onChange={(v) => set("minorsAllowed", v)}
            />
            <Checkbox
              label="Parent/guardian permission required for minors"
              checked={values.guardianConsentRequired}
              onChange={(v) => set("guardianConsentRequired", v)}
            />
            <Checkbox
              label="Government ID may be verified at entry"
              checked={values.idRequired}
              onChange={(v) => set("idRequired", v)}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-500">
          These settings drive the public Age &amp; Entry Policy and the required
          checkout confirmations. &ldquo;18+&rdquo; automatically disallows minors.
        </p>
      </fieldset>

      {/* Compliance information (shown to attendees; required to publish) */}
      <fieldset className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <legend className="px-2 text-sm font-medium text-neutral-300">
          Compliance &amp; venue information
        </legend>
        <div className="grid gap-4">
          <TextAreaField
            label="Entry instructions"
            value={values.entryInstructions}
            onChange={(v) => set("entryInstructions", v)}
            placeholder="How and where to enter, what to bring, last entry time…"
          />
          <TextAreaField
            label="Venue rules"
            value={values.venueRules}
            onChange={(v) => set("venueRules", v)}
            placeholder="Re-entry, smoking, right of admission…"
          />
          <TextAreaField
            label="Safety guidelines"
            value={values.safetyGuidelines}
            onChange={(v) => set("safetyGuidelines", v)}
            placeholder="Medical/first-aid, exits, water, reporting…"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextAreaField
              label="Items allowed (one per line)"
              value={values.itemsAllowed}
              onChange={(v) => set("itemsAllowed", v)}
              placeholder={"Government photo ID\nPhone & power bank"}
            />
            <TextAreaField
              label="Items prohibited (one per line)"
              value={values.itemsProhibited}
              onChange={(v) => set("itemsProhibited", v)}
              placeholder={"Outside food or drink\nWeapons"}
            />
          </div>
          <TextAreaField
            label="Accessibility information"
            value={values.accessibilityInfo}
            onChange={(v) => set("accessibilityInfo", v)}
            placeholder="Wheelchair access, assistance contact…"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Emergency contact name"
              value={values.emergencyContactName}
              onChange={(v) => set("emergencyContactName", v)}
            />
            <TextField
              label="Emergency contact phone"
              value={values.emergencyContactPhone}
              onChange={(v) => set("emergencyContactPhone", v)}
            />
          </div>
        </div>

        {missingForPublish.length > 0 && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Required before publishing: {missingForPublish.join(", ")}.
            </span>
          </p>
        )}
      </fieldset>

      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}

      <div className="mt-6 flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : initial ? "Save changes" : "Create event"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-neutral-300">{children}</label>;
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none focus:ring-2 focus:ring-violet-glow/25"
      />
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-white/20 bg-white/5 accent-violet-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-glow/60"
      />
      {label}
    </label>
  );
}

function TextField({
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
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none focus:ring-2 focus:ring-violet-glow/25"
      />
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="datetime-local"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white [color-scheme:dark] focus:border-violet-glow/50 focus:outline-none focus:ring-2 focus:ring-violet-glow/25"
      />
    </div>
  );
}
