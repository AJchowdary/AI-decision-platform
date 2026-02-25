import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import DecisionCardsClient from "@/components/decision-cards/DecisionCardsClient";

export default async function DecisionCardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
        <DecisionCardsClient />
      </main>
      <AppFooter />
    </div>
  );
}
