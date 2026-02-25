// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import Link from "next/link";
import DecisionCardDetailClient from "@/components/decision-cards/DecisionCardDetailClient";

export default async function DecisionCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { id } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <Link href="/decision-cards" className="text-white/60 hover:text-white text-sm mb-6 inline-block">← Back to Decision Cards</Link>
        <DecisionCardDetailClient cardId={id} />
      </main>
      <AppFooter />
    </div>
  );
}
