// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/decision-cards");

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-violet/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-cyan/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />

        <div className="relative z-10 text-center max-w-3xl">
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight gradient-text mb-4">
            Know what to fix this week
          </h1>
          <p className="text-lg text-white/80 mb-10">
            Upload your AI logs. Get Decision Cards and a weekly report — no dashboards, just clear next steps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn-primary inline-block text-center">
              Get started free
            </Link>
            <Link href="/login" className="btn-secondary inline-block text-center">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <section className="relative z-10 border-t border-white/10 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-white text-center mb-10">How it works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-violet/30 text-brand-cyan flex items-center justify-center font-display font-bold text-lg mx-auto mb-3">1</div>
              <h3 className="font-display font-semibold text-white mb-2">Upload logs</h3>
              <p className="text-white/60 text-sm">CSV or JSON with inputs, outputs, and feedback.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-violet/30 text-brand-cyan flex items-center justify-center font-display font-bold text-lg mx-auto mb-3">2</div>
              <h3 className="font-display font-semibold text-white mb-2">Generate insights</h3>
              <p className="text-white/60 text-sm">We find failure patterns and explain why.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-violet/30 text-brand-cyan flex items-center justify-center font-display font-bold text-lg mx-auto mb-3">3</div>
              <h3 className="font-display font-semibold text-white mb-2">Decision Cards</h3>
              <p className="text-white/60 text-sm">Prioritized recommendations with evidence.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-amber/20 text-brand-amber flex items-center justify-center font-display font-bold text-lg mx-auto mb-3">4</div>
              <h3 className="font-display font-semibold text-white mb-2">Weekly report</h3>
              <p className="text-white/60 text-sm">Top 3 issues, one focus fix, one thing to keep.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-white text-center mb-8">Decision Card preview</h2>
          <p className="text-white/60 text-sm text-center mb-6">Each card tells you what’s broken, why, and what to do — with evidence.</p>
          <div className="rounded-2xl border border-white/20 bg-white/5 p-6 text-left">
            <p className="font-display font-semibold text-white mb-2">Users get wrong answers when asking about refunds</p>
            <p className="text-white/70 text-sm mb-4">Clarify refund policy in the assistant’s answers and add a short FAQ link in the reply.</p>
            <details className="mb-3">
              <summary className="text-brand-cyan text-sm cursor-pointer hover:underline">Evidence (2 snippets)</summary>
              <ul className="mt-2 space-y-2 text-white/60 text-xs pl-4">
                <li>User: “Can I get a refund?” → Reply mentioned “contact support” but didn’t state the 30-day window.</li>
                <li>User: “Refund policy?” → Reply was vague; user left negative feedback.</li>
              </ul>
            </details>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-lg bg-brand-violet/30 text-brand-cyan text-xs">Impact 4/5</span>
              <span className="px-2 py-1 rounded-lg bg-white/10 text-white/80 text-xs">Effort 2/5</span>
              <span className="px-2 py-1 rounded-lg bg-brand-amber/20 text-brand-amber text-xs">High confidence</span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold text-white mb-6">What you get every week</h2>
          <ul className="space-y-3 text-white/80 text-left max-w-md mx-auto">
            <li className="flex gap-3"><span className="text-brand-cyan">•</span> Top 3 issues that matter most</li>
            <li className="flex gap-3"><span className="text-brand-cyan">•</span> One thing to fix first (prioritized)</li>
            <li className="flex gap-3"><span className="text-brand-cyan">•</span> One thing not to change (so you don’t overcorrect)</li>
          </ul>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-white text-center mb-6">Why not dashboards?</h2>
          <p className="text-white/60 text-sm text-center mb-6">We focus on decisions, not more charts.</p>
          <ul className="space-y-3 text-white/80 text-left max-w-md mx-auto">
            <li className="flex gap-3"><span className="text-brand-cyan">•</span> Dashboards show what happened; we tell you what to do next.</li>
            <li className="flex gap-3"><span className="text-brand-cyan">•</span> One clear recommendation beats a screen of metrics.</li>
            <li className="flex gap-3"><span className="text-brand-cyan">•</span> Built for weekly standups: one focus, evidence-backed.</li>
          </ul>
        </div>
      </section>

      <section className="relative z-10 border-t border-white/10 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold text-white mb-8">Built for product decisions</h2>
          <ul className="space-y-4 text-white/80 text-left max-w-xl mx-auto">
            <li className="flex gap-3"><span className="text-brand-cyan">✓</span> Evidence-backed cards, not generic dashboards</li>
            <li className="flex gap-3"><span className="text-brand-cyan">✓</span> Plain-language explanations, no infra jargon</li>
            <li className="flex gap-3"><span className="text-brand-cyan">✓</span> One thing to fix this week + Copy for Standup</li>
            <li className="flex gap-3"><span className="text-brand-cyan">✓</span> Works with thumbs, scores, or tags from your AI</li>
          </ul>
          <Link href="/signup" className="btn-primary inline-block mt-10">Create account</Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-white/50 text-sm">AI Product Decision Platform</span>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/privacy" className="text-white/50 hover:text-white/80">Privacy</Link>
            <Link href="/support" className="text-white/50 hover:text-white/80">Support</Link>
            <Link href="/login" className="text-white/50 hover:text-white/80">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
