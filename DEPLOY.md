# Deployment: AI Product Decision Platform

Deploy **frontend** to Vercel and **backend** to Render. Auth and DB stay on Supabase.

---

## 0. Pre-deploy checklist (do this before first push / deploy)

**Secrets and local artifacts must never be in the repo.** Even if `.gitignore` lists them, they can still be tracked if they were ever committed.

1. **Remove from Git tracking** (run from repo root; does not delete local files):
   ```bash
   git rm -r --cached backend/.venv frontend/node_modules 2>/dev/null || true
   git rm --cached backend/.env 2>/dev/null || true
   ```
   On Windows (PowerShell):
   ```powershell
   git rm -r --cached backend/.venv 2>$null; git rm -r --cached frontend/node_modules 2>$null; git rm --cached backend/.env 2>$null
   ```

2. **Ensure only example env files exist in repo:**  
   Commit `backend/.env.example` and `frontend/.env.local.example` only. Never commit `backend/.env` or `frontend/.env.local`.

3. **If `backend/.env` was ever committed:**  
   Treat those keys as compromised. Rotate: Supabase (service_role + anon), OpenAI API key, Stripe keys. Then run the `git rm --cached` above and commit.

4. **Do not ship `node_modules` or `backend/.venv`:**  
   Vercel and Render install dependencies from lockfiles. Shipping them breaks builds (e.g. Windows zip on Linux → `next: Permission denied`). After untracking, do a clean install when testing:
   ```bash
   rm -rf frontend/node_modules && cd frontend && npm install && npm run build
   ```

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "Remove local artifacts and secrets from tracking"
   git push
   ```

---

## 1. Supabase (do first)

1. Create a project at [supabase.com](https://supabase.com).
2. **Authentication → Providers:** enable Email and Google (add Google OAuth client in Google Cloud Console).
3. **Authentication → URL configuration:**
   - **Site URL:** your production frontend URL (e.g. `https://your-app.vercel.app`). Use `http://localhost:3000` for local only.
   - **Redirect URLs:** add:
     - `http://localhost:3000/auth/callback`
     - `https://your-app.vercel.app/auth/callback` (replace with your real Vercel URL after deploy)
4. **SQL Editor:** run the migrations in order (copy/paste from repo):
   - `supabase/migrations/20260222000001_ai_logs.sql`
   - `supabase/migrations/20260222000002_insights.sql`
   - `supabase/migrations/20260222000003_decision_cards.sql`
   - `supabase/migrations/20260222000004_organizations.sql`
   - `supabase/migrations/20260222000005_org_rls.sql`
5. **Project Settings → API:** copy **Project URL**, **anon public** key, and **service_role** key (keep service_role secret).

---

## 2. Backend (Render)

