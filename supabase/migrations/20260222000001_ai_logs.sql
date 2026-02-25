-- You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics.
-- AI interaction logs: one row per interaction, scoped by account_id (Supabase auth user).

create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  session_id text not null,
  timestamp timestamptz not null,
  user_id text,
  input text not null,
  output text not null,
  feedback_type text not null,
  feedback_value text,
  tags text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_ai_logs_account_id on public.ai_logs (account_id);
create index if not exists idx_ai_logs_timestamp on public.ai_logs (timestamp);
create index if not exists idx_ai_logs_feedback_type on public.ai_logs (feedback_type);

alter table public.ai_logs enable row level security;

create policy "Users can manage own ai_logs"
  on public.ai_logs
  for all
  using (auth.uid() = account_id)
  with check (auth.uid() = account_id);

comment on table public.ai_logs is 'AI interaction logs for Decision Cards; required: session_id, timestamp, input, output, feedback_type, feedback_value. Optional: user_id, tags, metadata.';
