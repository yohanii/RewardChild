create type public.bank_purchase_provider as enum (
  'GOOGLE_PLAY',
  'MOCK'
);

alter table public.bank_purchases
  add column provider public.bank_purchase_provider not null
    default 'GOOGLE_PLAY'::public.bank_purchase_provider;

create table private.mock_bank_purchase_keys (
  bank_purchase_id bigint primary key
    references public.bank_purchases(id) on delete restrict,
  parent_id bigint not null
    references public.users(id) on delete restrict,
  product_id text not null,
  idempotency_key text not null unique,
  created_at timestamp with time zone not null default now(),
  constraint mock_bank_purchase_keys_values_not_blank check (
    nullif(btrim(product_id), '') is not null
    and nullif(btrim(idempotency_key), '') is not null
  )
);

revoke all privileges on table private.mock_bank_purchase_keys
  from public, anon, authenticated, service_role;

-- Called only by the development-only Mock Bank Edge Function. The item
-- snapshot, paid purchase, ledger entry, and balance trigger are one transaction.
create or replace function public.create_mock_bank_purchase(
  p_parent_auth_user_id uuid,
  p_product_id text,
  p_idempotency_key text
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
  if nullif(btrim(p_product_id), '') is null then
    raise exception 'PRODUCT_ID_REQUIRED';
  end if;
  if nullif(btrim(p_idempotency_key), '') is null
     or length(p_idempotency_key) > 200 then
    raise exception 'INVALID_IDEMPOTENCY_KEY';
  end if;

  select u.id, u.role
  into v_parent_id, v_parent_role
  from public.users u
  where u.auth_user_id = p_parent_auth_user_id;

  if v_parent_id is null
     or v_parent_role is distinct from 'PARENT'::public.user_role then
    raise exception 'PARENT_REQUIRED' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('mock-bank:' || p_idempotency_key, 0)
  );

  select bp.* into v_purchase
  from private.mock_bank_purchase_keys mk
  join public.bank_purchases bp on bp.id = mk.bank_purchase_id
  where mk.idempotency_key = p_idempotency_key;

  if found then
    if v_purchase.parent_id <> v_parent_id
       or v_purchase.google_play_product_id_snapshot is distinct from p_product_id
       or v_purchase.provider is distinct from 'MOCK'::public.bank_purchase_provider then
      raise exception 'IDEMPOTENCY_KEY_REUSED';
    end if;
    return v_purchase;
  end if;

  select * into v_item
  from public.bank_items
  where google_play_product_id = p_product_id
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
    status,
    paid_at,
    consume_status,
    consumed_at,
    provider
  ) values (
    v_parent_id,
    v_item.id,
    v_item.price_krw,
    v_item.cash_amount,
    'KRW'::public.currency_unit,
    v_item.google_play_product_id,
    'PAID'::public.bank_purchase_status,
    now(),
    'CONSUMED'::public.google_play_consume_status,
    now(),
    'MOCK'::public.bank_purchase_provider
  )
  returning * into v_purchase;

  insert into private.mock_bank_purchase_keys (
    bank_purchase_id,
    parent_id,
    product_id,
    idempotency_key
  ) values (
    v_purchase.id,
    v_parent_id,
    p_product_id,
    p_idempotency_key
  );

  insert into public.transactions (
    user_id,
    type,
    amount,
    reference_type,
    reference_id,
    note
  ) values (
    v_parent_id,
    'BANK_PURCHASE'::public.transaction_type,
    v_item.cash_amount,
    'BANK_PURCHASE'::public.reference_type,
    v_purchase.id,
    '개발용 Mock 결제 CASH 지급'
  );

  return v_purchase;
end;
$function$;

revoke execute on function public.create_mock_bank_purchase(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.create_mock_bank_purchase(uuid, text, text)
  to service_role;
