-- Refund transactions restore the same balance bucket that was spent.
create or replace function public.apply_transaction_to_balance()
returns trigger
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_bucket_type public.balance_type;
  v_new_amount integer;
begin
  case new.type
    when 'INITIAL_CREDIT' then v_bucket_type := 'ATTENDANCE';
    when 'ATTENDANCE_REWARD' then v_bucket_type := 'ATTENDANCE';
    when 'SPEND_ATTENDANCE' then v_bucket_type := 'ATTENDANCE';
    when 'REFUND_ATTENDANCE' then v_bucket_type := 'ATTENDANCE';
    when 'SPEND_CASH' then v_bucket_type := 'CASH';
    when 'REFUND_CASH' then v_bucket_type := 'CASH';
    else v_bucket_type := 'CASH';
  end case;

  insert into public.balances (user_id, type, amount)
  values (new.user_id, v_bucket_type, new.amount)
  on conflict (user_id, type)
  do update
  set amount = public.balances.amount + excluded.amount,
      updated_at = now()
  returning amount into v_new_amount;

  if v_new_amount < 0 then
    raise exception
      'Balance would become negative for user % (bucket %)',
      new.user_id, v_bucket_type;
  end if;

  return new;
end;
$function$;

create unique index ux_transactions_quest_refund_once
  on public.transactions (reference_id, type)
  where reference_type = 'QUEST'::public.reference_type
    and type in (
      'REFUND_ATTENDANCE'::public.transaction_type,
      'REFUND_CASH'::public.transaction_type
    );

drop policy if exists "quests_delete_parent_only" on public.quests;
revoke delete on table public.quests from public, anon, authenticated;

-- A relation deletion must not bypass quest deletion and refund rules.
alter table public.quests
  drop constraint quests_relation_id_fkey;
alter table public.quests
  add constraint quests_relation_id_fkey
  foreign key (relation_id)
  references public.relations(id)
  on delete restrict;

create or replace function public.delete_quest_with_refund(
  p_quest_id bigint
)
returns public.quests
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_caller_id bigint;
  v_caller_role public.user_role;
  v_quest public.quests%rowtype;
  v_refund_attendance integer;
  v_refund_cash integer;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  v_caller_id := public.uid_to_user_id(auth.uid());

  select role into v_caller_role
  from public.users
  where id = v_caller_id;

  select * into v_quest
  from public.quests
  where id = p_quest_id
  for update;

  if not found then
    raise exception 'QUEST_NOT_FOUND';
  end if;

  if v_caller_id is null
     or v_caller_role is distinct from 'PARENT'::public.user_role
     or v_caller_id <> v_quest.parent_id then
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
    raise exception 'QUEST_NOT_DELETABLE';
  end if;

  if exists (
    select 1
    from public.transactions t
    where t.reference_type = 'QUEST'::public.reference_type
      and t.reference_id = v_quest.id
      and t.type in (
        'REFUND_ATTENDANCE'::public.transaction_type,
        'REFUND_CASH'::public.transaction_type
      )
  ) then
    raise exception 'QUEST_ALREADY_REFUNDED';
  end if;

  select
    coalesce(sum(-t.amount) filter (
      where t.type = 'SPEND_ATTENDANCE'::public.transaction_type
        and t.amount < 0
    ), 0)::integer,
    coalesce(sum(-t.amount) filter (
      where t.type = 'SPEND_CASH'::public.transaction_type
        and t.amount < 0
    ), 0)::integer
  into v_refund_attendance, v_refund_cash
  from public.transactions t
  where t.user_id = v_quest.parent_id
    and t.reference_type = 'QUEST'::public.reference_type
    and t.reference_id = v_quest.id;

  if v_refund_attendance + v_refund_cash <> v_quest.reward then
    raise exception 'QUEST_SPEND_MISMATCH';
  end if;

  if v_refund_attendance > 0 then
    insert into public.transactions (
      user_id, type, amount, reference_type, reference_id, note
    ) values (
      v_quest.parent_id,
      'REFUND_ATTENDANCE'::public.transaction_type,
      v_refund_attendance,
      'QUEST'::public.reference_type,
      v_quest.id,
      '퀘스트 삭제 ATTENDANCE 환불'
    );
  end if;

  if v_refund_cash > 0 then
    insert into public.transactions (
      user_id, type, amount, reference_type, reference_id, note
    ) values (
      v_quest.parent_id,
      'REFUND_CASH'::public.transaction_type,
      v_refund_cash,
      'QUEST'::public.reference_type,
      v_quest.id,
      '퀘스트 삭제 CASH 환불'
    );
  end if;

  delete from public.quests
  where id = v_quest.id;

  return v_quest;
end;
$function$;

create or replace function public.reject_quest(
  p_quest_id bigint
)
returns public.quests
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_caller_id bigint;
  v_caller_role public.user_role;
  v_quest public.quests%rowtype;
  v_updated public.quests%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  v_caller_id := public.uid_to_user_id(auth.uid());

  select role into v_caller_role
  from public.users
  where id = v_caller_id;

  select * into v_quest
  from public.quests
  where id = p_quest_id
  for update;

  if not found then
    raise exception 'QUEST_NOT_FOUND';
  end if;

  if v_caller_id is null
     or v_caller_role is distinct from 'PARENT'::public.user_role
     or v_caller_id <> v_quest.parent_id then
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

  update public.quests
  set status = 'REJECTED'::public.quest_status
  where id = v_quest.id
    and status = 'REQUESTED'::public.quest_status
  returning * into v_updated;

  if not found then
    raise exception 'QUEST_NOT_REQUESTED';
  end if;

  return v_updated;
end;
$function$;

-- A child may submit an initially registered or previously rejected quest.
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

  if v_quest.status is null
     or v_quest.status not in (
       'REGISTERED'::public.quest_status,
       'REJECTED'::public.quest_status
     ) then
    raise exception 'QUEST_NOT_REQUESTABLE';
  end if;

  update public.quests
  set status = 'REQUESTED'::public.quest_status
  where id = v_quest.id
    and status in (
      'REGISTERED'::public.quest_status,
      'REJECTED'::public.quest_status
    )
  returning * into v_updated;

  if not found then
    raise exception 'QUEST_NOT_REQUESTABLE';
  end if;

  return v_updated;
end;
$function$;

revoke execute on function public.delete_quest_with_refund(bigint)
  from public, anon, service_role;
grant execute on function public.delete_quest_with_refund(bigint)
  to authenticated;

revoke execute on function public.reject_quest(bigint)
  from public, anon, service_role;
grant execute on function public.reject_quest(bigint)
  to authenticated;

revoke execute on function public.request_quest_completion(bigint)
  from public, anon, service_role;
grant execute on function public.request_quest_completion(bigint)
  to authenticated;
