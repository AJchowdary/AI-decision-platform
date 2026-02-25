# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.auth import verify_supabase_jwt
from app.config import settings
from app.routers import ingestion as ingestion_router, insights as insights_router, decision_cards as decision_cards_router, reports as reports_router, organizations as organizations_router, billing as billing_router

logger = logging.getLogger(__name__)

_default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

def _cors_origins() -> list[str]:
    origins = list(_default_origins)
    if settings.allowed_origins:
        origins.extend(o.strip() for o in settings.allowed_origins.split(",") if o.strip())
    return origins


def _validate_env() -> None:
    """Warn at startup if required env vars are missing. Does not print secret values."""
    missing = []
    if not (settings.supabase_url or "").strip():
        missing.append("SUPABASE_URL")
    if not (settings.supabase_anon_key or "").strip():
        missing.append("SUPABASE_ANON_KEY")
    if not (settings.supabase_service_role_key or "").strip():
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if missing:
        logger.warning("Missing required env vars (server may fail): %s", ", ".join(missing))
    if not (settings.openai_api_key or "").strip():
        logger.warning("OPENAI_API_KEY not set; insight and Decision Card generation will be disabled.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _validate_env()
    yield


app = FastAPI(
    title="AI Product Decision Platform API",
    description="Backend for Decision Cards and weekly PM reports. No dashboards.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
def global_exception_handler(request, exc: Exception):
    """Return clean HTTP 500 without leaking stack traces. Let HTTPException pass through."""
    if isinstance(exc, HTTPException):
        raise exc
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(ingestion_router.router)
app.include_router(insights_router.router)
app.include_router(decision_cards_router.router)
app.include_router(reports_router.router)
app.include_router(organizations_router.router)
app.include_router(billing_router.router)


@app.get("/ingestion/status")
def ingestion_status(_: dict = Depends(verify_supabase_jwt)):
    """Ingestion status (no dashboard metrics)."""
    return {"message": "Ingestion ready. Upload logs to get started."}


@app.get("/ingestion/schema")
def ingestion_schema(_: dict = Depends(verify_supabase_jwt)):
    """Required and optional fields for CSV/JSON upload; sample row."""
    return {
        "required": ["session_id", "timestamp", "input", "output", "feedback_type", "feedback_value"],
        "optional": ["user_id", "tags", "metadata"],
        "sample_row": {
            "session_id": "sess_abc123",
            "timestamp": "2024-01-15T10:30:00Z",
            "input": "What is the return policy?",
            "output": "Our return policy allows...",
            "feedback_type": "thumb_down",
            "feedback_value": "-1",
            "user_id": "user_1",
            "tags": ["returns", "support"],
            "metadata": {},
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)

