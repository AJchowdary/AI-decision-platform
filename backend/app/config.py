# You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics. All outputs must directly support: what is broken, why, and what to fix first for an AI SaaS product.

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    database_url: str = ""
    openai_api_key: str = ""
    allowed_origins: str = ""
    frontend_base_url: str = ""  # e.g. https://your-app.vercel.app — used for Stripe success/cancel redirects
    max_upload_bytes: int = 5 * 1024 * 1024  # 5MB

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_id: str = ""


settings = Settings()
