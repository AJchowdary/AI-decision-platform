// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support — AI Product Decision Platform",
  description: "Get help with AI Product Decision Platform: documentation, contact, and support.",
  robots: "index, follow",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-white/60 hover:text-white text-sm mb-8 inline-block">
          ← Back to home
        </Link>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Support</h1>
        <p className="text-white/70 mb-10">
          Get help with AI Product Decision Platform: what to fix this week, Decision Cards, and weekly reports.
        </p>

        <div className="space-y-8 text-white/80">
          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">Help &amp; documentation</h2>
            <ul className="space-y-2 list-disc pl-6">
              <li><strong>Upload logs:</strong> Use CSV or JSON with columns <code className="bg-white/10 px-1 rounded">session_id</code>, <code className="bg-white/10 px-1 rounded">timestamp</code>, <code className="bg-white/10 px-1 rounded">input</code>, <code className="bg-white/10 px-1 rounded">output</code>, <code className="bg-white/10 px-1 rounded">feedback_type</code>, <code className="bg-white/10 px-1 rounded">feedback_value</code>. Download a sample from the Upload page.</li>
              <li><strong>Generate insights:</strong> After uploading, go to Generate insights to cluster feedback and get &quot;why it&apos;s broken&quot; explanations.</li>
              <li><strong>Decision Cards:</strong> From insights we create prioritized cards with evidence and recommended actions.</li>
              <li><strong>Weekly report:</strong> Top 3 issues, one focus fix, and one thing not to change — plus &quot;Copy for Standup&quot;.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">Contact</h2>
            <p className="mb-4">
              For technical support, billing, or privacy requests, contact us at:
            </p>
            <p>
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com"}`}
                className="text-brand-cyan hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com"}
              </a>
            </p>
            {!process.env.NEXT_PUBLIC_SUPPORT_EMAIL && (
              <p className="text-white/60 text-sm mt-2">
                Set <code className="bg-white/10 px-1 rounded">NEXT_PUBLIC_SUPPORT_EMAIL</code> in <code className="bg-white/10 px-1 rounded">.env.local</code> to use your support email.
              </p>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mb-3">Related</h2>
            <ul className="flex flex-wrap gap-4">
              <li><Link href="/privacy" className="text-brand-cyan hover:underline">Privacy Policy</Link></li>
              <li><Link href="/" className="text-brand-cyan hover:underline">Home</Link></li>
              <li><Link href="/login" className="text-brand-cyan hover:underline">Sign in</Link></li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link href="/" className="text-white/60 hover:text-white text-sm">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
