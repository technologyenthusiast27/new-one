// Pure display formatters shared by client + server components.
// All event times are rendered in IST (the platform's home timezone).

const TZ = "Asia/Kolkata";

export function inr(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

/** "Saturday, 20 December 2026" */
export function formatEventDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });
}

/** "20 DEC 2026" */
export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso)
    .toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: TZ,
    })
    .toUpperCase();
}

/** "7:00 PM" */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}

/** Split a title so the last word can be emphasised on its own line. */
export function splitTitle(name: string): { head: string; tail: string } {
  const words = name.trim().split(/\s+/);
  if (words.length < 2) return { head: "", tail: name };
  return { head: words.slice(0, -1).join(" "), tail: words[words.length - 1] };
}
