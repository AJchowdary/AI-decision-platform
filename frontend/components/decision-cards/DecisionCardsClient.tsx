// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/lib/org";

type CardPlaceholder = {
  id: string;
  problem: string;
  recommended_action: string;
  impact_level: number;
  effort_estimate: number;
  confidence_score: number;
  evidence_snippets?: Array<string | { input?: string; output?: string }>;
  status?: string;
  created_at?: string;
}

export default function DecisionCardsClient() {
  const { orgState, loading: orgLoading } = useOrganization();
  const canUpload = orgState?.can_upload !== false;
  const [cards, setCards] = useState<CardPlaceholder[]>([]);
  const [top3, setTop3] = useState<CardPlaceholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchCards = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    const res = await fetch(`${apiUrl}/decision_cards/list`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setCards(data.cards || []);
      setTop3(data.top_3_this_week || []);
    }
    setLoading(false);
  }, [apiUrl]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  async function handleGenerateCards() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setGenerateError("Not signed in.");
      return;
    }
    setGenerateLoading(true);
    setGenerateError(null);
    try {
      const res = await fetch(`${apiUrl}/decision_cards/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.detail || "Failed to generate cards.");
        return;
      }
      if (data.count > 0) {
        await fetchCards();
      } else {
        setGenerateError(data.message || "No new cards. Generate insights first, then try again.");
      }
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setGenerateLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="h-8 w-64 bg-white/10 rounded-lg animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-3d glass rounded-2xl p-6 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasCards = top3.length > 0 || cards.length > 0;
  const displayCards = top3.length > 0 ? top3 : cards;
  const openCards = cards.filter((c) => (c.status || "open") === "open");
  const doneCards = cards.filter((c) => c.status === "done");

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-display text-3xl font-bold text-white mb-1">What to fix this week</h1>
        <p className="text-white/70">Evidence-backed recommendations — no dashboards.</p>
      </section>

      {top3.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-brand-cyan mb-4">This week&apos;s top 3</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {top3.map((card) => (
              <CardBlock key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {hasCards && top3.length === 0 && (
        <section>
          <div className="grid gap-4 md:grid-cols-2">
            {displayCards.map((card) => (
              <CardBlock key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}

      {cards.length > 0 && (
        <section className="border-t border-white/10 pt-8">
          <h2 className="font-display text-lg font-semibold text-white mb-2">Card history</h2>
          <p className="text-white/60 text-sm mb-4">
            All your Decision Cards over time. When you mark a card as done and upload new logs, the next insights run reflects your current product — so fixes you ship can reduce or remove those issues in the next run.
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/70">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Problem</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => (
                    <tr key={card.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-3 text-white/60">
                        {card.created_at
                          ? new Date(card.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })
                          : "—"}
                      </td>
                      <td className="p-3">
                        <Link href={`/decision-cards/${card.id}`} className="text-white/90 hover:text-brand-cyan line-clamp-1">
                          {card.problem}
                        </Link>
                      </td>
                      <td className="p-3">
                        <span
                          className={
                            (card.status || "open") === "done"
                              ? "px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs"
                              : "px-2 py-1 rounded-lg bg-brand-amber/20 text-brand-amber text-xs"
                          }
                        >
                          {(card.status || "open") === "done" ? "Resolved" : "Open"}
                        </span>
                      </td>
                      <td className="p-3">
                        <Link href={`/decision-cards/${card.id}`} className="text-brand-cyan hover:underline text-xs">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {doneCards.length > 0 && (
            <p className="text-white/50 text-xs mt-3">
              {doneCards.length} resolved, {openCards.length} open. New uploads and &quot;Generate insights&quot; use your latest data, so resolved items may not reappear.
            </p>
          )}
        </section>
      )}

      {!hasCards && (
        <div className="card-3d glass rounded-2xl p-10 text-center">
          {!orgLoading && !canUpload && (
            <div className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-4 mb-6 text-left">
              <p className="text-amber-200 font-medium mb-1">Trial ended</p>
              <p className="text-white/80 text-sm mb-3">Subscribe ($20/month) to generate Decision Cards.</p>
              <Link href="/settings" className="btn-primary inline-block">Subscribe in Settings</Link>
            </div>
          )}
          <p className="text-white/80 mb-2">No Decision Cards yet.</p>
          <p className="text-white/60 text-sm mb-6">
            Upload your AI logs first, then we’ll surface the top issues and what to fix this week.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link href="/ingestion" className="btn-primary inline-block">
              Upload logs
            </Link>
            <p className="text-white/50 text-xs">Then generate insights and Decision Cards from the links below.</p>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-white/50">
              <a href="/ingestion" className="hover:text-white/80">Upload logs</a>
              <span>→</span>
              <a href="/insights/generate" className="hover:text-white/80">Generate insights</a>
              <span>→</span>
              <span className="text-brand-cyan">Decision Cards</span>
            </div>
            <button
              type="button"
              onClick={handleGenerateCards}
              disabled={generateLoading || !canUpload}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {generateLoading ? "Generating…" : "Generate Decision Cards (if you have insights)"}
            </button>
            {generateError && (
              <p className="text-red-300 text-sm">{generateError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CardBlock({ card }: { card: CardPlaceholder }) {
  const confidenceLabel =
    card.confidence_score >= 0.7 ? "High" : card.confidence_score >= 0.4 ? "Medium" : "Low";
  return (
    <Link href={`/decision-cards/${card.id}`} className="block card-3d glass rounded-2xl p-6 border border-white/10 hover:border-brand-violet/30 transition">
      <p className="font-display font-semibold text-white mb-2">{card.problem}</p>
      <p className="text-white/70 text-sm mb-4 line-clamp-2">{card.recommended_action}</p>
      <div className="flex flex-wrap gap-2">
        <span className="px-2 py-1 rounded-lg bg-brand-violet/30 text-brand-cyan text-xs">
          Impact {card.impact_level}/5
        </span>
        <span className="px-2 py-1 rounded-lg bg-white/10 text-white/80 text-xs">
          Effort {card.effort_estimate}/5
        </span>
        <span className="px-2 py-1 rounded-lg bg-brand-amber/20 text-brand-amber text-xs">
          {confidenceLabel}
        </span>
      </div>
      <p className="text-white/50 text-xs mt-3">View details →</p>
    </Link>
  );
}
