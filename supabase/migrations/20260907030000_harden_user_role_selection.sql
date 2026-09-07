-- Profiles remain self-editable, but role selection is a one-time server action.
revoke update on table public.users from public, anon, authenticated;
grant update (nickname, tag) on table public.users to authenticated;

create or replace function public.select_user_role(
  p_role public.user_role
)
returns public.users
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_user public.users%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  if p_role not in ('PARENT'::public.user_role, 'CHILD'::public.user_role) then
    raise exception 'INVALID_ROLE';
  end if;

  select * into v_user
  from public.users
  where auth_user_id = auth.uid()
  for update;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;
  if v_user.role is distinct from 'DEFAULT'::public.user_role then
    raise exception 'ROLE_ALREADY_SELECTED' using errcode = '42501';
  end if;

  update public.users
  set role = p_role
  where id = v_user.id
    and role = 'DEFAULT'::public.user_role
  returning * into v_user;

  if not found then
    raise exception 'ROLE_ALREADY_SELECTED' using errcode = '42501';
  end if;

  return v_user;
end;
$function$;

revoke execute on function public.select_user_role(public.user_role)
  from public, anon, service_role;
grant execute on function public.select_user_role(public.user_role)
  to authenticated;
