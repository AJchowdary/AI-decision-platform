-- You are helping build an AI Product Decision Platform. Never add generic charts or infra metrics.
-- RLS: account_id can be organization_id (member check) or legacy user id (auth.uid() = account_id).

drop policy if exists "Users can manage own ai_logs" on public.ai_logs;
create policy "Users can manage ai_logs for their org or own"
  on public.ai_logs for all
  using (
    auth.uid() = account_id
    or account_id in (select organization_id from public.organization_members where user_id = auth.uid())
  )
  with check (
    auth.uid() = account_id
    or account_id in (select organization_id from public.organization_members where user_id = auth.uid())
  );

drop policy if exists "Users can manage own insights" on public.insights;
create policy "Users can manage insights for their org or own"
  on public.insights for all
  using (
    auth.uid() = account_id
    or account_id in (select organization_id from public.organization_members where user_id = auth.uid())
  )
  with check (
    auth.uid() = account_id
    or account_id in (select organization_id from public.organization_members where user_id = auth.uid())
  );

drop policy if exists "Users can manage own decision_cards" on public.decision_cards;
create policy "Users can manage decision_cards for their org or own"
  on public.decision_cards for all
  using (
    auth.uid() = account_id
    or account_id in (select organization_id from public.organization_members where user_id = auth.uid())
  )
  with check (
    auth.uid() = account_id
    or account_id in (select organization_id from public.organization_members where user_id = auth.uid())
  );
