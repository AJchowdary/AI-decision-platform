// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/organizations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ name: name.trim() || "My team" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Failed to create organization.");
      }
      router.push("/decision-cards");
      window.location.href = "/decision-cards";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-violet/10 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <div className="card-3d glass rounded-2xl p-8 shadow-2xl">
          <h1 className="font-display text-2xl font-bold gradient-text mb-2">Create your organization</h1>
          <p className="text-white/70 text-sm mb-6">
            Your team gets a 14-day free trial. No card required. After that, $20/month to keep uploading and generating insights.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Organization name (e.g. Acme AI)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-transparent transition"
            />
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Creating…" : "Create organization"}
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </form>
        </div>
        <a href="/decision-cards" className="block text-center mt-4 text-white/50 hover:text-white/80 text-sm">← Skip (already have one)</a>
      </div>
    </div>
  );
}
