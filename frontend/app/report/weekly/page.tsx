// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import WeeklyReportClient from "@/components/reports/WeeklyReportClient";

export default async function WeeklyReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="card-3d glass rounded-2xl p-8">
          <WeeklyReportClient />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
