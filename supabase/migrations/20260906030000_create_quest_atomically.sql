-- Quest creation and its parent coin spend must succeed or fail together.
drop policy if exists "quests_insert_parent_only" on public.quests;

revoke insert on table public.quests from public, anon, authenticated;

create or replace function public.create_quest_with_reward(
  p_relation_id bigint,
  p_title text,
  p_reward integer,
  p_content text default null
)
returns public.quests
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_caller_id bigint;
  v_caller_role public.user_role;
  v_relation public.relations%rowtype;
  v_quest public.quests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  v_caller_id := public.uid_to_user_id(auth.uid());

  select role into v_caller_role
  from public.users
  where id = v_caller_id;

  if v_caller_id is null
     or v_caller_role is distinct from 'PARENT'::public.user_role then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_title is null or btrim(p_title) = '' then
    raise exception 'QUEST_TITLE_REQUIRED';
  end if;

  if p_reward is null or p_reward <= 0 then
    raise exception 'QUEST_REWARD_MUST_BE_POSITIVE';
  end if;

  select * into v_relation
  from public.relations
  where id = p_relation_id
  for share;

  if not found then
    raise exception 'RELATION_NOT_FOUND';
  end if;

  if v_relation.parent_id <> v_caller_id then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if v_relation.status is distinct from 'ACTIVE'::public.relation_status then
    raise exception 'QUEST_RELATION_NOT_ACTIVE';
  end if;

  insert into public.quests (
    relation_id,
    parent_id,
    child_id,
    title,
    content,
    reward,
    status
  ) values (
    v_relation.id,
    v_relation.parent_id,
    v_relation.child_id,
    p_title,
    p_content,
    p_reward,
    'REGISTERED'::public.quest_status
  )
  returning * into v_quest;

  perform public.spend_coins(
    v_relation.parent_id,
    p_reward,
    'QUEST'::public.reference_type,
    v_quest.id,
    '퀘스트 보상 재화 차감'
  );

  return v_quest;
end;
$function$;

revoke execute on function public.create_quest_with_reward(bigint, text, integer, text)
  from public, anon, service_role;
grant execute on function public.create_quest_with_reward(bigint, text, integer, text)
  to authenticated;
