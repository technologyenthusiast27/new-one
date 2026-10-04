"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Camera, Loader2 } from "lucide-react";

type Result =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "success"; name: string; already: boolean }
  | { kind: "error"; message: string };

// Extract the attendee ticket code from a scanned value. Attendee QRs encode a
// `/ticket/a/<code>` URL; the code itself is the per-seat id (NL-…-01). We also
// accept a bare code so an admin can hand-type it if needed.
function extractAttendeeCode(text: string): string | null {
  const trimmed = text.trim();
  const match = trimmed.match(/\/ticket\/a\/([^/?#]+)/i);
  if (match) return decodeURIComponent(match[1]);
  // Per-seat codes look like NL-HOB-VIP-3F7A2C-01 (booking id + seat suffix,
  // 2+ digits — matches the server's attendee-code validation).
  if (/^NL-[A-Z0-9-]+-\d{2,}$/i.test(trimmed)) return trimmed;
  return null;
}

export function QRScanner({ onChanged }: { onChanged?: () => void }) {
  const [active, setActive] = useState(false);
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const lastRef = useRef<{ id: string; at: number } | null>(null);
  const containerId = "qr-reader";

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner as unknown as {
        stop: () => Promise<void>;
        clear: () => void;
      };

      await scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => handleDecode(decoded),
          () => {},
        )
        .catch((err) => {
          if (!cancelled)
            setResult({
              kind: "error",
              message:
                err instanceof Error ? err.message : "Could not start the camera.",
            });
        });
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {});
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  async function handleDecode(decoded: string) {
    const code = extractAttendeeCode(decoded);
    if (!code) {
      setResult({ kind: "error", message: "Unrecognised QR code." });
      return;
    }
    // Debounce repeated scans of the same code.
    const now = Date.now();
    if (lastRef.current && lastRef.current.id === code && now - lastRef.current.at < 2500) {
      return;
    }
    lastRef.current = { id: code, at: now };

    setResult({ kind: "checking" });
    try {
      const res = await fetch(`/api/admin/attendees/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "checked_in" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Check-in failed.");
      }
      // `alreadyCheckedIn` means this guest was scanned before — surface it so
      // the door staff can tell a fresh admit from a re-scan.
      setResult({
        kind: "success",
        name:
          data.attendee?.name ??
          (data.attendee ? `Guest #${data.attendee.seatIndex}` : "Guest"),
        already: Boolean(data.alreadyCheckedIn),
      });
      onChanged?.();
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : "Check-in failed.",
      });
    }
  }

  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">QR check-in</h3>
          <p className="mt-1 text-sm text-neutral-400">
            Point a guest&apos;s ticket QR at the camera to check them in.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setResult({ kind: "idle" });
            setActive((v) => !v);
          }}
          className={active ? "btn-ghost" : "btn-primary"}
        >
          <Camera className="h-4 w-4" />
          {active ? "Stop" : "Start camera"}
        </button>
      </div>

      {active && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div
            id={containerId}
            className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 [&_video]:rounded-2xl"
          />
          <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
            {result.kind === "idle" && (
              <p className="text-sm text-neutral-500">Waiting for a scan…</p>
            )}
            {result.kind === "checking" && (
              <p className="flex items-center gap-2 text-sm text-neutral-300">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking in…
              </p>
            )}
            {result.kind === "success" && (
              <div>
                <CheckCircle2
                  className={`mx-auto h-10 w-10 ${result.already ? "text-amber-400" : "text-emerald-400"}`}
                />
                <p className="mt-3 font-semibold text-white">{result.name}</p>
                {result.already ? (
                  <p className="mt-1 text-xs text-amber-300">
                    Already checked in earlier
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-emerald-300">Checked in · admits 1</p>
                )}
              </div>
            )}
            {result.kind === "error" && (
              <div>
                <XCircle className="mx-auto h-10 w-10 text-red-400" />
                <p className="mt-3 text-sm text-red-300">{result.message}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
