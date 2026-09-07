-- Existing rows predate request idempotency, so the new key remains nullable.
alter table public.shop_purchases
  add column idempotency_key uuid;

create unique index ux_shop_purchases_child_idempotency_key
  on public.shop_purchases (child_id, idempotency_key)
  where idempotency_key is not null;

create index idx_shop_purchases_shop_item_id
  on public.shop_purchases (shop_item_id);

create policy "shop_purchases_select_family"
on public.shop_purchases
for select
to authenticated
using (
  child_id = public.uid_to_user_id(auth.uid())
  or exists (
    select 1
    from public.shop_items si
    join public.relations r
      on r.parent_id = si.parent_id
     and r.child_id = shop_purchases.child_id
    where si.id = shop_purchases.shop_item_id
      and si.parent_id = public.uid_to_user_id(auth.uid())
      and r.status in (
        'ACTIVE'::public.relation_status,
        'BLOCKED'::public.relation_status
      )
  )
);

revoke all privileges on table public.shop_purchases
  from public, anon, authenticated;
grant select on table public.shop_purchases to authenticated;
revoke select, update, usage on sequence public.shop_purchases_id_seq
  from anon, authenticated;

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

  -- Serialize retries of the same logical request before checking its result.
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
    idempotency_key
  ) values (
    v_child_id,
    v_item.id,
    v_item.price,
    1,
    p_idempotency_key
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

revoke execute on function public.purchase_shop_item(bigint, uuid)
  from public, anon, service_role;
grant execute on function public.purchase_shop_item(bigint, uuid)
  to authenticated;
