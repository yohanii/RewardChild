-- A relation request must prove that this parent recently matched the exact child code.
create table private.child_search_matches (
  parent_id bigint primary key references public.users(id) on delete cascade,
  child_id bigint not null references public.users(id) on delete cascade,
  matched_at timestamptz not null default now()
);

revoke all privileges on table private.child_search_matches
  from public, anon, authenticated, service_role;

create or replace function public.find_child_by_tag(
  _nickname text,
  _tag text
)
returns table (id bigint)
language plpgsql
security definer
set search_path to public, private
as $function$
declare
  v_parent_id bigint;
  v_parent_role public.user_role;
  v_recent_attempts integer;
  v_child_id bigint;
begin
  if auth.role() is distinct from 'authenticated' or auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.id, u.role
  into v_parent_id, v_parent_role
  from public.users u
  where u.auth_user_id = auth.uid()
  for update;

  if v_parent_id is null or v_parent_role is distinct from 'PARENT'::public.user_role then
    raise exception 'PARENT_REQUIRED' using errcode = '42501';
  end if;

  delete from private.child_search_attempts a
  where a.parent_id = v_parent_id
    and a.attempted_at < statement_timestamp() - interval '1 day';

  select count(*)
  into v_recent_attempts
  from private.child_search_attempts a
  where a.parent_id = v_parent_id
    and a.attempted_at >= statement_timestamp() - interval '10 minutes';

  if v_recent_attempts >= 10 then
    raise exception 'CHILD_SEARCH_RATE_LIMITED' using errcode = 'P0001';
  end if;

  insert into private.child_search_attempts (parent_id)
  values (v_parent_id);

  if nullif(btrim(_nickname), '') is null
     or nullif(btrim(_tag), '') is null then
    return;
  end if;

  select u.id
  into v_child_id
  from public.users u
  where u.role = 'CHILD'::public.user_role
    and u.id <> v_parent_id
    and u.nickname = btrim(_nickname)
    and u.tag = upper(btrim(_tag))
    and not exists (
      select 1
      from public.relations r
      where r.parent_id = v_parent_id
        and r.child_id = u.id
    )
  limit 1;

  if v_child_id is null then
    return;
  end if;

  insert into private.child_search_matches (parent_id, child_id, matched_at)
  values (v_parent_id, v_child_id, statement_timestamp())
  on conflict (parent_id) do update
  set child_id = excluded.child_id,
      matched_at = excluded.matched_at;

  return query select v_child_id;
end;
$function$;

create or replace function public.create_relation_request(
  p_child_id bigint
)
returns public.relations
language plpgsql
security definer
set search_path to public, private
as $function$
declare
  v_caller_id bigint;
  v_caller_role public.user_role;
  v_child_role public.user_role;
  v_relation public.relations%rowtype;
begin
  if auth.role() is distinct from 'authenticated' or auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.id, u.role
  into v_caller_id, v_caller_role
  from public.users u
  where u.auth_user_id = auth.uid()
  for update;

  if v_caller_id is null or v_caller_role is distinct from 'PARENT'::public.user_role then
    raise exception 'PARENT_REQUIRED' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from private.child_search_matches m
    where m.parent_id = v_caller_id
      and m.child_id = p_child_id
      and m.matched_at >= statement_timestamp() - interval '10 minutes'
  ) then
    raise exception 'CHILD_SEARCH_REQUIRED' using errcode = '42501';
  end if;

  select u.role
  into v_child_role
  from public.users u
  where u.id = p_child_id;

  if not found or v_child_role is distinct from 'CHILD'::public.user_role
     or p_child_id = v_caller_id then
    raise exception 'CHILD_NOT_FOUND';
  end if;

  if exists (
    select 1
    from public.relations r
    where r.parent_id = v_caller_id
      and r.child_id = p_child_id
  ) then
    raise exception 'RELATION_ALREADY_EXISTS' using errcode = '23505';
  end if;

  insert into public.relations (parent_id, child_id, status)
  values (v_caller_id, p_child_id, 'PENDING'::public.relation_status)
  returning * into v_relation;

  delete from private.child_search_matches
  where parent_id = v_caller_id;

  return v_relation;
exception
  when unique_violation then
    raise exception 'RELATION_ALREADY_EXISTS' using errcode = '23505';
end;
$function$;

revoke execute on function public.find_child_by_tag(text, text)
  from public, anon, service_role;
grant execute on function public.find_child_by_tag(text, text)
  to authenticated;

revoke execute on function public.create_relation_request(bigint)
  from public, anon, service_role;
grant execute on function public.create_relation_request(bigint)
  to authenticated;
