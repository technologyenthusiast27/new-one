"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Loader2, LogIn, KeyRound, ShieldCheck } from "lucide-react";
import { AmbientGlow } from "@/components/ui/AmbientGlow";
import { TurnstileWidget } from "@/components/TurnstileWidget";

/**
 * Whitelist validation for the post-login redirect target. Only internal
 * /admin paths are ever followed — external URLs, protocol-relative URLs
 * (//evil.com), javascript: URIs and malformed values all fall back to /admin.
 */
function safeNextPath(raw: string | null): string {
  const fallback = "/admin";
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[:\s\\]/.test(raw)) return fallback;
  if (!/^\/admin(\/|\?|$)/.test(raw)) return fallback;
  return raw;
}

type Step = "password" | "mfa";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const timedOut = params.get("timeout") === "1";

  // ?mfa=1 → an aal1 session already exists and only the code is missing.
  const [step, setStep] = useState<Step>(params.get("mfa") === "1" ? "mfa" : "password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function finish() {
    router.replace(next);
    router.refresh();
  }

  async function onSubmitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, turnstileToken: turnstileToken ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sign in.");
      if (data.mfaRequired) {
        setStep("mfa");
        setLoading(false);
      } else {
        finish();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setLoading(false);
    }
  }

  async function onSubmitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = useRecovery ? { recoveryCode: recoveryCode.trim() } : { code: code.trim() };
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      if (data.mfaCleared) {
        // Recovery used: authenticator removed — set up a new one now.
        router.replace("/admin/security");
        router.refresh();
      } else {
        finish();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed.");
      setLoading(false);
    }
  }

  const inputCls =
    "w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none focus:ring-2 focus:ring-violet-glow/25";

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={step === "password" ? onSubmitPassword : onSubmitCode}
      className="w-full max-w-sm rounded-3xl glass-strong p-8"
    >
      <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-glow/20 to-violet-deep/20 ring-1 ring-inset ring-white/10">
        {step === "password" ? (
          <Lock className="h-6 w-6 text-violet-soft" />
        ) : (
          <ShieldCheck className="h-6 w-6 text-violet-soft" />
        )}
      </div>
      <h1 className="text-2xl font-semibold">
        {step === "password" ? "NovaLabs admin" : "Two-factor check"}
      </h1>
      <p className="mt-2 text-sm text-neutral-400">
        {step === "password"
          ? "Sign in to manage events, bookings and check-ins."
          : useRecovery
            ? "Enter one of your single-use recovery codes."
            : "Enter the 6-digit code from your authenticator app."}
      </p>

      {timedOut && step === "password" && (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Your session expired. Please sign in again.
        </p>
      )}

      {step === "password" ? (
        <>
          <label htmlFor="email" className="mt-6 mb-1.5 block text-sm font-medium text-neutral-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@novalabs.club"
            className={inputCls}
          />

          <label htmlFor="password" className="mt-4 mb-1.5 block text-sm font-medium text-neutral-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />

          <div className="mt-4">
            <TurnstileWidget onToken={setTurnstileToken} />
          </div>
        </>
      ) : (
        <>
          {useRecovery ? (
            <>
              <label htmlFor="recovery" className="mt-6 mb-1.5 block text-sm font-medium text-neutral-300">
                Recovery code
              </label>
              <input
                id="recovery"
                type="text"
                autoComplete="one-time-code"
                required
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className={`${inputCls} font-mono tracking-widest`}
              />
            </>
          ) : (
            <>
              <label htmlFor="code" className="mt-6 mb-1.5 block text-sm font-medium text-neutral-300">
                Authenticator code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className={`${inputCls} text-center font-mono text-lg tracking-[0.5em]`}
              />
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setUseRecovery((v) => !v);
              setError(null);
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-neutral-400 transition-colors hover:text-white"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {useRecovery ? "Use authenticator code instead" : "Use a recovery code instead"}
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : step === "password" ? (
          <>
            <LogIn className="h-4 w-4" />
            Sign in
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4" />
            Verify
          </>
        )}
      </button>
    </motion.form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center px-6">
      <AmbientGlow />
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
