// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/decision-cards");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-violet/10 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <div className="card-3d glass rounded-2xl p-8 shadow-2xl">
          <h1 className="font-display text-2xl font-bold gradient-text mb-2">Create account</h1>
          <p className="text-white/70 text-sm mb-6">For your team. 14-day free trial — no card required. Then $20/month.</p>
          <AuthForm mode="signup" />
          <p className="mt-6 text-center text-white/60 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-cyan hover:underline">Sign in</Link>
          </p>
        </div>
        <Link href="/" className="block text-center mt-4 text-white/50 hover:text-white/80 text-sm">← Back home</Link>
      </div>
    </div>
  );
}
