# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client, Client

from app.auth import verify_supabase_jwt
from app.config import settings
from app.services.reports import generate_weekly_report
from app.services.organization import get_account_id_for_user

router = APIRouter(prefix="/reports", tags=["reports"])


def get_supabase() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Server not configured for storage.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.get("/weekly")
async def weekly_report(user: dict = Depends(verify_supabase_jwt)):
    """
    Latest weekly report: top 3 issues, 1 thing to fix this week, 1 thing not to change.
    Uses Decision Cards from the last 14 days.
    """
    account_id = user.get("sub")
    if not account_id:
        raise HTTPException(status_code=401, detail="Invalid session.")

    supabase = get_supabase()
    account_id = get_account_id_for_user(supabase, account_id) or account_id
    since = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    resp = supabase.table("decision_cards").select("*").eq("account_id", account_id).gte("created_at", since).execute()
    cards = list(resp.data or [])

    if not cards:
        return {
            "ok": True,
            "report": None,
            "message": "No Decision Cards in the last 14 days. Generate Decision Cards first.",
        }

    report = generate_weekly_report(cards, settings.openai_api_key or "")
    return {"ok": True, "report": report}