1. Go to [render.com](https://render.com) → **Dashboard** → **New** → **Web Service**.
2. Connect your Git repo (or use **Blueprint** and point to the repo; Render will use `render.yaml` at root).
3. If creating manually:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Environment** (add all):
   - `SUPABASE_URL` = Supabase Project URL
   - `SUPABASE_ANON_KEY` = anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key
   - `OPENAI_API_KEY` = your OpenAI API key (for insights + decision cards)
   - `ALLOWED_ORIGINS` = **required in production.** Comma-separated list of frontend origins for CORS, e.g.:
     - `https://your-app.vercel.app`
     - With custom domain: `https://your-app.vercel.app,https://your-custom-domain.com`
     - Do not rely only on localhost; add your real Vercel (and custom) URLs.
   - `FRONTEND_BASE_URL` = your frontend URL for Stripe redirects, e.g. `https://your-app.vercel.app` (no trailing slash). Used as base for success/cancel URLs in billing checkout.
   - **Billing (optional):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` (create a $20/month price in Stripe; webhook URL: `https://your-backend.onrender.com/billing/webhook`, events: `customer.subscription.updated`, `customer.subscription.deleted`)
5. Deploy. Note the backend URL (e.g. `https://ai-product-decision-api.onrender.com`).

---

## 3. Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import your repo.
2. **Root Directory:** set to `frontend` (or leave default if repo is frontend-only and you deploy frontend separately).
3. **Environment Variables** (add for Production and Preview if you want):
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key
   - `NEXT_PUBLIC_API_URL` = your **Render backend URL** (e.g. `https://ai-product-decision-api.onrender.com`)
   - **Optional (SEO & support):** `NEXT_PUBLIC_SITE_URL` = your Vercel URL (for sitemap, Open Graph); `NEXT_PUBLIC_SUPPORT_EMAIL` = support contact; `NEXT_PUBLIC_BING_SITE_VERIFICATION` = Bing Webmaster Tools verification code.
4. Deploy. Note the frontend URL (e.g. `https://your-app.vercel.app`).

---

## 4. Wire production URLs

1. **Supabase (required for sign-in in production):** In **Authentication → URL configuration**:
   - **Site URL:** set to your **production** frontend URL (e.g. `https://your-app.vercel.app`). If this is still `http://localhost:3000`, after Google sign-in Supabase redirects to localhost and you get “localhost refused to connect”.
   - **Redirect URLs:** add `https://your-app.vercel.app/auth/callback` (you can keep `http://localhost:3000/auth/callback` for local dev). Save and try sign-in again on the deployed site.
2. **Render:** Set `ALLOWED_ORIGINS` to your production frontend URL(s) so the browser can call the API (CORS). Example: `https://your-app.vercel.app,https://www.yourdomain.com`
3. **Billing:** Set `FRONTEND_BASE_URL` on Render to your frontend URL (e.g. `https://your-app.vercel.app`) so Stripe checkout redirects to the correct success/cancel pages.

---

## 5. Production notes (optional but recommended)

- **Rate limiting:** The backend uses in-memory rate limiting. On Render with multiple instances or restarts, limits are per-instance and can be inconsistent. For production at scale, consider Redis (e.g. Upstash free tier) or Supabase table-based throttling; see `backend/app/rate_limit.py`.
- **CORS:** Always set `ALLOWED_ORIGINS` in Render to your real frontend domain(s). Do not rely only on default localhost.

---

## 5. Local development

- **Frontend:** `cd frontend` → copy `.env.local.example` to `.env.local` → set the three vars (use `http://localhost:8000` for `NEXT_PUBLIC_API_URL`). Run `npm run dev`.
- **Backend:** `cd backend` → copy `.env.example` to `.env` → set Supabase + `OPENAI_API_KEY`. Optional: `ALLOWED_ORIGINS` for a non-local frontend. Run `python -m uvicorn app.main:app --reload --port 8000`.

---

## Env reference

| Var | Where | Required |
|-----|--------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Yes |
| `NEXT_PUBLIC_API_URL` | Frontend | Yes (backend URL) |
| `NEXT_PUBLIC_SITE_URL` | Frontend | Optional (sitemap, OG, canonical) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Frontend | Optional (Support page) |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Frontend | Optional (Bing Webmasters) |
| `SUPABASE_URL` | Backend | Yes |
| `SUPABASE_ANON_KEY` | Backend | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Yes |
| `OPENAI_API_KEY` | Backend | Yes (for insights + cards) |
| `ALLOWED_ORIGINS` | Backend | **Yes in production** (comma-separated frontend URLs for CORS) |
| `FRONTEND_BASE_URL` | Backend | Recommended in production (Stripe success/cancel redirect base, e.g. `https://your-app.vercel.app`) |
| `STRIPE_SECRET_KEY` | Backend | Optional (billing) |
| `STRIPE_WEBHOOK_SECRET` | Backend | Optional (Stripe webhook) |
| `STRIPE_PRICE_ID` | Backend | Optional ($20/mo price ID) |
