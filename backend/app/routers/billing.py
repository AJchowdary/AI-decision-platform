# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel
import stripe

from app.auth import verify_supabase_jwt
from app.config import settings
from app.services.organization import get_organization_for_user

router = APIRouter(prefix="/billing", tags=["billing"])


def get_stripe():
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Billing not configured.")
    return stripe  # use stripe.api_key in each call


def _default_success_url() -> str:
    if settings.frontend_base_url:
        base = settings.frontend_base_url.rstrip("/")
        return f"{base}/settings?subscription=success"
    return "http://localhost:3000/settings?subscription=success"


def _default_cancel_url() -> str:
    if settings.frontend_base_url:
        base = settings.frontend_base_url.rstrip("/")
        return f"{base}/settings?subscription=canceled"
    return "http://localhost:3000/settings?subscription=canceled"


class CreateCheckoutBody(BaseModel):
    success_url: str | None = None
    cancel_url: str | None = None


@router.post("/checkout")
async def create_checkout_session(
    body: CreateCheckoutBody | None = None,
    user: dict = Depends(verify_supabase_jwt),
):
    """Create a Stripe Checkout session for $20/month. Redirect user to Stripe to enter card."""
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session.")
    if not settings.stripe_secret_key or not settings.stripe_price_id:
        raise HTTPException(status_code=503, detail="Billing not configured (STRIPE_SECRET_KEY, STRIPE_PRICE_ID).")
    from app.routers.organizations import get_supabase
    supabase = get_supabase()
    org = get_organization_for_user(supabase, user_id)
    if not org:
        raise HTTPException(status_code=400, detail="Create an organization first (sign up with org name).")
    org_id = org["id"]
    customer_id = org.get("stripe_customer_id")
    stripe.api_key = settings.stripe_secret_key
    if not customer_id:
        cust = stripe.Customer.create(
            metadata={"organization_id": str(org_id)},
            email=user.get("email"),
        )
        customer_id = cust.id
        supabase.table("organizations").update({
            "stripe_customer_id": customer_id,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", org_id).execute()
    success = (body.success_url if body and body.success_url else _default_success_url())
    cancel = (body.cancel_url if body and body.cancel_url else _default_cancel_url())
    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
        success_url=success,
        cancel_url=cancel,
        metadata={"organization_id": str(org_id)},
    )
    return {"url": session.url, "session_id": session.id}


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(None, alias="Stripe-Signature"),
):
    """Stripe webhook: update organization subscription_status on subscription events."""
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Webhook not configured.")
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature or "", settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload.")
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature.")
    stripe.api_key = settings.stripe_secret_key
    from app.routers.organizations import get_supabase
    supabase = get_supabase()
    if event.type == "customer.subscription.updated" or event.type == "customer.subscription.deleted":
        sub = event.data.object
        meta = getattr(sub, "metadata", None) or {}
        org_id = meta.get("organization_id") if isinstance(meta, dict) else None
        if not org_id:
            cust_id = sub.get("customer")
            if cust_id:
                r = supabase.table("organizations").select("id").eq("stripe_customer_id", cust_id).limit(1).execute()
                if r.data and len(r.data) > 0:
                    org_id = r.data[0]["id"]
        if org_id:
            status = "none"
            sub_status = getattr(sub, "status", None) or (sub.get("status") if isinstance(sub, dict) else None)
            if event.type != "customer.subscription.deleted" and sub_status in ("active", "trialing"):
                status = sub_status or "active"
            supabase.table("organizations").update({
                "subscription_status": status,
                "stripe_subscription_id": getattr(sub, "id", sub.get("id")) if status != "none" else None,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", org_id).execute()
    return {"received": True}
