# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import httpx

security = HTTPBearer(auto_error=False)


async def verify_supabase_jwt(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """Verify Supabase JWT and return payload. Used as FastAPI dependency."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )
    token = credentials.credentials
    from app.config import settings
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth not configured",
        )
    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/user"
    async with httpx.AsyncClient() as client:
        r = await client.get(
            url,
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": settings.supabase_anon_key,
            },
        )
    if r.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    data = r.json()
    return {"sub": data.get("id"), "email": data.get("email"), "raw": data}
