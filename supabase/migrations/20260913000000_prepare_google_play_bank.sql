create type public.bank_purchase_status as enum (
  'PENDING',
  'PAID',
  'CANCELLED',
  'REFUNDED'
);

alter table public.bank_items
  rename column price to price_krw;

alter table public.bank_items
  add column google_play_product_id text,
  add column cash_amount integer not null default 0,
  add column is_active boolean not null default false,
  add column sort_order integer not null default 0;

update public.bank_items
set currency = 'KRW'::public.currency_unit
where currency is null;

alter table public.bank_items
  alter column currency set default 'KRW'::public.currency_unit,
  alter column currency set not null,
  add constraint bank_items_active_configuration_check check (
    not is_active
    or (
      google_play_product_id is not null
      and nullif(btrim(google_play_product_id), '') is not null
      and price_krw > 0
      and cash_amount > 0
      and currency = 'KRW'::public.currency_unit
    )
  ) not valid;

create unique index ux_bank_items_google_play_product_id
  on public.bank_items (google_play_product_id)
  where google_play_product_id is not null;

insert into public.bank_items (
  parent_id,
  google_play_product_id,
  title,
  content,
  price_krw,
  cash_amount,
  currency,
  is_active,
  sort_order
) values
  (
    null,
    'rewardchild_cash_200',
    'CASH 200',
    'Google Play에서 1,000원에 구매하는 CASH 상품',
    1000,
    200,
    'KRW'::public.currency_unit,
    true,
    10
  ),
  (
    null,
    'rewardchild_cash_660',
    'CASH 660',
    'Google Play에서 3,000원에 구매하는 CASH 상품',
    3000,
    660,
    'KRW'::public.currency_unit,
    true,
    20
  ),
  (
    null,
    'rewardchild_cash_1200',
    'CASH 1,200',
    'Google Play에서 5,000원에 구매하는 CASH 상품',
    5000,
    1200,
    'KRW'::public.currency_unit,
    true,
    30
  )
on conflict (google_play_product_id)
  where google_play_product_id is not null
do update set
  parent_id = excluded.parent_id,
  title = excluded.title,
  content = excluded.content,
  price_krw = excluded.price_krw,
  cash_amount = excluded.cash_amount,
  currency = excluded.currency,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

alter table public.bank_items
  validate constraint bank_items_active_configuration_check;

alter table public.bank_purchases
  rename column amount to price_krw_snapshot;

alter table public.bank_purchases
  rename column coins_granted to cash_granted;

alter table public.bank_purchases
  add column google_play_product_id_snapshot text,
  add column google_order_id text,
  add column status public.bank_purchase_status not null
    default 'PENDING'::public.bank_purchase_status,
  add column paid_at timestamp with time zone,
  add column cancelled_at timestamp with time zone,
  add column refunded_at timestamp with time zone;

update public.bank_purchases
set currency = 'KRW'::public.currency_unit
where currency is null;

alter table public.bank_purchases
  alter column currency set default 'KRW'::public.currency_unit,
  alter column currency set not null,
  -- Legacy rows have no Google snapshot. New and changed rows are still checked.
  add constraint bank_purchases_snapshot_check check (
    price_krw_snapshot > 0
    and cash_granted > 0
    and currency = 'KRW'::public.currency_unit
    and google_play_product_id_snapshot is not null
    and nullif(btrim(google_play_product_id_snapshot), '') is not null
  ) not valid,
  add constraint bank_purchases_status_timestamps_check check (
    (
      status = 'PENDING'::public.bank_purchase_status
      and paid_at is null
      and cancelled_at is null
      and refunded_at is null
    )
    or (
      status = 'PAID'::public.bank_purchase_status
      and paid_at is not null
      and cancelled_at is null
      and refunded_at is null
    )
    or (
      status = 'CANCELLED'::public.bank_purchase_status
      and paid_at is null
      and cancelled_at is not null
      and refunded_at is null
    )
    or (
      status = 'REFUNDED'::public.bank_purchase_status
      and paid_at is not null
      and cancelled_at is null
      and refunded_at is not null
    )
  );

