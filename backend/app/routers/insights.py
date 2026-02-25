# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException

from app.auth import verify_supabase_jwt
from app.config import settings
from app.rate_limit import check_rate_limit
from app.services.insight_engine import run_insight_engine
from app.services.organization import get_organization_for_user, get_account_id_for_user, can_upload_or_generate
from supabase import create_client, Client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/insights", tags=["insights"])


def get_supabase() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Server not configured for storage.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.post("/generate")
async def generate_insights(user: dict = Depends(verify_supabase_jwt)):
    """Fetch negative-feedback logs, cluster, explain with LLM, store insights. Returns count and list."""
    request_id = str(uuid.uuid4())[:8]
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session.")
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="Insight generation not configured (OPENAI_API_KEY).")

    supabase = get_supabase()
    org = get_organization_for_user(supabase, user_id)
    if org is not None and not can_upload_or_generate(org, user_id):
        raise HTTPException(
            status_code=403,
            detail="Trial ended. Subscribe to generate insights ($20/month).",
        )
    account_id = get_account_id_for_user(supabase, user_id) or user_id

    if not check_rate_limit(account_id, "insights/generate"):
        logger.warning("insights generate rate limited account_id=%s request_id=%s", account_id, request_id)
        raise HTTPException(status_code=429, detail="Too many requests. Please try again in a few minutes.")

    r = supabase.table("ai_logs").select("*").eq("account_id", account_id).execute()
    logs = list(r.data or [])
    if not logs:
        return {"ok": True, "count": 0, "insights": [], "message": "No logs to analyze. Upload AI logs first."}

    try:
        raw_insights = run_insight_engine(logs, account_id, settings.openai_api_key)
    except Exception as e:
        logger.exception("insight_engine failed account_id=%s request_id=%s: %s", account_id, request_id, e)
        raise HTTPException(status_code=503, detail="Insight generation failed. Please try again later.")

    if not raw_insights:
        logger.info("insights generate no_patterns account_id=%s request_id=%s", account_id, request_id)
        return {"ok": True, "count": 0, "insights": [], "message": "No negative feedback patterns found in your logs."}

    rows = []
    for ins in raw_insights:
        rows.append({
            "account_id": ins["account_id"],
            "title": ins["title"],
            "description": ins["description"],
            "example_snippets": ins["example_snippets"],
            "frequency": ins["frequency"],
            "avg_feedback": ins.get("avg_feedback"),
            "root_cause": ins["root_cause"],
        })
    supabase.table("insights").insert(rows).execute()
    logger.info("insights generate account_id=%s request_id=%s count=%s", account_id, request_id, len(rows))
    return {"ok": True, "count": len(rows), "insights": raw_insights}


@router.get("/list")
async def list_insights(user: dict = Depends(verify_supabase_jwt)):
    """List insights for the account (for Decision Cards and UI)."""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session.")
    supabase = get_supabase()
    account_id = get_account_id_for_user(supabase, user_id) or user_id
    r = supabase.table("insights").select("*").eq("account_id", account_id).order("created_at", desc=True).execute()
    return {"items": list(r.data or [])}
