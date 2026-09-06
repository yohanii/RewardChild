-- Quest state transitions must go through narrowly scoped RPCs.
drop policy if exists "quests_update_related" on public.quests;

revoke update on table public.quests from public, anon, authenticated;

create or replace function public.request_quest_completion(
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

  select * into v_quest
  from public.quests
  where id = p_quest_id
  for update;

  if not found then
    raise exception 'QUEST_NOT_FOUND';
  end if;

  if v_caller_id is null or v_caller_id <> v_quest.child_id then
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

  if v_quest.status is distinct from 'REGISTERED'::public.quest_status then
    raise exception 'QUEST_NOT_REGISTERED';
  end if;

  update public.quests
  set status = 'REQUESTED'::public.quest_status
  where id = v_quest.id
    and status = 'REGISTERED'::public.quest_status
  returning * into v_updated;

  if not found then
    raise exception 'QUEST_NOT_REGISTERED';
  end if;

  return v_updated;
end;
$function$;

revoke execute on function public.request_quest_completion(bigint)
  from public, anon, service_role;
grant execute on function public.request_quest_completion(bigint)
  to authenticated;
