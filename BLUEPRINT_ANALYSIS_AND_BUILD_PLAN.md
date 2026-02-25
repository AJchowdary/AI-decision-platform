# Blueprint Analysis & Build Plan

Analysis of **AI_Product_Decision_Platform_Blueprint.pdf** and proposed build plan. **Review this and share guidance before we implement.**

---

## 1. Blueprint summary

| Area | From blueprint |
|------|----------------|
| **Positioning** | AI PM for early-stage AI SaaS: what’s broken, why, what to fix this week — no dashboards. |
| **Core artifacts** | **Decision Cards** (ranked, evidence-backed) + **Weekly AI Product Report** (top 3 issues, 1 focus fix, 1 thing not to change). |
| **Stack** | Next.js + Tailwind (frontend), FastAPI (backend), **Supabase** (Auth + Postgres). Deploy: **Vercel** + **Render**. Mono-repo: `/frontend`, `/backend`. |
| **ICP** | Early-stage AI SaaS (1–10 people), live AI feature, some logs + basic feedback (thumbs, tags, NPS). Not enterprises or heavy MLOps. |

**Product rule (every screen):** Answer one of: *What is broken?* *Why?* *What should we fix first this week?*

---

## 2. Phased build (6 weeks in blueprint)

| Week | Focus | Main deliverables |
|------|--------|--------------------|
| **1** | Tech setup | Mono-repo, JWT auth, placeholder routes (ingestion, insights, decision_cards, reports), redirect to Decision Cards (not a dashboard). |
| **2** | Data ingestion | Log schema (Postgres), upload API (CSV + JSON), validation, frontend upload + schema preview + “Generate insights” CTA. |
| **3** | Insight engine | Embeddings + clustering on negative feedback, “why is it broken” (LLM), store Insights (title, description, snippets, frequency, root_cause). |
| **4** | Decision Cards | Card schema, generation from insights (1–3 cards per insight), priority_score, UI: card list + “This week’s top 3”, evidence snippets, no charts. |
| **5** | Weekly report | Generator (top 3 + 1 focus + 1 “don’t change”), email delivery, in-app `/report/weekly` + “Copy for Standup”. |
| **6** | Polish & deploy | Auth hardening, rate limiting, logging, account namespacing, Vercel + Render, early user validation. |

---

## 3. Data model (from blueprint)

**AI interaction logs (min fields):**  
`session_id`, `timestamp`, `user_id` (optional), `input`, `output`, `feedback_type`, `feedback_value`, `tags`

**Insight:**  
`id`, `account_id`, `title`, `description`, `example_snippets`, `frequency`, `avg_feedback`, `root_cause`, `created_at`

**DecisionCard:**  
`id`, `insight_id`, `problem`, `evidence_snippets`, `recommended_action`, `impact_level` (1–5), `effort_estimate` (1–5), `confidence_score` (0–1), `status` (open/in_progress/done), `created_at`

---

## 4. UX rules (from blueprint)

- **No dashboards** — primary views: Decision Cards and weekly report. Numbers in card text (e.g. “Affects ~23% of conversations”), not charts.
- **Evidence** — ≥2 snippets per card; confidence label (Low/Medium/High).
- **PM voice** — senior PM advising a founder; no “cluster ID”, “embedding”, “p95 latency” in user-facing copy.

---

## 5. Proposed build order (for your review)

1. **Skeleton (Week 1)**  
   Mono-repo, Next.js + Tailwind in `/frontend`, FastAPI + Postgres in `/backend`, JWT auth, placeholder routes, first landing after login = Decision Cards page.

2. **Ingestion (Week 2)**  
   Log schema + migrations, `/ingestion/upload` (CSV/JSON), validation + human-readable errors, upload UI (drag-drop, preview, success → “Generate insights”).

3. **Insight engine (Week 3)**  
   Pipeline: fetch logs → filter negative feedback → embeddings → clustering → LLM “why broken” → save Insights. One provider for embeddings/LLM (e.g. OpenAI) to start.

4. **Decision Cards (Week 4)**  
   DecisionCard model + generation from Insights, priority_score, `/decision_cards/list` + top_3_this_week, Decision Card UI (problem, evidence, action, impact/effort/confidence).

5. **Weekly report (Week 5)**  
   `generate_weekly_report(account_id)`, email service (text-only), Next.js `/report/weekly` + “Copy for Standup”.

6. **Polish (Week 6)**  
   Security, rate limiting, logging, deploy config (Vercel + Railway), env docs.

**Optional later:** Stripe single-plan, gate weekly reports if inactive.

---

## 6. Locked decisions (from product review)

| # | Decision |
|---|----------|
| 1 | **Stack:** Next.js + Tailwind, FastAPI. Use any provider for LLM/embeddings for testing; keep interface so it’s easy to swap later. |
| 2 | **Scope:** Option A — build through Week 4 (Decision Cards), then report + polish. |
| 3 | **Auth & DB:** **Supabase** for Auth and Database. Sign in with **Google** and email/password. |
| 4 | **Log schema:** Allow optional extra fields (e.g. `metadata` JSON). |
| 5 | **Deploy:** **Vercel** (frontend), **Render** (backend). Supabase hosted separately. |
| 6 | **Design:** Eye-catching colors, interactive, 3D-looking UI. |
| 7 | **Before fix:** Propose changes in chat before applying. |

**Architecture:** Next.js (Vercel) ↔ Supabase (Auth + Postgres) + FastAPI (Render) for ingestion, insight engine, cards, reports. Backend verifies Supabase JWT and uses Supabase Postgres connection.

---

## 7. Original questions (reference)

Before writing code, need your decisions on:

1. **Stack**  
   - Confirm: **Next.js** (App Router or Pages?) + **Tailwind** frontend, **FastAPI** + **Postgres** backend, **JWT** auth?  
   - Any preference for **embedding/LLM provider** (OpenAI, Anthropic, other) and whether we should keep it swappable?

2. **Scope for first version**  
   - Build **Weeks 1–4** first (through Decision Cards), then add report + polish?  
   - Or strict **Week 1 only** (skeleton + auth) and then iterate by week?

3. **Auth**  
   - Email + password only for MVP, or do you want “Sign in with Google” (or similar) from day one?

4. **Data**  
   - Is the log schema (session_id, timestamp, user_id, input, output, feedback_type, feedback_value, tags) fixed, or should we allow optional extra fields (e.g. `metadata` JSON)?

5. **Deployment**  
   - Are **Vercel (frontend)** and **Railway (backend + Postgres)** the chosen targets, or do you prefer different hosts?

6. **Design**  
   - Any brand colors, fonts, or reference UIs you want the “PM voice” UI to align with?  
   - Or should we use a neutral, clean default (e.g. Tailwind defaults + simple typography)?

7. **“Before fix things”**  
   - When we propose a fix or refactor (e.g. schema change, new endpoint), do you want a **short written proposal** in the repo or in chat before we apply it?

Once you answer these (even briefly), we can lock the plan and start with **Week 1 (skeleton + auth)** and keep every screen aligned with: *what’s broken, why, what to fix this week.*