create unique index ux_bank_purchases_google_order_id
  on public.bank_purchases (google_order_id)
  where google_order_id is not null;

drop policy if exists "Everyone can view bank items" on public.bank_items;
drop policy if exists "Only service_role can modify bank items" on public.bank_items;

create policy "bank_items_select_active_parent_only"
on public.bank_items
for select
to authenticated
using (
  is_active
  and exists (
    select 1
    from public.users u
    where u.auth_user_id = auth.uid()
      and u.role = 'PARENT'::public.user_role
  )
);

create policy "bank_purchases_select_own_parent_only"
on public.bank_purchases
for select
to authenticated
using (
  parent_id = public.uid_to_user_id(auth.uid())
  and exists (
    select 1
    from public.users u
    where u.id = bank_purchases.parent_id
      and u.role = 'PARENT'::public.user_role
  )
);

revoke all privileges on table public.bank_items
  from public, anon, authenticated;
grant select on table public.bank_items to authenticated;
revoke select, update, usage on sequence public.bank_items_id_seq
  from anon, authenticated;

revoke all privileges on table public.bank_purchases
  from public, anon, authenticated;
grant select on table public.bank_purchases to authenticated;
revoke select, update, usage on sequence public.bank_purchases_id_seq
  from anon, authenticated;

alter table public.bank_purchases
  drop constraint fk_bank_purchases_parent;

alter table public.bank_purchases
  add constraint fk_bank_purchases_parent
    foreign key (parent_id)
    references public.users(id)
    on delete restrict;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;

create table private.google_play_purchase_tokens (
  bank_purchase_id bigint primary key
    references public.bank_purchases(id) on delete restrict,
  purchase_token text not null unique,
  created_at timestamp with time zone not null default now(),
  constraint google_play_purchase_tokens_not_blank check (
    nullif(btrim(purchase_token), '') is not null
  )
);

revoke all privileges on table private.google_play_purchase_tokens
  from public, anon, authenticated, service_role;

create unique index ux_transactions_bank_purchase_reference
  on public.transactions (reference_id)
  where type = 'BANK_PURCHASE'::public.transaction_type
    and reference_type = 'BANK_PURCHASE'::public.reference_type
    and reference_id is not null;

-- Called by a trusted verification server before contacting Google Play.
-- This records no balance transaction and grants no CASH.
create or replace function public.create_google_play_purchase_pending(
  p_parent_auth_user_id uuid,
  p_google_play_product_id text,
  p_purchase_token text
)
returns public.bank_purchases
language plpgsql
security definer
set search_path to public, private
as $function$
declare
  v_parent_id bigint;
  v_parent_role public.user_role;
  v_item public.bank_items%rowtype;
  v_purchase public.bank_purchases%rowtype;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED' using errcode = '42501';
  end if;
  if p_parent_auth_user_id is null then
    raise exception 'PARENT_AUTH_USER_ID_REQUIRED';
  end if;
  if nullif(btrim(p_google_play_product_id), '') is null then
    raise exception 'GOOGLE_PLAY_PRODUCT_ID_REQUIRED';
  end if;
  if nullif(btrim(p_purchase_token), '') is null then
    raise exception 'PURCHASE_TOKEN_REQUIRED';
  end if;

  select u.id, u.role
  into v_parent_id, v_parent_role
  from public.users u
  where u.auth_user_id = p_parent_auth_user_id;

  if v_parent_id is null
     or v_parent_role is distinct from 'PARENT'::public.user_role then
    raise exception 'PARENT_REQUIRED' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_purchase_token, 0));

  select bp.* into v_purchase
  from private.google_play_purchase_tokens gpt
  join public.bank_purchases bp on bp.id = gpt.bank_purchase_id
  where gpt.purchase_token = p_purchase_token;

  if found then
    if v_purchase.parent_id <> v_parent_id
       or v_purchase.google_play_product_id_snapshot
          is distinct from p_google_play_product_id then
      raise exception 'PURCHASE_TOKEN_REUSED';
    end if;
    return v_purchase;
  end if;

  select * into v_item
  from public.bank_items
  where google_play_product_id = p_google_play_product_id
    and is_active
  for share;

  if not found then
    raise exception 'BANK_ITEM_NOT_ACTIVE';
  end if;

  insert into public.bank_purchases (
    parent_id,
    bank_item_id,
    price_krw_snapshot,
    cash_granted,
    currency,
    google_play_product_id_snapshot,
    status
  ) values (
    v_parent_id,
    v_item.id,
    v_item.price_krw,
    v_item.cash_amount,
    'KRW'::public.currency_unit,
    v_item.google_play_product_id,
    'PENDING'::public.bank_purchase_status
  )
  returning * into v_purchase;

  insert into private.google_play_purchase_tokens (
    bank_purchase_id,
    purchase_token
  ) values (
    v_purchase.id,
    p_purchase_token
  );

  return v_purchase;
