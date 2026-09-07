-- Shop catalogs are private to a parent and their actively connected children.
drop policy if exists "Everyone can view shop items" on public.shop_items;

create policy "shop_items_select_family_catalog"
on public.shop_items
for select
to authenticated
using (
  parent_id = public.uid_to_user_id(auth.uid())
  or (
    is_active
    and exists (
      select 1
      from public.relations r
      where r.parent_id = shop_items.parent_id
        and r.child_id = public.uid_to_user_id(auth.uid())
        and r.status = 'ACTIVE'::public.relation_status
    )
  )
);

revoke all privileges on table public.shop_items
  from public, anon, authenticated;
grant select on table public.shop_items to authenticated;
revoke select, update, usage on sequence public.shop_items_id_seq
  from anon, authenticated;

create or replace function public.create_shop_item(
  p_title text,
  p_content text,
  p_price integer
)
returns public.shop_items
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_parent_id bigint;
  v_role public.user_role;
  v_item public.shop_items%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.id, u.role
  into v_parent_id, v_role
  from public.users u
  where u.auth_user_id = auth.uid();

  if v_parent_id is null or v_role is distinct from 'PARENT'::public.user_role then
    raise exception 'PARENT_REQUIRED' using errcode = '42501';
  end if;
  if nullif(btrim(p_title), '') is null then
    raise exception 'TITLE_REQUIRED';
  end if;
  if p_price is null or p_price <= 0 then
    raise exception 'PRICE_MUST_BE_POSITIVE';
  end if;

  insert into public.shop_items (
    parent_id, title, content, price, is_active
  ) values (
    v_parent_id,
    btrim(p_title),
    nullif(btrim(p_content), ''),
    p_price,
    true
  )
  returning * into v_item;

  return v_item;
end;
$function$;

create or replace function public.update_shop_item(
  p_shop_item_id bigint,
  p_title text,
  p_content text,
  p_price integer
)
returns public.shop_items
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_parent_id bigint;
  v_role public.user_role;
  v_item public.shop_items%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.id, u.role
  into v_parent_id, v_role
  from public.users u
  where u.auth_user_id = auth.uid();

  if v_parent_id is null or v_role is distinct from 'PARENT'::public.user_role then
    raise exception 'PARENT_REQUIRED' using errcode = '42501';
  end if;
  if nullif(btrim(p_title), '') is null then
    raise exception 'TITLE_REQUIRED';
  end if;
  if p_price is null or p_price <= 0 then
    raise exception 'PRICE_MUST_BE_POSITIVE';
  end if;

  select * into v_item
  from public.shop_items
  where id = p_shop_item_id
  for update;

  if not found then
    raise exception 'SHOP_ITEM_NOT_FOUND';
  end if;
  if v_item.parent_id <> v_parent_id then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  update public.shop_items
  set title = btrim(p_title),
      content = nullif(btrim(p_content), ''),
      price = p_price
  where id = v_item.id
    and parent_id = v_parent_id
  returning * into v_item;

  return v_item;
end;
$function$;

create or replace function public.deactivate_shop_item(
  p_shop_item_id bigint
)
returns public.shop_items
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_parent_id bigint;
  v_role public.user_role;
  v_item public.shop_items%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.id, u.role
  into v_parent_id, v_role
  from public.users u
  where u.auth_user_id = auth.uid();

  if v_parent_id is null or v_role is distinct from 'PARENT'::public.user_role then
    raise exception 'PARENT_REQUIRED' using errcode = '42501';
  end if;

  select * into v_item
  from public.shop_items
  where id = p_shop_item_id
  for update;

  if not found then
    raise exception 'SHOP_ITEM_NOT_FOUND';
  end if;
  if v_item.parent_id <> v_parent_id then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  update public.shop_items
  set is_active = false
  where id = v_item.id
    and parent_id = v_parent_id
  returning * into v_item;

  return v_item;
end;
$function$;

revoke execute on function public.create_shop_item(text, text, integer)
  from public, anon, service_role;
revoke execute on function public.update_shop_item(bigint, text, text, integer)
  from public, anon, service_role;
revoke execute on function public.deactivate_shop_item(bigint)
  from public, anon, service_role;

grant execute on function public.create_shop_item(text, text, integer)
  to authenticated;
grant execute on function public.update_shop_item(bigint, text, text, integer)
  to authenticated;
grant execute on function public.deactivate_shop_item(bigint)
  to authenticated;
