// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Issue = {
  id: string;
  problem: string;
  recommended_action: string;
  impact_level: number;
  effort_estimate: number;
};

type Report = {
  top_3_issues: Issue[];
  focus_fix: { id: string; problem: string; recommended_action: string } | null;
  thing_not_to_change: string;
  summary_markdown: string;
  standup_copy: string;
};

export default function WeeklyReportClient() {
  const [report, setReport] = useState<Report | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function fetchReport() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${apiUrl}/reports/weekly`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (data.report) setReport(data.report);
        if (data.message) setMessage(data.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [apiUrl]);

  function handleCopyStandup() {
    if (!report?.standup_copy) return;
    navigator.clipboard.writeText(report.standup_copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (message && !report) {
    return (
      <div className="card-3d glass rounded-2xl p-8">
        <h1 className="font-display text-2xl font-bold text-white mb-2">Weekly AI Product Report</h1>
        <p className="text-white/70">{message}</p>
        <p className="text-white/50 text-sm mt-4">Generate Decision Cards first, then return here.</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-2xl font-bold text-white">Weekly AI Product Report</h1>
        <button
          type="button"
          onClick={handleCopyStandup}
          className="btn-primary"
        >
          {copied ? "Copied!" : "Copy for Standup"}
        </button>
      </div>

      {report.top_3_issues?.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold text-brand-cyan mb-4">Top 3 issues</h2>
          <ul className="space-y-4">
            {report.top_3_issues.map((issue, i) => (
              <li key={issue.id} className="card-3d glass rounded-xl p-4 border border-white/10">
                <p className="font-display font-semibold text-white">{i + 1}. {issue.problem}</p>
                <p className="text-white/70 text-sm mt-1">→ {issue.recommended_action}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded bg-brand-violet/20 text-brand-cyan text-xs">Impact {issue.impact_level}/5</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-xs">Effort {issue.effort_estimate}/5</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.focus_fix && (
        <section>
          <h2 className="font-display text-lg font-semibold text-brand-amber mb-4">1 thing to fix this week</h2>
          <div className="card-3d glass rounded-xl p-6 border border-brand-amber/30">
            <p className="font-display font-semibold text-white mb-2">{report.focus_fix.problem}</p>
            <p className="text-white/80">{report.focus_fix.recommended_action}</p>
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-lg font-semibold text-brand-cyan mb-4">1 thing not to change</h2>
        <div className="card-3d glass rounded-xl p-6 border border-white/10">
          <p className="text-white/90">{report.thing_not_to_change}</p>
        </div>
      </section>
    </div>
  );
}
