// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/decision-cards");

  const errorParam = searchParams?.error;
  const messageParam = searchParams?.message;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/10 via-transparent to-brand-cyan/10 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <div className="card-3d glass rounded-2xl p-8 shadow-2xl">
          <h1 className="font-display text-2xl font-bold gradient-text mb-2">Sign in</h1>
          <p className="text-white/70 text-sm mb-6">Use email or Google to continue.</p>
          {errorParam === "auth" && (
            <p className="text-amber-300 text-sm mb-4 rounded-lg bg-amber-400/10 border border-amber-400/30 px-3 py-2">
              {messageParam ? decodeURIComponent(messageParam) : "Sign-in failed or link expired. Try again or use email/password."}
            </p>
          )}
          <AuthForm mode="login" />
          <p className="mt-4 text-center text-white/60 text-sm">
            <Link href="/forgot-password" className="text-brand-cyan hover:underline">Forgot password?</Link>
          </p>
          <p className="mt-2 text-center text-white/60 text-sm">
            No account?{" "}
            <Link href="/signup" className="text-brand-cyan hover:underline">Create one</Link>
          </p>
        </div>
        <Link href="/" className="block text-center mt-4 text-white/50 hover:text-white/80 text-sm">← Back home</Link>
      </div>
    </div>
  );
}
