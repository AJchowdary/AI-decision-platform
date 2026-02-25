-- You are helping build an AI Product Decision Platform. Onboarding survey: for analytics only; no special product behavior by account_type or org name.

alter table public.organizations
  add column if not exists account_type text check (account_type in ('organization', 'individual')),
  add column if not exists survey_responses jsonb default '{}';

comment on column public.organizations.account_type is 'Analytics only: organization vs individual from onboarding. No special product behavior.';
comment on column public.organizations.survey_responses is 'Analytics only: onboarding answers (role, use case, etc.). Product behavior is independent of org.';
