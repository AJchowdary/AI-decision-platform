# AI Product Decision Platform — Backend

FastAPI backend for ingestion, insight engine, Decision Cards, and reports. Auth via **Supabase** (JWT). DB: Supabase Postgres.

## Run locally

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows PowerShell
pip install -r requirements.txt
cp .env.example .env     # set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

From the repo root (PowerShell): `cd backend; python -m uvicorn app.main:app --reload --port 8000`

## Deploy (Render)

- New Web Service, connect repo, root: `backend`
- Build: `pip install -r requirements.txt`
- Start: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, optional `DATABASE_URL`

## Tests

```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/ -v
```

- **test_main.py:** Health check, auth required for protected routes, ingestion schema shape with mock auth.
- **test_ingestion.py:** JSON/CSV parsing (valid rows, missing required, invalid timestamp, empty).

## Load / stress test

With the backend running locally:

```bash
cd backend
pip install httpx
python -m scripts.load_test --url http://localhost:8000 --requests 200 --concurrent 10
```

Exits 0 if all requests to `GET /health` return 200.
