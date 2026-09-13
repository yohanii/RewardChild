create type public.shop_purchase_status as enum (
  'PURCHASED',
  'FULFILLED'
);

alter table public.shop_purchases
  add column status public.shop_purchase_status not null
    default 'PURCHASED'::public.shop_purchase_status,
  add column fulfilled_at timestamp with time zone,
  add constraint shop_purchases_fulfillment_state_check check (
    (status = 'PURCHASED'::public.shop_purchase_status and fulfilled_at is null)
    or
    (status = 'FULFILLED'::public.shop_purchase_status and fulfilled_at is not null)
  );

-- Purchase creation remains atomic with coin spending and always starts pending
-- physical fulfillment.
create or replace function public.purchase_shop_item(
  p_shop_item_id bigint,
  p_idempotency_key uuid
)
returns public.shop_purchases
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_child_id bigint;
  v_role public.user_role;
  v_item public.shop_items%rowtype;
  v_purchase public.shop_purchases%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;
  if p_idempotency_key is null then
    raise exception 'IDEMPOTENCY_KEY_REQUIRED';
  end if;

  select u.id, u.role
  into v_child_id, v_role
  from public.users u
  where u.auth_user_id = auth.uid();

  if v_child_id is null or v_role is distinct from 'CHILD'::public.user_role then
    raise exception 'CHILD_REQUIRED' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_child_id::text || ':' || p_idempotency_key::text, 0)
  );

  select * into v_purchase
  from public.shop_purchases
  where child_id = v_child_id
    and idempotency_key = p_idempotency_key;

  if found then
    if v_purchase.shop_item_id <> p_shop_item_id then
      raise exception 'IDEMPOTENCY_KEY_REUSED';
    end if;
    return v_purchase;
  end if;

  select * into v_item
  from public.shop_items
  where id = p_shop_item_id
  for share;

  if not found then
    raise exception 'SHOP_ITEM_NOT_FOUND';
  end if;
  if not v_item.is_active then
    raise exception 'SHOP_ITEM_NOT_ACTIVE';
  end if;
  if not exists (
    select 1
    from public.relations r
    where r.parent_id = v_item.parent_id
      and r.child_id = v_child_id
      and r.status = 'ACTIVE'::public.relation_status
  ) then
    raise exception 'SHOP_RELATION_NOT_ACTIVE' using errcode = '42501';
  end if;

  insert into public.shop_purchases (
    child_id,
    shop_item_id,
    price_paid,
    quantity,
    idempotency_key,
    status,
    fulfilled_at
  ) values (
    v_child_id,
    v_item.id,
    v_item.price,
    1,
    p_idempotency_key,
    'PURCHASED'::public.shop_purchase_status,
    null
  )
  returning * into v_purchase;

  perform public.spend_coins(
    v_child_id,
    v_item.price,
    'SHOP_PURCHASE'::public.reference_type,
    v_purchase.id,
    '상점 상품 구매'
  );

  return v_purchase;
end;
$function$;

create or replace function public.fulfill_shop_purchase(
  p_shop_purchase_id bigint
)
returns public.shop_purchases
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_parent_id bigint;
  v_role public.user_role;
  v_item_parent_id bigint;
  v_purchase public.shop_purchases%rowtype;
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

  select * into v_purchase
  from public.shop_purchases
  where id = p_shop_purchase_id
  for update;

  if not found then
    raise exception 'SHOP_PURCHASE_NOT_FOUND';
  end if;

  select si.parent_id into v_item_parent_id
  from public.shop_items si
  where si.id = v_purchase.shop_item_id;

  if v_item_parent_id is distinct from v_parent_id then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_purchase.status is distinct from 'PURCHASED'::public.shop_purchase_status then
    raise exception 'SHOP_PURCHASE_NOT_PENDING';
  end if;

  update public.shop_purchases
  set status = 'FULFILLED'::public.shop_purchase_status,
      fulfilled_at = now()
  where id = v_purchase.id
    and status = 'PURCHASED'::public.shop_purchase_status
  returning * into v_purchase;

  if not found then
    raise exception 'SHOP_PURCHASE_NOT_PENDING';
  end if;

  return v_purchase;
end;
$function$;

-- Purchase rows are immutable to clients; fulfillment is available only via RPC.
revoke insert, update, delete, truncate on table public.shop_purchases
  from public, anon, authenticated;

revoke execute on function public.purchase_shop_item(bigint, uuid)
  from public, anon, service_role;
grant execute on function public.purchase_shop_item(bigint, uuid)
  to authenticated;

revoke execute on function public.fulfill_shop_purchase(bigint)
  from public, anon, service_role;
grant execute on function public.fulfill_shop_purchase(bigint)
  to authenticated;
