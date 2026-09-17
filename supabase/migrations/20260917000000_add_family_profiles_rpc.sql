create or replace function public.get_family_profiles(
  p_user_ids bigint[]
)
returns table (
  id bigint,
  nickname text,
  tag text
)
language plpgsql
stable
security definer
set search_path to public
as $function$
declare
  v_caller_id bigint;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.id
  into v_caller_id
  from public.users u
  where u.auth_user_id = auth.uid();

  if v_caller_id is null then
    raise exception 'PROFILE_REQUIRED' using errcode = '42501';
  end if;

  if coalesce(cardinality(p_user_ids), 0) > 100 then
    raise exception 'TOO_MANY_USER_IDS';
  end if;

  return query
  select u.id, u.nickname::text, u.tag::text
  from public.users u
  where u.id = any(coalesce(p_user_ids, array[]::bigint[]))
    and exists (
      select 1
      from public.relations r
      where (
          r.status = 'ACTIVE'::public.relation_status
          and (
            (r.parent_id = v_caller_id and r.child_id = u.id)
            or (r.child_id = v_caller_id and r.parent_id = u.id)
          )
        )
        or (
          r.status = 'PENDING'::public.relation_status
          and r.child_id = v_caller_id
          and r.parent_id = u.id
        )
        or (
          r.status = 'BLOCKED'::public.relation_status
          and r.parent_id = v_caller_id
          and r.child_id = u.id
          and exists (
            select 1
            from public.shop_purchases sp
            join public.shop_items si on si.id = sp.shop_item_id
            where sp.child_id = r.child_id
              and si.parent_id = r.parent_id
          )
        )
    )
  order by u.id;
end;
$function$;

-- Related users must be read through the minimal-column RPC above. Keeping
-- this policy would allow SELECT of the whole parent row, including auth_user_id.
drop policy if exists "Users: parent of my incoming relation" on public.users;

revoke execute on function public.get_family_profiles(bigint[])
  from public, anon, service_role;
grant execute on function public.get_family_profiles(bigint[])
  to authenticated;
