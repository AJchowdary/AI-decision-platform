# AI Product Decision Platform

**What's broken, why, and what to fix this week** — for early-stage AI SaaS teams. Decision Cards + Weekly PM Report. No dashboards.

## Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind → **Vercel**
- **Backend:** FastAPI → **Render**
- **Auth & DB:** **Supabase** (email + password + Google, Postgres)

## Repo structure

```
/frontend   → Next.js app (deploy to Vercel)
/backend    → FastAPI app (deploy to Render)
```

## Quick start (local)

1. **Supabase:** Create project, enable Email + Google auth, run the three SQL migrations under `supabase/migrations/`. See [DEPLOY.md](DEPLOY.md) for details.
2. **Frontend:** `cd frontend` → copy `.env.local.example` to `.env.local` → set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000`) → `npm install` → `npm run dev`.
3. **Backend:** `cd backend` → copy `.env.example` to `.env` → set Supabase keys and `OPENAI_API_KEY` → `pip install -r requirements.txt` → `python -m uvicorn app.main:app --reload --port 8000`.

## Smoke test (local)

Use this checklist to confirm the app works end-to-end before deploy or after changes:

1. **Backend**
   - From repo root: `cd backend` → `pip install -r requirements.txt` → `python -m uvicorn app.main:app --reload --port 8000`.
   - Open [http://localhost:8000/docs](http://localhost:8000/docs) and confirm Swagger UI loads.

2. **Frontend**
   - In another terminal: `cd frontend` → `npm install` → `npm run dev`.
   - Open [http://localhost:3000](http://localhost:3000); you should see the landing page.

3. **Auth**
   - Click **Sign in** → sign in with email or Google.
   - After login you should be redirected to **Decision Cards** (`/decision-cards`).
   - If already logged in and you visit `/login`, you should be redirected to `/decision-cards`.

4. **Ingestion**
   - Go to **Upload logs** (or `/ingestion`).
   - Click **Show required fields & sample row**, then **Download sample JSON**.
   - Upload the downloaded file; you should see **Stored 2 rows** (or similar) and a CTA to Decision Cards.

5. **Insights and Decision Cards**
   - From ingestion success, go to **Generate insights** (e.g. `/insights/generate`) and run **Generate insights** if the button exists.
   - Then open **Decision Cards** and run **Generate Decision Cards**.
   - Confirm at least one Decision Card appears and the **Weekly report** page loads.

6. **Build**
   - Frontend: `cd frontend` → `npm run build` (no errors).
   - Backend: `cd backend` → `python -m uvicorn app.main:app` (starts without import/runtime errors).

## Deploy

See **[DEPLOY.md](DEPLOY.md)** for step-by-step Vercel + Render + Supabase setup and env vars.

- **Vercel:** Root directory `frontend`, add env vars, deploy.
- **Render:** Use `render.yaml` at repo root (Blueprint) or create Web Service with root `backend`; set all env vars including `ALLOWED_ORIGINS` (your Vercel URL).

## Product

- Every screen answers: *What is broken? Why? What to fix first this week?*
- No dashboards; evidence-backed Decision Cards and weekly report only.

See `NORTH_STAR.md` and `BLUEPRINT_ANALYSIS_AND_BUILD_PLAN.md` for details.
