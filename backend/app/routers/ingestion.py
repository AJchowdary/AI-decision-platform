# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import logging
import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from supabase import create_client, Client

from app.auth import verify_supabase_jwt
from app.config import settings
from app.ingestion import parse_csv_rows, parse_json_rows
from app.rate_limit import check_rate_limit
from app.services.organization import get_organization_for_user, get_account_id_for_user, can_upload_or_generate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ingestion", tags=["ingestion"])
MAX_UPLOAD_BYTES = settings.max_upload_bytes
ALLOWED_CSV_TYPES = {"text/csv", "application/csv", "text/plain"}
ALLOWED_JSON_TYPES = {"application/json"}


def get_supabase() -> Client:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Server not configured for storage.")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def _upload_response(ok: bool, stored: int, errors: list[dict], warnings: list[str] | None = None):
    """Consistent JSON shape: stored, errors (list of {row, error})."""
    return {
        "ok": ok,
        "stored": stored,
        "errors": errors,
        "warnings": warnings or [],
    }


@router.post("/upload")
async def upload_logs(
    file: UploadFile = File(...),
    user: dict = Depends(verify_supabase_jwt),
):
    """Accept CSV or JSON file. Validate required fields; return human-readable errors or store and return counts."""
    request_id = str(uuid.uuid4())[:8]
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session.")
    supabase = get_supabase()
    org = get_organization_for_user(supabase, user_id)
    if org is not None and not can_upload_or_generate(org, user_id):
        raise HTTPException(
            status_code=403,
            detail="Trial ended. Subscribe to continue uploading logs ($20/month).",
        )
    account_id = get_account_id_for_user(supabase, user_id) or user_id

    if not check_rate_limit(account_id, "ingestion/upload"):
        logger.warning("ingestion upload rate limited account_id=%s request_id=%s", account_id, request_id)
        raise HTTPException(
            status_code=429,
            detail="Too many uploads. Please try again in a few minutes.",
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        logger.warning("ingestion upload rejected size account_id=%s request_id=%s len=%s", account_id, request_id, len(content))
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_UPLOAD_BYTES // (1024*1024)}MB.",
        )
    if not content:
        return _upload_response(ok=False, stored=0, errors=[{"row": 0, "error": "File is empty."}])

    content_type = (file.content_type or "").lower().split(";")[0].strip()
    filename = (file.filename or "").lower()
    if filename.endswith(".json"):
        if content_type and content_type not in ALLOWED_JSON_TYPES and content_type != "application/octet-stream":
            return _upload_response(ok=False, stored=0, errors=[{"row": 0, "error": "File must be JSON (content-type application/json)."}])
        valid_rows, errors = parse_json_rows(content, account_id)
    elif filename.endswith(".csv"):
        if content_type and content_type not in ALLOWED_CSV_TYPES and content_type not in ("application/octet-stream", ""):
            return _upload_response(ok=False, stored=0, errors=[{"row": 0, "error": "File must be CSV (content-type text/csv or application/csv)."}])
        valid_rows, errors = parse_csv_rows(content, account_id)
    else:
        return _upload_response(ok=False, stored=0, errors=[{"row": 0, "error": "File must be .csv or .json."}])

    if not valid_rows:
        logger.info("ingestion upload no_valid_rows account_id=%s request_id=%s errors_len=%s", account_id, request_id, len(errors))
        return _upload_response(ok=False, stored=0, errors=errors[:50], warnings=["No valid rows to store."] if errors else [])

    supabase = get_supabase()
    batch_size = 500
    stored = 0
    for i in range(0, len(valid_rows), batch_size):
        chunk = valid_rows[i : i + batch_size]
        resp = supabase.table("ai_logs").insert(chunk).execute()
        if getattr(resp, "data", None):
            stored += len(resp.data)
        else:
            stored += len(chunk)

    warnings = []
    if errors:
        warnings.append(f"{len(errors)} row(s) had validation errors and were skipped.")

    logger.info("ingestion upload account_id=%s request_id=%s stored=%s errors_len=%s", account_id, request_id, stored, len(errors))
    return _upload_response(ok=True, stored=stored, errors=errors[:30], warnings=warnings)
