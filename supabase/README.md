# Supabase setup

Use Supabase for **Auth** (email + Google) and **Postgres**.

## Database

Run migrations so upload and insight generation work:

1. In Supabase dashboard go to **SQL Editor**.
2. Run in order:
   - `supabase/migrations/20260222000001_ai_logs.sql` (creates `public.ai_logs` and RLS)
   - `supabase/migrations/20260222000002_insights.sql` (creates `public.insights` and RLS)

Or with Supabase CLI: `supabase db push` (from repo root).

## Auth

1. Create project at [supabase.com](https://supabase.com).
2. **Authentication → Providers:** enable Email, enable Google (add Google OAuth client ID/secret from Google Cloud Console).
3. **Authentication → URL configuration:**
   - Site URL: your frontend URL (e.g. `https://your-app.vercel.app`)
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`

## Tables

- `ai_logs` – ingested AI interaction logs (Week 2)
- `insights` – failure-pattern summaries from clustering + LLM (Week 3)
- `decision_cards` – to be added in Week 4

## Env vars

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` → frontend
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` → backend (JWT verification + optional DB access)
