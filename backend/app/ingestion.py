# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

import csv
import io
import json
from datetime import datetime
from typing import Any

REQUIRED = {"session_id", "timestamp", "input", "output", "feedback_type", "feedback_value"}
OPTIONAL = {"user_id", "tags", "metadata"}


def _normalize_key(k: str) -> str:
    return k.strip().lower().replace(" ", "_").replace("-", "_")


def _parse_ts(v: Any) -> str | None:
    """Return ISO timestamptz string or None if invalid."""
    if v is None or (isinstance(v, str) and not v.strip()):
        return None
    s = str(v).strip()
    if not s:
        return None
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt.isoformat()
    except (ValueError, TypeError):
        pass
    try:
        dt = datetime.utcfromtimestamp(float(s))
        return dt.isoformat() + "Z"
    except (ValueError, TypeError, OSError):
        return None


def _parse_tags(v: Any) -> list[str]:
    if v is None:
        return []
    if isinstance(v, list):
        return [str(x).strip() for x in v if x is not None and str(x).strip()]
    s = str(v).strip()
    if not s:
        return []
    if s.startswith("["):
        try:
            return [str(x).strip() for x in json.loads(s) if str(x).strip()]
        except (json.JSONDecodeError, TypeError):
            pass
    return [x.strip() for x in s.split(",") if x.strip()]


def _row_to_log(account_id: str, raw: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    """Convert a raw row to ai_logs shape. Returns (row, list of human-readable errors)."""
    errors = []
    key_map = {_normalize_key(k): k for k in raw}
    normalized = {_normalize_key(k): v for k, v in raw.items()}

    def get(req: str, default: Any = None) -> Any:
        return normalized.get(_normalize_key(req), default)

    for field in REQUIRED:
        if get(field) is None or (isinstance(get(field), str) and not str(get(field)).strip()):
            errors.append(f"Missing or empty required field: '{field}'")

    if errors:
        return {}, errors

    ts = _parse_ts(get("timestamp"))
    if not ts:
        errors.append("Invalid timestamp: use ISO 8601 like 2026-02-22T12:00:00Z")
        return {}, errors

    out = {
        "account_id": account_id,
        "session_id": str(get("session_id")).strip(),
        "timestamp": ts,
        "user_id": str(get("user_id")).strip() or None,
        "input": str(get("input")).strip(),
        "output": str(get("output")).strip(),
        "feedback_type": str(get("feedback_type")).strip(),
        "feedback_value": str(get("feedback_value")).strip() if get("feedback_value") is not None else None,
        "tags": _parse_tags(get("tags")),
        "metadata": {},
    }
    if get("metadata"):
        try:
            if isinstance(get("metadata"), dict):
                out["metadata"] = get("metadata")
            else:
                out["metadata"] = json.loads(str(get("metadata")))
        except (json.JSONDecodeError, TypeError):
            pass
    return out, []


def parse_json_rows(body: bytes, account_id: str) -> tuple[list[dict], list[dict]]:
    """Parse JSON (array of objects or single object). Return (valid_rows, errors_with_index)."""
    try:
        data = json.loads(body.decode("utf-8", errors="replace"))
    except json.JSONDecodeError as e:
        return [], [{"row": 0, "error": f"Invalid JSON: {e.msg}"}]
    if isinstance(data, dict):
        data = [data]
    if not isinstance(data, list):
        return [], [{"row": 0, "error": "JSON must be an array of objects or a single object."}]
    valid = []
    errs = []
    for i, item in enumerate(data):
        if not isinstance(item, dict):
            errs.append({"row": i + 1, "error": "Each item must be an object."})
            continue
        row, row_errors = _row_to_log(account_id, item)
        if row_errors:
            for e in row_errors:
                errs.append({"row": i + 1, "error": e})
        else:
            valid.append(row)
    return valid, errs


def parse_csv_rows(body: bytes, account_id: str) -> tuple[list[dict], list[dict]]:
    """Parse CSV. First row = headers. Return (valid_rows, errors_with_row)."""
    try:
        text = body.decode("utf-8", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        rows = list(reader)
    except Exception as e:
        return [], [{"row": 0, "error": f"Invalid CSV: {e}"}]
    if not rows:
        return [], [{"row": 0, "error": "CSV has no data rows."}]
    valid = []
    errs = []
    for i, raw in enumerate(rows):
        row, row_errors = _row_to_log(account_id, raw)
        if row_errors:
            for e in row_errors:
                errs.append({"row": i + 2, "error": e})
        else:
            valid.append(row)
    return valid, errs