end;
$function$;

-- Called only after a trusted server has verified the token and product with
-- Google Play. PAID transition, ledger insert, and CASH balance update are one
-- database transaction.
create or replace function public.finalize_google_play_purchase(
  p_purchase_token text,
  p_verified_google_play_product_id text,
  p_google_order_id text default null
)
returns public.bank_purchases
language plpgsql
security definer
set search_path to public, private
as $function$
declare
  v_purchase public.bank_purchases%rowtype;
  v_order_id text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED' using errcode = '42501';
  end if;
  if nullif(btrim(p_purchase_token), '') is null then
    raise exception 'PURCHASE_TOKEN_REQUIRED';
  end if;
  if nullif(btrim(p_verified_google_play_product_id), '') is null then
    raise exception 'VERIFIED_GOOGLE_PLAY_PRODUCT_ID_REQUIRED';
  end if;

  v_order_id := nullif(btrim(p_google_order_id), '');
  perform pg_advisory_xact_lock(hashtextextended(p_purchase_token, 0));

  select bp.* into v_purchase
  from private.google_play_purchase_tokens gpt
  join public.bank_purchases bp on bp.id = gpt.bank_purchase_id
  where gpt.purchase_token = p_purchase_token
  for update of bp;

  if not found then
    raise exception 'BANK_PURCHASE_NOT_FOUND';
  end if;
  if v_purchase.google_play_product_id_snapshot
     is distinct from p_verified_google_play_product_id then
    raise exception 'GOOGLE_PLAY_PRODUCT_MISMATCH';
  end if;

  if v_purchase.status = 'PAID'::public.bank_purchase_status then
    if v_purchase.google_order_id is not null
       and v_order_id is not null
       and v_purchase.google_order_id <> v_order_id then
      raise exception 'GOOGLE_ORDER_ID_MISMATCH';
    end if;
    return v_purchase;
  end if;

  if v_purchase.status is distinct from 'PENDING'::public.bank_purchase_status then
    raise exception 'BANK_PURCHASE_NOT_PENDING';
  end if;

  update public.bank_purchases
  set status = 'PAID'::public.bank_purchase_status,
      google_order_id = v_order_id,
      paid_at = now()
  where id = v_purchase.id
    and status = 'PENDING'::public.bank_purchase_status
  returning * into v_purchase;

  if not found then
    raise exception 'BANK_PURCHASE_NOT_PENDING';
  end if;

  insert into public.transactions (
    user_id,
    type,
    amount,
    reference_type,
    reference_id,
    note
  ) values (
    v_purchase.parent_id,
    'BANK_PURCHASE'::public.transaction_type,
    v_purchase.cash_granted,
    'BANK_PURCHASE'::public.reference_type,
    v_purchase.id,
    'Google Play 결제 CASH 지급'
  );

  return v_purchase;
end;
$function$;

revoke execute on function public.create_google_play_purchase_pending(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.create_google_play_purchase_pending(uuid, text, text)
  to service_role;

revoke execute on function public.finalize_google_play_purchase(text, text, text)
  from public, anon, authenticated;
grant execute on function public.finalize_google_play_purchase(text, text, text)
  to service_role;
