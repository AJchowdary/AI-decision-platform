-- You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics.
-- Insights: failure-pattern summaries from clustered AI logs (for Decision Cards).

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  title text not null,
  description text not null,
  example_snippets jsonb not null default '[]',
  frequency int not null default 0,
  avg_feedback text,
  root_cause jsonb not null default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_insights_account_id on public.insights (account_id);
create index if not exists idx_insights_created_at on public.insights (created_at desc);

alter table public.insights enable row level security;

create policy "Users can manage own insights"
  on public.insights
  for all
  using (auth.uid() = account_id)
  with check (auth.uid() = account_id);

comment on table public.insights is 'Failure-pattern insights from clustered negative feedback; feeds Decision Cards.';
