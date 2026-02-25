// You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type OrgState = {
  organization: { id: string; name: string; trial_ends_at: string | null; subscription_status: string } | null;
  can_upload: boolean;
} | null;

export function useOrganization(): { orgState: OrgState; loading: boolean } {
  const [orgState, setOrgState] = useState<OrgState>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${apiUrl}/organizations/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setOrgState({ organization: data.organization ?? null, can_upload: data.can_upload !== false });
        }
      } catch {
        if (!cancelled) setOrgState({ organization: null, can_upload: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiUrl]);

  return { orgState, loading };
}
