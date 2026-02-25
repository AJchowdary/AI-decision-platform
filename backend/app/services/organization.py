# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from supabase import Client


def get_organization_for_user(supabase: Client, user_id: str) -> dict[str, Any] | None:
    """Return the organization the user belongs to, or None. Uses first membership."""
    r = (
        supabase.table("organization_members")
        .select("organization_id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not r.data or len(r.data) == 0:
        return None
    org_id = r.data[0]["organization_id"]
    r2 = supabase.table("organizations").select("*").eq("id", org_id).limit(1).execute()
    if not r2.data or len(r2.data) == 0:
        return None
    return r2.data[0]


def get_account_id_for_user(supabase: Client, user_id: str) -> str | None:
    """
    Return account_id to use for data (ai_logs, insights, decision_cards).
    Prefer organization_id if user has an org; else legacy: user_id.
    """
    org = get_organization_for_user(supabase, user_id)
    if org:
        return org["id"]
    return user_id


def can_upload_or_generate(org_or_legacy: dict[str, Any] | None, user_id: str) -> bool:
    """
    True if user can upload logs and run generate (insights / decision cards).
    - If they have an org: must be in trial (trial_ends_at > now) or have active/trialing subscription.
    - If no org (legacy): allow (backward compat).
    """
    if org_or_legacy is None:
        return True  # legacy: no org, use user_id as account_id; allow
    trial_ends = org_or_legacy.get("trial_ends_at")
    status = (org_or_legacy.get("subscription_status") or "").strip().lower()
    now = datetime.now(timezone.utc)
    if trial_ends:
        try:
            if hasattr(trial_ends, "tzinfo"):
                end = trial_ends
            else:
                end = datetime.fromisoformat(str(trial_ends).replace("Z", "+00:00"))
            if end.tzinfo is None:
                end = end.replace(tzinfo=timezone.utc)
            if now < end:
                return True  # still in trial
        except Exception:
            pass
    if status in ("active", "trialing"):
        return True
    return False
