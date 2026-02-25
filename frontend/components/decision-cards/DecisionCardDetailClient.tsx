// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Card = {
  id: string;
  problem: string;
  recommended_action: string;
  impact_level: number;
  effort_estimate: number;
  confidence_score: number;
  evidence_snippets: Array<string | { input?: string; output?: string }>;
  status?: string;
  created_at?: string;
};

export default function DecisionCardDetailClient({ cardId }: { cardId: string }) {
  const router = useRouter();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const isDone = (card?.status || "open") === "done";

  async function setStatus(newStatus: "open" | "done") {
    if (!card || updating) return;
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    setUpdating(true);
    try {
      const res = await fetch(`${apiUrl}/decision_cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCard((c) => (c ? { ...c, status: newStatus } : c));
        router.refresh();
      }
    } finally {
      setUpdating(false);
    }
  }

  useEffect(() => {
    async function fetchCard() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${apiUrl}/decision_cards/${cardId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.status === 404) {
          setError("Card not found.");
          return;
        }
        if (!res.ok) {
          setError("Failed to load card.");
          return;
        }
        const data = await res.json();
        setCard(data);
      } catch {
        setError("Request failed.");
      } finally {
        setLoading(false);
      }
    }
    fetchCard();
  }, [apiUrl, cardId]);

  if (loading) {
    return (
      <div className="card-3d glass rounded-2xl p-8 animate-pulse">
        <div className="h-8 w-3/4 bg-white/10 rounded mb-4" />
        <div className="h-4 w-full bg-white/5 rounded mb-2" />
        <div className="h-4 w-full bg-white/5 rounded" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="card-3d glass rounded-2xl p-8">
        <p className="text-red-300">{error ?? "Card not found."}</p>
      </div>
    );
  }

  const confidenceLabel =
    card.confidence_score >= 0.7 ? "High" : card.confidence_score >= 0.4 ? "Medium" : "Low";
  const snippets = Array.isArray(card.evidence_snippets) ? card.evidence_snippets : [];

  return (
    <div className="card-3d glass rounded-2xl p-8 border border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold text-white mb-2">{card.problem}</h1>
          {card.created_at && (
            <p className="text-white/50 text-sm">
              Added {new Date(card.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={
              isDone
                ? "px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm"
                : "px-3 py-1.5 rounded-lg bg-brand-amber/20 text-brand-amber text-sm"
            }
          >
            {isDone ? "Resolved" : "Open"}
          </span>
          <button
            type="button"
            onClick={() => setStatus(isDone ? "open" : "done")}
            disabled={updating}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-sm hover:bg-white/20 disabled:opacity-50"
          >
            {updating ? "Updating…" : isDone ? "Mark as open" : "Mark as done"}
          </button>
        </div>
      </div>
      <p className="text-white/80 mb-6">{card.recommended_action}</p>
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="px-3 py-1.5 rounded-lg bg-brand-violet/30 text-brand-cyan text-sm">
          Impact {card.impact_level}/5
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-sm">
          Effort {card.effort_estimate}/5
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-brand-amber/20 text-brand-amber text-sm">
          Confidence: {confidenceLabel}
        </span>
      </div>
      {snippets.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-brand-cyan mb-3">Evidence</h2>
          <ul className="space-y-4">
            {snippets.map((s, i) => (
              <li key={i} className="rounded-xl bg-white/5 border border-white/10 p-4">
                {typeof s === "string" ? (
                  <p className="text-white/80 text-sm">{s}</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    {s.input != null && (
                      <p><span className="text-white/50">User: </span><span className="text-white/90">{s.input}</span></p>
                    )}
                    {s.output != null && (
                      <p><span className="text-white/50">System: </span><span className="text-white/90">{s.output}</span></p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
