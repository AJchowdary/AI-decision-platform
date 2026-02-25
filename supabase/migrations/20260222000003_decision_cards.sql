-- You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics.
-- Decision Cards: prioritized, evidence-backed recommendations generated from Insights.

create table if not exists public.decision_cards (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  insight_id uuid not null,
  problem text not null,
  evidence_snippets jsonb not null default '[]',
  recommended_action text not null,
  impact_level int not null,
  effort_estimate int not null,
  confidence_score double precision not null,
  status text not null default 'open',
  created_at timestamptz default now()
);

create index if not exists idx_decision_cards_account_id on public.decision_cards (account_id);
create index if not exists idx_decision_cards_created_at on public.decision_cards (created_at desc);

alter table public.decision_cards enable row level security;

drop policy if exists "Users can manage own decision_cards" on public.decision_cards;
create policy "Users can manage own decision_cards"
  on public.decision_cards
  for all
  using (auth.uid() = account_id)
  with check (auth.uid() = account_id);

comment on table public.decision_cards is 'Decision Cards: prioritized, evidence-backed recommendations for what to fix this week.';

