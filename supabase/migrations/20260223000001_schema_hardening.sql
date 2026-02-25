-- You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics.
-- Schema hardening: explicit jsonb defaults, created_at not null, ai_logs session_id index.

-- ai_logs: explicit jsonb default for metadata, created_at not null
alter table public.ai_logs
  alter column metadata set default '{}'::jsonb,
  alter column created_at set not null,
  alter column created_at set default now();

-- insights: explicit jsonb defaults (already have default; ensure ::jsonb)
alter table public.insights
  alter column example_snippets set default '[]'::jsonb,
  alter column root_cause set default '{}'::jsonb,
  alter column created_at set not null,
  alter column created_at set default now();

-- decision_cards: explicit jsonb default, created_at not null
alter table public.decision_cards
  alter column evidence_snippets set default '[]'::jsonb,
  alter column created_at set not null,
  alter column created_at set default now();

-- organizations: created_at not null
alter table public.organizations
  alter column created_at set not null,
  alter column created_at set default now();

-- organization_members: created_at not null
alter table public.organization_members
  alter column created_at set not null,
  alter column created_at set default now();

-- Index for ai_logs by session_id (useful for session-scoped queries)
create index if not exists idx_ai_logs_session_id on public.ai_logs (session_id);

comment on column public.ai_logs.metadata is 'Optional JSON; default empty object.';
comment on column public.insights.example_snippets is 'Sample input/output snippets; default empty array.';
comment on column public.insights.root_cause is 'LLM explanation keys; default empty object.';
