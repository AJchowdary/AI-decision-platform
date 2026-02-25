// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import Link from "next/link";
import SignOutButton from "@/components/auth/SignOutButton";

export default function AppHeader() {
  return (
    <header className="glass border-b border-white/10 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
        <Link href="/decision-cards" className="font-display text-xl font-bold gradient-text">
          AI Product Decision
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/decision-cards" className="text-white/70 hover:text-white text-sm">Decision Cards</Link>
          <Link href="/report/weekly" className="text-white/70 hover:text-white text-sm">Weekly report</Link>
          <Link href="/ingestion" className="text-white/70 hover:text-white text-sm">Upload logs</Link>
          <Link href="/insights/generate" className="text-white/70 hover:text-white text-sm">Generate insights</Link>
          <Link href="/settings" className="text-white/70 hover:text-white text-sm">Settings</Link>
          <SignOutButton />
        </nav>
      </div>
    </header>
  );
}
