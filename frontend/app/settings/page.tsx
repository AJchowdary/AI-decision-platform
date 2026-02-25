// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import Link from "next/link";
import BillingBlock from "@/components/settings/BillingBlock";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="card-3d glass rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold text-white mb-6">Settings</h1>
          <div className="space-y-6">
            <div>
              <label className="text-white/60 text-sm block mb-1">Email</label>
              <p className="text-white font-medium">{user.email ?? "—"}</p>
            </div>
            <div>
              <label className="text-white/60 text-sm block mb-1">Account</label>
              <p className="text-white/80 text-sm font-mono truncate">{user.id}</p>
            </div>
            <div>
              <BillingBlock />
            </div>
            <div className="pt-4 border-t border-white/10">
              <Link href="/decision-cards" className="text-brand-cyan hover:underline text-sm">← Back to Decision Cards</Link>
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
