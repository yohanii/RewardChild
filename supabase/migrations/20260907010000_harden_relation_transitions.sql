-- Relation lifecycle changes are server-validated and preserve ACTIVE history.
drop policy if exists "Parents can insert relations" on public.relations;
drop policy if exists "parent or child can update relations" on public.relations;
drop policy if exists "parent or child can delete relations" on public.relations;

revoke insert, update, delete, truncate on table public.relations
  from public, anon, authenticated;
revoke select, update, usage on sequence public.relations_id_seq
  from anon, authenticated;

create or replace function public.create_relation_request(
  p_child_id bigint
)
returns public.relations
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_caller_id bigint;
  v_caller_role public.user_role;
  v_child_role public.user_role;
  v_relation public.relations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.id, u.role
  into v_caller_id, v_caller_role
  from public.users u
  where u.auth_user_id = auth.uid();

  if v_caller_id is null or v_caller_role is distinct from 'PARENT'::public.user_role then
    raise exception 'PARENT_REQUIRED' using errcode = '42501';
  end if;

  select u.role
  into v_child_role
  from public.users u
  where u.id = p_child_id;

  if not found or v_child_role is distinct from 'CHILD'::public.user_role then
    raise exception 'CHILD_NOT_FOUND';
  end if;

  begin
    insert into public.relations (parent_id, child_id, status)
    values (v_caller_id, p_child_id, 'PENDING'::public.relation_status)
    returning * into v_relation;
  exception
    when unique_violation then
      raise exception 'RELATION_ALREADY_EXISTS' using errcode = '23505';
  end;

  return v_relation;
end;
$function$;

create or replace function public.approve_relation_request(
  p_relation_id bigint
)
returns public.relations
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_caller_id bigint;
  v_caller_role public.user_role;
  v_relation public.relations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.id, u.role
  into v_caller_id, v_caller_role
  from public.users u
  where u.auth_user_id = auth.uid();

  select *
  into v_relation
  from public.relations
  where id = p_relation_id
  for update;

  if not found then
    raise exception 'RELATION_NOT_FOUND';
  end if;
  if v_caller_role is distinct from 'CHILD'::public.user_role
     or v_caller_id is distinct from v_relation.child_id then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_relation.status is distinct from 'PENDING'::public.relation_status then
    raise exception 'RELATION_NOT_PENDING';
  end if;
  if not exists (
    select 1 from public.users u
    where u.id = v_relation.parent_id
      and u.role = 'PARENT'::public.user_role
  ) then
    raise exception 'RELATION_PARENT_INVALID';
  end if;

  update public.relations
  set status = 'ACTIVE'::public.relation_status
  where id = v_relation.id
    and status = 'PENDING'::public.relation_status
  returning * into v_relation;

  if not found then
    raise exception 'RELATION_NOT_PENDING';
  end if;

  return v_relation;
end;
$function$;

create or replace function public.cancel_relation_request(
  p_relation_id bigint
)
returns public.relations
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_caller_id bigint;
  v_caller_role public.user_role;
  v_relation public.relations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.id, u.role into v_caller_id, v_caller_role
  from public.users u where u.auth_user_id = auth.uid();

  select * into v_relation
  from public.relations where id = p_relation_id for update;

  if not found then
    raise exception 'RELATION_NOT_FOUND';
  end if;
  if v_caller_role is distinct from 'PARENT'::public.user_role
     or v_caller_id is distinct from v_relation.parent_id then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_relation.status is distinct from 'PENDING'::public.relation_status then
    raise exception 'RELATION_NOT_PENDING';
  end if;

  delete from public.relations
  where id = v_relation.id
    and status = 'PENDING'::public.relation_status
  returning * into v_relation;

  if not found then
    raise exception 'RELATION_NOT_PENDING';
  end if;

  return v_relation;
end;
$function$;

create or replace function public.reject_relation_request(
  p_relation_id bigint
)
returns public.relations
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_caller_id bigint;
  v_caller_role public.user_role;
  v_relation public.relations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.id, u.role into v_caller_id, v_caller_role
  from public.users u where u.auth_user_id = auth.uid();

  select * into v_relation
  from public.relations where id = p_relation_id for update;

  if not found then
    raise exception 'RELATION_NOT_FOUND';
  end if;
  if v_caller_role is distinct from 'CHILD'::public.user_role
     or v_caller_id is distinct from v_relation.child_id then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_relation.status is distinct from 'PENDING'::public.relation_status then
    raise exception 'RELATION_NOT_PENDING';
  end if;

  delete from public.relations
  where id = v_relation.id
    and status = 'PENDING'::public.relation_status
  returning * into v_relation;

  if not found then
    raise exception 'RELATION_NOT_PENDING';
  end if;

  return v_relation;
end;
$function$;

create or replace function public.block_relation(
  p_relation_id bigint
)
returns public.relations
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_caller_id bigint;
  v_caller_role public.user_role;
  v_relation public.relations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.id, u.role into v_caller_id, v_caller_role
  from public.users u where u.auth_user_id = auth.uid();

  select * into v_relation
  from public.relations where id = p_relation_id for update;

  if not found then
    raise exception 'RELATION_NOT_FOUND';
  end if;
  if not (
    (v_caller_role = 'PARENT'::public.user_role and v_caller_id = v_relation.parent_id)
    or (v_caller_role = 'CHILD'::public.user_role and v_caller_id = v_relation.child_id)
  ) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_relation.status is distinct from 'ACTIVE'::public.relation_status then
    raise exception 'RELATION_NOT_ACTIVE';
  end if;

  update public.relations
  set status = 'BLOCKED'::public.relation_status
  where id = v_relation.id
    and status = 'ACTIVE'::public.relation_status
  returning * into v_relation;

  if not found then
    raise exception 'RELATION_NOT_ACTIVE';
  end if;

  return v_relation;
end;
$function$;

revoke execute on function public.create_relation_request(bigint)
  from public, anon, service_role;
revoke execute on function public.approve_relation_request(bigint)
  from public, anon, service_role;
revoke execute on function public.cancel_relation_request(bigint)
  from public, anon, service_role;
revoke execute on function public.reject_relation_request(bigint)
  from public, anon, service_role;
revoke execute on function public.block_relation(bigint)
  from public, anon, service_role;

grant execute on function public.create_relation_request(bigint) to authenticated;
grant execute on function public.approve_relation_request(bigint) to authenticated;
grant execute on function public.cancel_relation_request(bigint) to authenticated;
grant execute on function public.reject_relation_request(bigint) to authenticated;
grant execute on function public.block_relation(bigint) to authenticated;
