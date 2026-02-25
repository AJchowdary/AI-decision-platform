-- You are helping build an AI Product Decision Platform. Onboarding survey: account type and responses for understanding users.

alter table public.organizations
  add column if not exists account_type text check (account_type in ('organization', 'individual')),
  add column if not exists survey_responses jsonb default '{}';

comment on column public.organizations.account_type is 'Set during onboarding: organization or individual.';
comment on column public.organizations.survey_responses is 'Onboarding questionnaire answers (role, use case, team size, etc.) for product insight.';
