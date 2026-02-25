# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

from datetime import datetime, timedelta, timezone
import re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client

from app.auth import verify_supabase_jwt
from app.config import settings
from app.services.organization import get_organization_for_user, can_upload_or_generate

router = APIRouter(prefix="/organizations", tags=["organizations"])


def get_supabase():
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Server not configured.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


class CreateOrganizationBody(BaseModel):
    name: str


def _slug_from_name(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "org"
    return base[:64]


@router.post("")
async def create_organization(
    body: CreateOrganizationBody,
    user: dict = Depends(verify_supabase_jwt),
):
    """Create an organization for the current user (e.g. after signup). 14-day trial, no card required."""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session.")
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Organization name is required.")
    supabase = get_supabase()
    existing = get_organization_for_user(supabase, user_id)
    if existing:
        return {"id": existing["id"], "name": existing["name"], "slug": existing.get("slug"), "message": "Already in an organization."}
    slug = _slug_from_name(name)
    trial_ends_at = (datetime.now(timezone.utc) + timedelta(days=14)).isoformat()
    org_row = {
        "name": name,
        "slug": slug,
        "trial_ends_at": trial_ends_at,
        "subscription_status": "trialing",
    }
    org_resp = supabase.table("organizations").insert(org_row).execute()
    if not org_resp.data or len(org_resp.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create organization.")
    org_id = org_resp.data[0]["id"]
    member_row = {
        "organization_id": org_id,
        "user_id": user_id,
        "role": "owner",
    }
    supabase.table("organization_members").insert(member_row).execute()
    return {
        "id": org_id,
        "name": name,
        "slug": slug,
        "trial_ends_at": trial_ends_at,
        "subscription_status": "trialing",
    }


@router.get("/me")
async def get_my_organization(user: dict = Depends(verify_supabase_jwt)):
    """Return the current user's organization and billing state (trial_ends_at, subscription_status)."""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session.")
    supabase = get_supabase()
    org = get_organization_for_user(supabase, user_id)
    if not org:
        return {"organization": None, "can_upload": True}
    can_upload = can_upload_or_generate(org, user_id)
    return {
        "organization": {
            "id": org["id"],
            "name": org["name"],
            "slug": org.get("slug"),
            "trial_ends_at": org.get("trial_ends_at"),
            "subscription_status": org.get("subscription_status"),
        },
        "can_upload": can_upload,
    }
