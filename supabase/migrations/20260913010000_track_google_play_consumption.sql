create type public.google_play_consume_status as enum (
  'NOT_STARTED',
  'PENDING',
  'FAILED',
  'CONSUMED'
);

alter table public.bank_purchases
  add column consume_status public.google_play_consume_status not null
    default 'NOT_STARTED'::public.google_play_consume_status,
  add column consume_attempt_count integer not null default 0,
  add column consume_last_attempt_at timestamp with time zone,
  add column consumed_at timestamp with time zone,
  add column consume_last_error_code text,
  add constraint bank_purchases_consume_attempt_count_check check (
    consume_attempt_count >= 0
  ),
  add constraint bank_purchases_consume_state_check check (
    (
      consume_status = 'CONSUMED'::public.google_play_consume_status
      and consumed_at is not null
      and consume_last_error_code is null
    )
    or (
      consume_status = 'FAILED'::public.google_play_consume_status
      and consumed_at is null
      and nullif(btrim(consume_last_error_code), '') is not null
    )
    or (
      consume_status in (
        'NOT_STARTED'::public.google_play_consume_status,
        'PENDING'::public.google_play_consume_status
      )
      and consumed_at is null
      and consume_last_error_code is null
    )
  ),
  add constraint bank_purchases_payment_consume_state_check check (
    (
      status = 'PAID'::public.bank_purchase_status
      and consume_status <> 'NOT_STARTED'::public.google_play_consume_status
    )
    or status = 'REFUNDED'::public.bank_purchase_status
    or (
      status in (
        'PENDING'::public.bank_purchase_status,
        'CANCELLED'::public.bank_purchase_status
      )
      and consume_status = 'NOT_STARTED'::public.google_play_consume_status
    )
  ) not valid;

-- Any PAID rows created before this migration still need consumption tracking.
update public.bank_purchases
set consume_status = 'PENDING'::public.google_play_consume_status
where status = 'PAID'::public.bank_purchase_status;

alter table public.bank_purchases
  validate constraint bank_purchases_payment_consume_state_check;

create or replace function public.prepare_bank_purchase_consumption()
returns trigger
language plpgsql
security definer
set search_path to public
as $function$
begin
  if old.status is distinct from 'PAID'::public.bank_purchase_status
     and new.status = 'PAID'::public.bank_purchase_status then
    new.consume_status := 'PENDING'::public.google_play_consume_status;
    new.consume_attempt_count := 0;
    new.consume_last_attempt_at := null;
    new.consumed_at := null;
    new.consume_last_error_code := null;
  end if;

  return new;
end;
$function$;

create trigger trg_prepare_bank_purchase_consumption
before update of status on public.bank_purchases
for each row
execute function public.prepare_bank_purchase_consumption();

revoke execute on function public.prepare_bank_purchase_consumption()
  from public, anon, authenticated, service_role;

create or replace function public.record_google_play_consume_result(
  p_purchase_token text,
  p_succeeded boolean,
  p_error_code text default null
)
returns public.bank_purchases
language plpgsql
security definer
set search_path to public, private
as $function$
declare
  v_purchase public.bank_purchases%rowtype;
  v_error_code text;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED' using errcode = '42501';
  end if;
  if nullif(btrim(p_purchase_token), '') is null then
    raise exception 'PURCHASE_TOKEN_REQUIRED';
  end if;
  if p_succeeded is null then
    raise exception 'CONSUME_RESULT_REQUIRED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_purchase_token, 0));

  select bp.* into v_purchase
  from private.google_play_purchase_tokens gpt
  join public.bank_purchases bp on bp.id = gpt.bank_purchase_id
  where gpt.purchase_token = p_purchase_token
  for update of bp;

  if not found then
    raise exception 'BANK_PURCHASE_NOT_FOUND';
  end if;
  if v_purchase.status is distinct from 'PAID'::public.bank_purchase_status then
    raise exception 'BANK_PURCHASE_NOT_PAID';
  end if;
  if v_purchase.consume_status = 'CONSUMED'::public.google_play_consume_status then
    return v_purchase;
  end if;

  if p_succeeded then
    update public.bank_purchases
    set consume_status = 'CONSUMED'::public.google_play_consume_status,
        consume_attempt_count = consume_attempt_count + 1,
        consume_last_attempt_at = now(),
        consumed_at = now(),
        consume_last_error_code = null
    where id = v_purchase.id
    returning * into v_purchase;
  else
    v_error_code := coalesce(
      nullif(left(btrim(p_error_code), 100), ''),
      'GOOGLE_CONSUME_FAILED'
    );

    update public.bank_purchases
    set consume_status = 'FAILED'::public.google_play_consume_status,
        consume_attempt_count = consume_attempt_count + 1,
        consume_last_attempt_at = now(),
        consumed_at = null,
        consume_last_error_code = v_error_code
    where id = v_purchase.id
    returning * into v_purchase;
  end if;

  return v_purchase;
end;
$function$;

revoke execute on function public.record_google_play_consume_result(text, boolean, text)
  from public, anon, authenticated;
grant execute on function public.record_google_play_consume_result(text, boolean, text)
  to service_role;
