// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. Set new password after clicking reset link in email.

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    function checkSession() {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setHasSession(!!session);
      });
    }
    checkSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSession();
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (hasSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/10 via-transparent to-brand-cyan/10 pointer-events-none" />
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="card-3d glass rounded-2xl p-8">
            <h1 className="font-display text-2xl font-bold text-white mb-2">Set new password</h1>
            <p className="text-white/70 text-sm mb-6">
              Use the link from your email to set a new password. If the link expired, request a new one.
            </p>
            <Link href="/forgot-password" className="btn-primary inline-block">Request new link</Link>
            <p className="mt-4">
              <Link href="/login" className="text-brand-cyan hover:underline text-sm">← Back to sign in</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/10 via-transparent to-brand-cyan/10 pointer-events-none" />
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="card-3d glass rounded-2xl p-8 border border-brand-cyan/30">
            <div className="w-14 h-14 rounded-full bg-brand-cyan/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-xl font-bold text-white mb-2">Password updated</h1>
            <p className="text-white/70 text-sm">Sign in with your new password.</p>
            <p className="text-white/50 text-xs mt-4">Redirecting to sign in…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/10 via-transparent to-brand-cyan/10 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <div className="card-3d glass rounded-2xl p-8 shadow-2xl">
          <h1 className="font-display text-2xl font-bold gradient-text mb-2">Set new password</h1>
          <p className="text-white/70 text-sm mb-6">Choose a new password (at least 6 characters).</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-transparent transition"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-transparent transition"
            />
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Updating…" : "Update password"}
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </form>
        </div>
        <Link href="/login" className="block text-center mt-4 text-white/50 hover:text-white/80 text-sm">← Back to sign in</Link>
      </div>
    </div>
  );
}
