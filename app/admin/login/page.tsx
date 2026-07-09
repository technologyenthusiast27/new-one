"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AmbientGlow } from "@/components/ui/AmbientGlow";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setLoading(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={onSubmit}
      className="w-full max-w-sm rounded-3xl glass-strong p-8"
    >
      <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-glow/20 to-violet-deep/20 ring-1 ring-inset ring-white/10">
        <Lock className="h-6 w-6 text-violet-soft" />
      </div>
      <h1 className="text-2xl font-semibold">NovaLabs admin</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Sign in to manage events, bookings and check-ins.
      </p>

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
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none focus:ring-2 focus:ring-violet-glow/25"
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
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-violet-glow/50 focus:outline-none focus:ring-2 focus:ring-violet-glow/25"
      />

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <LogIn className="h-4 w-4" />
            Sign in
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
