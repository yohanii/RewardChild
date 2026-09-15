-- Keep exact child-code lookup available only through a guarded parent RPC.
create table private.child_search_attempts (
  parent_id bigint not null references public.users(id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index child_search_attempts_parent_recent_idx
  on private.child_search_attempts (parent_id, attempted_at desc);

revoke all privileges on table private.child_search_attempts
  from public, anon, authenticated, service_role;

drop function public.find_child_by_tag(text, text);

create function public.find_child_by_tag(
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

  -- The row lock above serializes attempts for one parent, including concurrent calls.
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

  return query
  select u.id
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
end;
$function$;

revoke execute on function public.find_child_by_tag(text, text)
  from public, anon, service_role;
grant execute on function public.find_child_by_tag(text, text)
  to authenticated;

