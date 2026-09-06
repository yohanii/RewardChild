-- A quest can produce at most one reward ledger entry.
create unique index ux_transactions_quest_reward_once
  on public.transactions (reference_id)
  where reference_type = 'QUEST'::public.reference_type
    and type = 'QUEST_REWARD'::public.transaction_type;

create or replace function public.approve_quest_with_reward(
  p_quest_id bigint
)
returns public.quests
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_caller_id bigint;
  v_quest public.quests%rowtype;
  v_updated public.quests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  v_caller_id := public.uid_to_user_id(auth.uid());

  select *
  into v_quest
  from public.quests
  where id = p_quest_id
  for update;

  if not found then
    raise exception 'QUEST_NOT_FOUND';
  end if;

  if v_caller_id is null or v_caller_id <> v_quest.parent_id then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.relations r
    where r.id = v_quest.relation_id
      and r.parent_id = v_quest.parent_id
      and r.child_id = v_quest.child_id
      and r.status = 'ACTIVE'::public.relation_status
  ) then
    raise exception 'QUEST_RELATION_NOT_ACTIVE';
  end if;

  if v_quest.status is distinct from 'REQUESTED'::public.quest_status then
    raise exception 'QUEST_NOT_REQUESTED';
  end if;

  if exists (
    select 1
    from public.transactions t
    where t.reference_type = 'QUEST'::public.reference_type
      and t.reference_id = v_quest.id
      and t.type = 'QUEST_REWARD'::public.transaction_type
  ) then
    raise exception 'QUEST_ALREADY_REWARDED';
  end if;

  update public.quests
  set status = 'COMPLETED'::public.quest_status,
      completed_at = now()
  where id = v_quest.id
    and status = 'REQUESTED'::public.quest_status
  returning * into v_updated;

  if not found then
    raise exception 'QUEST_NOT_REQUESTED';
  end if;

  insert into public.transactions (
    user_id,
    type,
    amount,
    reference_type,
    reference_id,
    note
  ) values (
    v_updated.child_id,
    'QUEST_REWARD'::public.transaction_type,
    v_updated.reward,
    'QUEST'::public.reference_type,
    v_updated.id,
    '퀘스트 보상 지급'
  );

  return v_updated;
end;
$function$;

revoke execute on function public.approve_quest_with_reward(bigint)
  from public, anon, service_role;
grant execute on function public.approve_quest_with_reward(bigint)
  to authenticated;
