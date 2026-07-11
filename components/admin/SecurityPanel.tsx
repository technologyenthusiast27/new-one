"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Copy,
  KeyRound,
  LogOut,
  RefreshCw,
} from "lucide-react";

interface Props {
  email: string | null;
  role: string;
  mfaRequired: boolean;
  hasVerifiedTotp: boolean;
  factorId: string | null;
  aal2: boolean;
}

/**
 * Account security panel: TOTP enrollment (QR + first code), recovery codes
 * (shown once + regeneration), disable MFA (aal2 only), sign out everywhere.
 * All state changes go through server-verified endpoints.
 */
export function SecurityPanel(props: Props) {
  const router = useRouter();
  const [enrolling, setEnrolling] = useState<{
    factorId: string;
    qrCode: string | null;
    secret: string | null;
  } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  async function post(url: string, body?: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function startEnroll() {
    setBusy("enroll");
    setError(null);
    try {
      const data = await post("/api/auth/mfa/enroll");
      setEnrolling({ factorId: data.factorId, qrCode: data.qrCode, secret: data.secret });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start enrollment.");
    } finally {
      setBusy(null);
    }
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enrolling) return;
    setBusy("confirm");
    setError(null);
    try {
      const data = await post("/api/auth/mfa/enroll/verify", {
        factorId: enrolling.factorId,
        code: code.trim(),
      });
      setEnrolling(null);
      setCode("");
      setRecoveryCodes(data.recoveryCodes?.length ? data.recoveryCodes : null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setBusy(null);
    }
  }

  async function regenerateCodes() {
    setBusy("regen");
    setError(null);
    try {
      const data = await post("/api/admin/security/recovery-codes");
      setRecoveryCodes(data.recoveryCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not regenerate codes.");
    } finally {
      setBusy(null);
    }
  }

  async function disableMfa() {
    if (!props.factorId) return;
    if (!window.confirm("Disable two-factor authentication for this account?")) return;
    setBusy("disable");
    setError(null);
    try {
      await post("/api/auth/mfa/unenroll", { factorId: props.factorId });
      setRecoveryCodes(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disable MFA.");
    } finally {
      setBusy(null);
    }
  }

  async function signOutEverywhere() {
    if (!window.confirm("Sign out of every device? All sessions will be revoked.")) return;
    setBusy("logout-all");
    try {
      await post("/api/auth/logout", { scope: "global" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none focus:ring-2 focus:ring-violet-glow/25";

  return (
    <div className="mx-auto max-w-2xl">
      <span className="section-eyebrow">Account</span>
      <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Security</h1>
      {props.email && <p className="mt-1 text-sm text-neutral-400">{props.email}</p>}

      {/* ── Two-factor authentication ── */}
      <div className="mt-8 rounded-3xl glass p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              {props.hasVerifiedTotp ? (
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-amber-400" />
              )}
              Two-factor authentication
            </h2>
            <p className="mt-1 text-sm text-neutral-400">
              {props.hasVerifiedTotp
                ? "Enabled — your account requires an authenticator code at sign-in."
                : props.mfaRequired
                  ? "Required for this account. Set up an authenticator app to continue."
                  : "Optional but recommended. Protects your account with a 6-digit code."}
            </p>
          </div>
          {!props.hasVerifiedTotp && !enrolling && (
            <button type="button" onClick={startEnroll} className="btn-primary shrink-0" disabled={busy !== null}>
              {busy === "enroll" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Set up
            </button>
          )}
        </div>

        {enrolling && (
          <form onSubmit={confirmEnroll} className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-sm text-neutral-300">
              1. Scan this QR code with Google Authenticator, 1Password, Authy or any TOTP app.
            </p>
            {enrolling.qrCode && (
              <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={enrolling.qrCode} alt="Authenticator enrollment QR code" width={176} height={176} className="h-44 w-44" />
              </div>
            )}
            {enrolling.secret && (
              <p className="mt-3 text-center text-xs text-neutral-500">
                Can&rsquo;t scan? Enter this key manually:{" "}
                <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-neutral-300">{enrolling.secret}</code>
              </p>
            )}
            <p className="mt-4 text-sm text-neutral-300">2. Enter the 6-digit code it shows:</p>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className={`${inputCls} text-center font-mono tracking-[0.4em]`}
              />
              <button type="submit" className="btn-primary shrink-0" disabled={busy !== null}>
                {busy === "confirm" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
              </button>
            </div>
          </form>
        )}

        {props.hasVerifiedTotp && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={regenerateCodes} className="btn-ghost" disabled={busy !== null || !props.aal2}>
              {busy === "regen" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Regenerate recovery codes
            </button>
            <button type="button" onClick={disableMfa} className="btn-ghost" disabled={busy !== null || !props.aal2}>
              {busy === "disable" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
              Disable MFA
            </button>
            {!props.aal2 && (
              <p className="w-full text-xs text-neutral-500">
                Re-authenticate with your code to manage MFA settings.
              </p>
            )}
          </div>
        )}

        {recoveryCodes && (
          <div className="mt-5 rounded-2xl border border-violet-glow/30 bg-violet-glow/10 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-violet-soft">
              <KeyRound className="h-4 w-4" />
              Recovery codes — save these now
            </h3>
            <p className="mt-1 text-xs text-neutral-400">
              Each code works once if you lose your authenticator. They will not be shown again.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {recoveryCodes.map((c) => (
                <code key={c} className="rounded bg-black/30 px-2 py-1 text-center font-mono text-xs text-white">
                  {c}
                </code>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(recoveryCodes.join("\n"))}
              className="btn-ghost mt-3"
            >
              <Copy className="h-4 w-4" />
              Copy all
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>

      {/* ── Sessions ── */}
      <div className="mt-6 rounded-3xl glass p-6">
        <h2 className="text-lg font-semibold">Sessions</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Suspect your account is compromised? Revoke every active session on all devices.
        </p>
        <button
          type="button"
          onClick={signOutEverywhere}
          className="btn-ghost mt-4 hover:!bg-red-500/15 hover:!text-red-300"
          disabled={busy !== null}
        >
          {busy === "logout-all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          Sign out everywhere
        </button>
      </div>
    </div>
  );
}
