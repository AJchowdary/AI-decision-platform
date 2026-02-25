# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client

from app.auth import verify_supabase_jwt
from app.config import settings
from app.rate_limit import check_rate_limit
from app.services.decision_cards import generate_decision_cards_for_account
from app.services.organization import get_organization_for_user, get_account_id_for_user, can_upload_or_generate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/decision_cards", tags=["decision_cards"])


def get_supabase() -> Client:
  if not settings.supabase_url or not settings.supabase_service_role_key:
    raise HTTPException(status_code=503, detail="Server not configured for storage.")
  return create_client(settings.supabase_url, settings.supabase_service_role_key)


@router.post("/generate")
async def generate_decision_cards(user: dict = Depends(verify_supabase_jwt)):
  """
  Generate Decision Cards from Insights for this account.
  Skips insights that already have cards.
  """
  request_id = str(uuid.uuid4())[:8]
  user_id = user.get("sub")
  if not user_id:
    raise HTTPException(status_code=401, detail="Invalid session.")
  if not settings.openai_api_key:
    raise HTTPException(status_code=503, detail="Decision Card generation not configured (OPENAI_API_KEY).")

  supabase = get_supabase()
  org = get_organization_for_user(supabase, user_id)
  if org is not None and not can_upload_or_generate(org, user_id):
    raise HTTPException(
      status_code=403,
      detail="Trial ended. Subscribe to generate Decision Cards ($20/month).",
    )
  account_id = get_account_id_for_user(supabase, user_id) or user_id

  if not check_rate_limit(account_id, "decision_cards/generate"):
    logger.warning("decision_cards generate rate limited account_id=%s request_id=%s", account_id, request_id)
    raise HTTPException(status_code=429, detail="Too many requests. Please try again in a few minutes.")

  ins_resp = supabase.table("insights").select("*").eq("account_id", account_id).execute()
  insights = list(ins_resp.data or [])
  if not insights:
    return {"ok": True, "count": 0, "cards": [], "message": "No insights found. Generate insights first."}

  # Map existing cards by insight_id to avoid duplicates
  cards_resp = supabase.table("decision_cards").select("id, insight_id").eq("account_id", account_id).execute()
  existing_by_insight: dict[str, list[dict]] = {}
  for row in cards_resp.data or []:
    existing_by_insight.setdefault(row["insight_id"], []).append(row)

  try:
    rows = generate_decision_cards_for_account(insights, existing_by_insight, account_id, settings.openai_api_key)
  except Exception as e:
    logger.exception("decision_cards generate failed account_id=%s request_id=%s: %s", account_id, request_id, e)
    raise HTTPException(status_code=503, detail="Decision Card generation failed. Please try again later.")

  if not rows:
    logger.info("decision_cards generate no_new account_id=%s request_id=%s", account_id, request_id)
    return {"ok": True, "count": 0, "cards": [], "message": "No new Decision Cards generated (existing cards may already cover current insights)."}

  insert_resp = supabase.table("decision_cards").insert(rows).execute()
  inserted = insert_resp.data or []
  logger.info("decision_cards generate account_id=%s request_id=%s count=%s", account_id, request_id, len(inserted))
  return {"ok": True, "count": len(inserted), "cards": inserted}


@router.get("/list")
async def list_decision_cards(user: dict = Depends(verify_supabase_jwt)):
  """
  List Decision Cards for this account, sorted by priority_score.
  """
  user_id = user.get("sub")
  if not user_id:
    raise HTTPException(status_code=401, detail="Invalid session.")
  supabase = get_supabase()
  account_id = get_account_id_for_user(supabase, user_id) or user_id
  resp = supabase.table("decision_cards").select("*").eq("account_id", account_id).order("created_at", desc=True).execute()
  rows = list(resp.data or [])

  def score(card: dict) -> float:
    impact = int(card.get("impact_level") or 3)
    effort = int(card.get("effort_estimate") or 3)
    conf = float(card.get("confidence_score") or 0.6)
    # Higher impact and confidence, lower effort => higher priority
    return impact * 2 + conf * 5 - effort

  rows.sort(key=score, reverse=True)
  top3 = rows[:3]
  simple_rows = [
    {
      "id": r.get("id"),
      "problem": r.get("problem"),
      "recommended_action": r.get("recommended_action"),
      "impact_level": r.get("impact_level"),
      "effort_estimate": r.get("effort_estimate"),
      "confidence_score": r.get("confidence_score"),
      "evidence_snippets": r.get("evidence_snippets") or [],
      "status": r.get("status") or "open",
      "created_at": r.get("created_at"),
    }
    for r in rows
  ]
  simple_top3 = [
    {
      "id": r.get("id"),
      "problem": r.get("problem"),
      "recommended_action": r.get("recommended_action"),
      "impact_level": r.get("impact_level"),
      "effort_estimate": r.get("effort_estimate"),
      "confidence_score": r.get("confidence_score"),
      "evidence_snippets": r.get("evidence_snippets") or [],
      "status": r.get("status") or "open",
      "created_at": r.get("created_at"),
    }
    for r in top3
  ]
  return {
    "cards": simple_rows,
    "top_3_this_week": simple_top3,
  }


class UpdateCardBody(BaseModel):
  status: str


@router.patch("/{card_id}")
async def update_decision_card(
  card_id: str,
  body: UpdateCardBody,
  user: dict = Depends(verify_supabase_jwt),
):
  """Update a Decision Card (e.g. set status to 'done'). Only status is updatable."""
  user_id = user.get("sub")
  if not user_id:
    raise HTTPException(status_code=401, detail="Invalid session.")
  status = body.status
  if status not in ("open", "done"):
    raise HTTPException(status_code=400, detail="status must be 'open' or 'done'.")
  supabase = get_supabase()
  account_id = get_account_id_for_user(supabase, user_id) or user_id
  resp = supabase.table("decision_cards").update({"status": status}).eq("id", card_id).eq("account_id", account_id).execute()
  if not resp.data:
    raise HTTPException(status_code=404, detail="Card not found.")
  return {"ok": True, "status": status}


@router.get("/{card_id}")
async def get_decision_card(card_id: str, user: dict = Depends(verify_supabase_jwt)):
  """Get a single Decision Card by ID (for detail page)."""
  user_id = user.get("sub")
  if not user_id:
    raise HTTPException(status_code=401, detail="Invalid session.")
  supabase = get_supabase()
  account_id = get_account_id_for_user(supabase, user_id) or user_id
  resp = supabase.table("decision_cards").select("*").eq("id", card_id).eq("account_id", account_id).limit(1).execute()
  rows = list(resp.data or [])
  if not rows:
    raise HTTPException(status_code=404, detail="Card not found.")
  return rows[0]

