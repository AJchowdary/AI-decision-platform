// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import Link from "next/link";

export default function AppFooter() {
  return (
    <footer className="border-t border-white/10 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-white/50 text-sm">AI Product Decision Platform — what to fix this week.</span>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <Link href="/decision-cards" className="text-white/50 hover:text-white/80">Decision Cards</Link>
          <Link href="/report/weekly" className="text-white/50 hover:text-white/80">Weekly report</Link>
          <Link href="/ingestion" className="text-white/50 hover:text-white/80">Upload</Link>
          <Link href="/insights/generate" className="text-white/50 hover:text-white/80">Generate insights</Link>
          <Link href="/settings" className="text-white/50 hover:text-white/80">Settings</Link>
          <Link href="/privacy" className="text-white/50 hover:text-white/80">Privacy</Link>
          <Link href="/support" className="text-white/50 hover:text-white/80">Support</Link>
        </div>
      </div>
    </footer>
  );
}
