// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useOrganization } from "@/lib/org";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function BillingBlock() {
  const { orgState, loading } = useOrganization();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  async function handleSubscribe() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${apiUrl}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          success_url: `${origin}/settings?subscription=success`,
          cancel_url: `${origin}/settings?subscription=canceled`,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setCheckoutError(res.ok ? "No checkout URL returned." : (data.detail || "Checkout failed."));
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading || !orgState) return null;
  const org = orgState.organization;
  if (!org) {
    return (
      <div className="rounded-xl bg-white/5 border border-white/10 p-4">
        <p className="text-white/80 text-sm mb-2">Create an organization to start your 14-day trial.</p>
        <Link href="/onboarding" className="text-brand-cyan hover:underline text-sm">Create organization →</Link>
      </div>
    );
  }

  const trialEnds = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const canUpload = orgState.can_upload;
  const isTrialing = org.subscription_status === "trialing" && trialEnds && trialEnds > new Date();
  const isActive = org.subscription_status === "active" || org.subscription_status === "trialing";

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
      <h3 className="font-display font-semibold text-white">Billing</h3>
      <p className="text-white/80 text-sm">
        <strong>{org.name}</strong>
        {isTrialing && trialEnds && (
          <> · Trial ends {trialEnds.toLocaleDateString()} (no card required)</>
        )}
        {isActive && !isTrialing && <> · Subscribed</>}
        {!canUpload && <> · Trial ended — subscribe to upload and generate</>}
      </p>
      {!canUpload && (
        <>
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={checkoutLoading}
            className="btn-primary disabled:opacity-50"
          >
            {checkoutLoading ? "Redirecting…" : "Subscribe — $20/month"}
          </button>
          {checkoutError && <p className="text-red-400 text-sm">{checkoutError}</p>}
        </>
      )}
      {canUpload && isTrialing && (
        <button type="button" onClick={handleSubscribe} className="btn-secondary text-sm">
          Add payment method (after trial)
        </button>
      )}
    </div>
  );
}
