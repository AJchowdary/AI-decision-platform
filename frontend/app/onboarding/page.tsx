// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. Onboarding questionnaire: organization vs individual, follow-up questions, then 14-day trial started notification.

"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type AccountType = "organization" | "individual" | null;

type SurveyResponses = {
  account_type?: string;
  org_name?: string;
  team_size?: string;
  role?: string;
  use_case?: string;
  how_heard?: string;
  main_goal?: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgNameFromSignup = useMemo(() => searchParams.get("org_name")?.trim() || undefined, [searchParams]);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [survey, setSurvey] = useState<SurveyResponses>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialStarted, setTrialStarted] = useState(false);
  const [checkingOrg, setCheckingOrg] = useState(true);

  useEffect(() => {
    if (orgNameFromSignup) setSurvey((s) => ({ ...s, org_name: orgNameFromSignup }));
  }, [orgNameFromSignup]);

  useEffect(() => {
    async function checkOrg() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`${apiUrl}/organizations/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        // If they already have an org, they're an existing user — never show the questionnaire.
        if (data?.organization) {
          router.push("/decision-cards");
          return;
        }
        const isExistingUser = !!session.user?.user_metadata?.onboarding_completed_at;
        if (isExistingUser) {
          // Existing user: go straight to dashboard (org created there if missing).
          router.push("/decision-cards");
          return;
        }
        // New user (no org, no onboarding_completed_at): show questionnaire.
      } finally {
        setCheckingOrg(false);
      }
    }
    checkOrg();
  }, [apiUrl, router]);

  function updateSurvey(key: keyof SurveyResponses, value: string) {
    setSurvey((s) => ({ ...s, [key]: value }));
    setError(null);
  }

  function handleAccountTypeChoose(type: AccountType) {
    setAccountType(type);
    setSurvey((s) => ({ ...s, account_type: type || undefined }));
    setStep(2);
  }

  const canProceedStep2 =
    (accountType === "organization" && survey.org_name?.trim()) ||
    (accountType === "individual");

  const canProceedStep3 =
    survey.role && survey.use_case && (accountType === "individual" ? survey.how_heard : true);

  async function handleSkip() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.push("/login");
      setLoading(false);
      return;
    }
    const name = orgNameFromSignup || (survey.org_name || "").trim() || "My workspace";
    try {
      const res = await fetch(`${apiUrl}/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong.");
      await supabase.auth.updateUser({
        data: { onboarding_completed_at: new Date().toISOString() },
      });
      setTrialStarted(true);
      setTimeout(() => {
        window.location.href = "/decision-cards";
      }, 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      router.push("/login");
      setLoading(false);
      return;
    }
    const name =
      accountType === "organization"
        ? (survey.org_name || "").trim() || orgNameFromSignup || "My team"
        : orgNameFromSignup || "My workspace";
    const payload = {
      name,
      account_type: accountType || undefined,
      survey_responses: {
        ...survey,
        main_goal: survey.main_goal || undefined,
      },
    };
    try {
      const res = await fetch(`${apiUrl}/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong.");
      await supabase.auth.updateUser({
        data: { onboarding_completed_at: new Date().toISOString() },
      });
      setTrialStarted(true);
      setTimeout(() => {
        window.location.href = "/decision-cards";
      }, 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (trialStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-violet/10 pointer-events-none" />
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="card-3d glass rounded-2xl p-10 border border-brand-cyan/30">
            <div className="w-16 h-16 rounded-full bg-brand-cyan/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">You&apos;re all set</h1>
            <p className="text-brand-cyan font-medium mb-1">Your 14-day free trial has started</p>
            <p className="text-white/60 text-sm mb-6">No card required. We&apos;ll redirect you to your dashboard in a moment.</p>
            <p className="text-white/40 text-xs">Taking you to Decision Cards…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-violet/10 pointer-events-none" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="card-3d glass rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-xl font-bold text-white">
              {step === 1 && "How are you using this?"}
              {step === 2 && "A few more details"}
              {step === 3 && "Almost there"}
            </h1>
            <span className="text-white/50 text-sm">Step {step} of 3</span>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-white/70 text-sm mb-2">For our analytics only — it doesn&apos;t change how the product works. You can optionally use an organization name for your account later.</p>
              <button
                type="button"
                onClick={() => handleAccountTypeChoose("organization")}
                className="w-full p-5 rounded-xl border-2 border-white/20 hover:border-brand-violet/50 bg-white/5 hover:bg-white/10 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-violet/50"
              >
                <span className="font-display font-semibold text-white block">Organization</span>
                <span className="text-white/60 text-sm">I&apos;m signing up for my team or company</span>
              </button>
              <button
                type="button"
                onClick={() => handleAccountTypeChoose("individual")}
                className="w-full p-5 rounded-xl border-2 border-white/20 hover:border-brand-violet/50 bg-white/5 hover:bg-white/10 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-violet/50"
              >
                <span className="font-display font-semibold text-white block">Individual</span>
                <span className="text-white/60 text-sm">I&apos;m signing up for myself</span>
              </button>
              <p className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="text-white/50 hover:text-white/80 text-sm underline disabled:opacity-50"
                >
                  Skip questions and go to dashboard
                </button>
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {accountType === "organization" && (
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Organization or team name (optional — for your reference and our analytics)</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme AI"
                    value={survey.org_name || ""}
                    onChange={(e) => updateSurvey("org_name", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-violet/50"
                  />
                </div>
              )}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Your role</label>
                <select
                  value={survey.role || ""}
                  onChange={(e) => updateSurvey("role", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-violet/50"
                >
                  <option value="">Select role</option>
                  <option value="founder">Founder</option>
                  <option value="pm">Product Manager</option>
                  <option value="engineer">Engineer</option>
                  <option value="designer">Designer</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {accountType === "organization" && (
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Team size</label>
                  <select
                    value={survey.team_size || ""}
                    onChange={(e) => updateSurvey("team_size", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-violet/50"
                  >
                    <option value="">Select size</option>
                    <option value="1-5">1–5 people</option>
                    <option value="6-15">6–15 people</option>
                    <option value="16-50">16–50 people</option>
                    <option value="50+">50+ people</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Primary use case</label>
                <select
                  value={survey.use_case || ""}
                  onChange={(e) => updateSurvey("use_case", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-violet/50"
                >
                  <option value="">Select use case</option>
                  <option value="improve_quality">Improve AI product quality</option>
                  <option value="prioritize_fixes">Prioritize what to fix</option>
                  <option value="weekly_reporting">Weekly reporting for standups</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {accountType === "individual" && (
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">How did you hear about us?</label>
                  <select
                    value={survey.how_heard || ""}
                    onChange={(e) => updateSurvey("how_heard", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-violet/50"
                  >
                    <option value="">Select</option>
                    <option value="search">Search</option>
                    <option value="social">Social media</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <p className="text-center pt-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="text-white/50 hover:text-white/80 text-sm underline disabled:opacity-50"
                >
                  Skip questions and go to dashboard
                </button>
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">What do you want to improve most?</label>
                <select
                  value={survey.main_goal || ""}
                  onChange={(e) => updateSurvey("main_goal", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-violet/50"
                >
                  <option value="">Select (optional)</option>
                  <option value="accuracy">AI accuracy</option>
                  <option value="feedback_loop">User feedback loop</option>
                  <option value="prioritization">Prioritization</option>
                  <option value="reporting">Reporting for stakeholders</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <p className="text-white/50 text-xs">
                Your 14-day free trial starts when you finish. No card required.
              </p>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1">
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={loading || !canProceedStep3}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? "Creating…" : "Start my trial"}
                </button>
              </div>
              <p className="text-center pt-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="text-white/50 hover:text-white/80 text-sm underline disabled:opacity-50"
                >
                  Skip questions and go to dashboard
                </button>
              </p>
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
          )}
        </div>
        <p className="text-center mt-4 text-white/50 text-sm">
          <Link href="/decision-cards" className="hover:text-white/80">Already have an account? Go to app</Link>
        </p>
      </div>
    </div>
  );
}
