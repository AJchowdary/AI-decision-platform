// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — AI Product Decision Platform",
  description: "Privacy policy for AI Product Decision Platform: how we collect, use, and protect your data.",
  robots: "index, follow",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-white/60 hover:text-white text-sm mb-8 inline-block">
          ← Back to home
        </Link>
        <h1 className="font-display text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-white/60 text-sm mb-10">Last updated: February 2025</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-white/80">
          <section>
            <h2 className="font-display text-xl font-semibold text-white mt-8 mb-3">1. Overview</h2>
            <p>
              AI Product Decision Platform (&quot;we&quot;, &quot;our&quot;, or &quot;the service&quot;) helps early-stage AI SaaS teams understand what is broken in their product and what to fix. This policy describes how we collect, use, and protect your information when you use our website and services.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mt-8 mb-3">2. Information we collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account data:</strong> Email address and profile information you provide when signing up (including via Google).</li>
              <li><strong>Product data you upload:</strong> Logs, inputs, outputs, and feedback (e.g. thumbs, scores) that you upload to generate insights and Decision Cards. This data is stored in our systems to provide the service.</li>
              <li><strong>Usage data:</strong> How you use the service (e.g. pages visited, actions taken) to improve the product.</li>
              <li><strong>Technical data:</strong> IP address, browser type, and device information for security and operations.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mt-8 mb-3">3. How we use your information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Provide the AI Product Decision Platform (ingestion, insights, Decision Cards, weekly reports).</li>
              <li>Authenticate you and manage your account.</li>
              <li>Improve our models and product (e.g. analyzing usage patterns).</li>
              <li>Send you service-related communications and, with your consent, product updates.</li>
              <li>Comply with law and protect our rights and security.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mt-8 mb-3">4. Data storage and security</h2>
            <p>
              Your data is stored using Supabase (auth and database) and our backend infrastructure. We use industry-standard measures to protect data in transit and at rest. We do not sell your personal information or uploaded product data to third parties.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mt-8 mb-3">5. Your rights</h2>
            <p>
              Depending on your location, you may have the right to access, correct, delete, or export your personal data, or to object to or restrict certain processing. To exercise these rights, contact us via the <Link href="/support" className="text-brand-cyan hover:underline">Support</Link> page.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mt-8 mb-3">6. Cookies and similar technologies</h2>
            <p>
              We use session and authentication cookies to keep you signed in. We may use analytics to understand how the site is used. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mt-8 mb-3">7. Changes</h2>
            <p>
              We may update this policy from time to time. We will post the revised policy on this page and update the &quot;Last updated&quot; date. Continued use of the service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-white mt-8 mb-3">8. Contact</h2>
            <p>
              For privacy-related questions or requests, use our <Link href="/support" className="text-brand-cyan hover:underline">Support</Link> page.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link href="/" className="text-white/60 hover:text-white text-sm">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
