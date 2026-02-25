// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/lib/org";

type GenerateResult = {
  ok: boolean;
  count: number;
  insights: Array<{ title: string; description: string; frequency: number }>;
  message?: string;
} | null;

export default function GenerateInsightsClient() {
  const { orgState, loading: orgLoading } = useOrganization();
  const canUpload = orgState?.can_upload !== false;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult>(null);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const runGenerate = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError("Not signed in.");
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/insights/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Generation failed.");
        return;
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  return (
    <div className="space-y-6">
      {!orgLoading && !canUpload && (
        <div className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-4">
          <p className="text-amber-200 font-medium mb-1">Trial ended</p>
          <p className="text-white/80 text-sm mb-3">Subscribe ($20/month) to generate insights.</p>
          <Link href="/settings" className="btn-primary inline-block">Subscribe in Settings</Link>
        </div>
      )}
      <button
        type="button"
        onClick={runGenerate}
        disabled={loading || !canUpload}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading ? "Analyzing logs and generating insights…" : "Generate insights"}
      </button>

      {error && (
        <div className="rounded-xl border border-red-400/50 bg-red-400/10 p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      {result && !loading && (
        <div className="rounded-xl border border-brand-cyan/50 bg-brand-cyan/5 p-4">
          {result.count > 0 ? (
            <>
              <p className="text-white font-medium mb-2">Generated {result.count} insight(s).</p>
              <p className="text-white/70 text-sm mb-4">
                These are failure patterns from your logs with plain-language explanations.
              </p>
              <Link href="/decision-cards" className="btn-primary inline-block">
                View Decision Cards →
              </Link>
            </>
          ) : (
            <>
              <p className="text-white/80">{result.message || "No insights generated."}</p>
              <p className="text-white/60 text-sm mt-2">
                Upload AI logs with some negative feedback (e.g. thumb_down or low scores), then try again.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
