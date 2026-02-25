-- You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics.
-- Organizations: one per team; trial and subscription live here.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  trial_ends_at timestamptz not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text not null default 'trialing' check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'none')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_organizations_slug on public.organizations (slug);
create index if not exists idx_organizations_stripe_customer on public.organizations (stripe_customer_id);

alter table public.organizations enable row level security;

-- Members: which users belong to which org. Used for RLS on ai_logs, insights, decision_cards.
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz default now(),
  unique(organization_id, user_id)
);

create index if not exists idx_organization_members_user_id on public.organization_members (user_id);
create index if not exists idx_organization_members_organization_id on public.organization_members (organization_id);

alter table public.organization_members enable row level security;

-- Members can read their org; only backend (service role) creates/updates orgs and members.
create policy "Users can read own org membership"
  on public.organization_members for select
  using (auth.uid() = user_id);

create policy "Users can read org they belong to"
  on public.organizations for select
  using (
    id in (select organization_id from public.organization_members where user_id = auth.uid())
  );

comment on table public.organizations is 'One per AI SaaS team; trial_ends_at and subscription_status gate upload/generate.';
comment on table public.organization_members is 'Links auth users to organizations for RLS and billing.';
