// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import Link from "next/link";
import GenerateInsightsClient from "@/components/insights/GenerateInsightsClient";

export default async function GenerateInsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="card-3d glass rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold text-white mb-2">Generate insights</h1>
          <p className="text-white/70 text-sm mb-6">
            Find failure patterns in your AI logs and get plain-language explanations — what’s broken and why.
          </p>
          <GenerateInsightsClient />
          <Link href="/decision-cards" className="btn-secondary mt-6 inline-block">Back to Decision Cards</Link>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
