// You are helping build an AI Product Decision Platform. Simple create-org for existing users (no questionnaire).

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateOrgPage() {
  const router = useRouter();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push("/login");
        return;
      }
      const res = await fetch(`${apiUrl}/organizations/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data?.organization) {
        router.push("/decision-cards");
        return;
      }
      setChecking(false);
    }
    check();
  }, [apiUrl, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = (name.trim() || "My workspace");
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.push("/login");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to create organization.");
      window.location.href = "/decision-cards";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-violet/10 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <div className="card-3d glass rounded-2xl p-8 shadow-2xl">
          <h1 className="font-display text-2xl font-bold gradient-text mb-2">Name your workspace</h1>
          <p className="text-white/70 text-sm mb-6">
            Optional — for your reference only. It doesn&apos;t change how the product works. Your 14-day trial will begin.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="e.g. My workspace or Acme Corp (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-violet/50 focus:border-transparent transition"
            />
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? "Creating…" : "Create"}
            </button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
          </form>
        </div>
        <Link href="/decision-cards" className="block text-center mt-4 text-white/50 hover:text-white/80 text-sm">← Back to app</Link>
      </div>
    </div>
  );
}
