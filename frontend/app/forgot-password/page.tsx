// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. Forgot password: request reset link.

"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : "";
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/10 via-transparent to-brand-cyan/10 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <div className="card-3d glass rounded-2xl p-8 shadow-2xl">
          <h1 className="font-display text-2xl font-bold gradient-text mb-2">Reset password</h1>
          <p className="text-white/70 text-sm mb-6">
            Enter your email and we&apos;ll send you a link to set a new password.
          </p>
          {sent ? (
            <div className="rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 p-4 text-center">
              <p className="text-white font-medium mb-1">Check your email</p>
              <p className="text-white/70 text-sm">
                We sent a reset link to <span className="text-white/90">{email}</span>. Click the link to set a new password.
              </p>
              <Link href="/login" className="btn-secondary mt-4 inline-block text-sm">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-transparent transition"
              />
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                {loading ? "Sending…" : "Send reset link"}
              </button>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </form>
          )}
        </div>
        <Link href="/login" className="block text-center mt-4 text-white/50 hover:text-white/80 text-sm">← Back to sign in</Link>
      </div>
    </div>
  );
}
