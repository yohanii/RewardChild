alter table public.bank_purchases
  add column consume_lease_id uuid,
  add column consume_lease_expires_at timestamp with time zone,
  add column consume_retry_exhausted_at timestamp with time zone,
  add constraint bank_purchases_consume_lease_check check (
    (consume_lease_id is null and consume_lease_expires_at is null)
    or (consume_lease_id is not null and consume_lease_expires_at is not null)
  ),
  add constraint bank_purchases_consume_exhausted_check check (
    consume_retry_exhausted_at is null
    or (
      provider = 'GOOGLE_PLAY'::public.bank_purchase_provider
      and status = 'PAID'::public.bank_purchase_status
      and consume_status = 'FAILED'::public.google_play_consume_status
      and consume_attempt_count >= 8
    )
  );

update public.bank_purchases
set consume_retry_exhausted_at = coalesce(consume_last_attempt_at, now())
where provider = 'GOOGLE_PLAY'::public.bank_purchase_provider
  and status = 'PAID'::public.bank_purchase_status
  and consume_status = 'FAILED'::public.google_play_consume_status
  and consume_attempt_count >= 8
  and consume_retry_exhausted_at is null;

create index idx_bank_purchases_google_consume_retry
  on public.bank_purchases (
    consume_retry_exhausted_at,
    consume_lease_expires_at,
    consume_last_attempt_at
  )
  where provider = 'GOOGLE_PLAY'::public.bank_purchase_provider
    and status = 'PAID'::public.bank_purchase_status
    and consume_status in (
      'PENDING'::public.google_play_consume_status,
      'FAILED'::public.google_play_consume_status
    );

create or replace function public.claim_google_play_consume_retries(
  p_limit integer default 20,
  p_now timestamp with time zone default now()
)
returns table (
  purchase_id bigint,
  product_id text,
  purchase_token text,
  lease_id uuid,
  attempt_count integer
)
language plpgsql
security definer
set search_path to public, private, extensions
as $function$
declare
  v_lease_id uuid := gen_random_uuid();
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED' using errcode = '42501';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'INVALID_LIMIT';
  end if;
  if p_now is null then
    raise exception 'NOW_REQUIRED';
  end if;

  return query
  with candidates as (
    select bp.id
    from public.bank_purchases bp
    join private.google_play_purchase_tokens gpt
      on gpt.bank_purchase_id = bp.id
    where bp.provider = 'GOOGLE_PLAY'::public.bank_purchase_provider
      and bp.status = 'PAID'::public.bank_purchase_status
      and bp.consume_status in (
        'PENDING'::public.google_play_consume_status,
        'FAILED'::public.google_play_consume_status
      )
      and bp.consume_attempt_count < 8
      and bp.consume_retry_exhausted_at is null
      and (
        bp.consume_lease_expires_at is null
        or bp.consume_lease_expires_at <= p_now
      )
      and coalesce(bp.consume_last_attempt_at, bp.paid_at, bp.created_at)
        + case bp.consume_attempt_count
            when 0 then interval '5 minutes'
            when 1 then interval '5 minutes'
            when 2 then interval '15 minutes'
            when 3 then interval '1 hour'
            when 4 then interval '6 hours'
            else interval '12 hours'
          end <= p_now
    order by coalesce(bp.consume_last_attempt_at, bp.paid_at, bp.created_at), bp.id
    for update skip locked
    limit p_limit
  ), claimed as (
    update public.bank_purchases bp
    set consume_lease_id = v_lease_id,
        consume_lease_expires_at = p_now + interval '5 minutes'
    from candidates c
    where bp.id = c.id
    returning bp.id,
      bp.google_play_product_id_snapshot,
      bp.consume_lease_id,
      bp.consume_attempt_count
  )
  select c.id,
    c.google_play_product_id_snapshot,
    gpt.purchase_token,
    c.consume_lease_id,
    c.consume_attempt_count
  from claimed c
  join private.google_play_purchase_tokens gpt
    on gpt.bank_purchase_id = c.id;
end;
$function$;

revoke execute on function public.claim_google_play_consume_retries(integer, timestamp with time zone)
  from public, anon, authenticated;
grant execute on function public.claim_google_play_consume_retries(integer, timestamp with time zone)
  to service_role;

create or replace function public.complete_google_play_consume_retry(
  p_purchase_token text,
  p_lease_id uuid,
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
  if p_lease_id is null then
    raise exception 'LEASE_ID_REQUIRED';
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
  if v_purchase.consume_status = 'CONSUMED'::public.google_play_consume_status then
    return v_purchase;
  end if;
  if v_purchase.provider is distinct from 'GOOGLE_PLAY'::public.bank_purchase_provider
     or v_purchase.status is distinct from 'PAID'::public.bank_purchase_status then
    raise exception 'BANK_PURCHASE_NOT_RETRYABLE';
  end if;
  if v_purchase.consume_lease_id is distinct from p_lease_id then
    raise exception 'CONSUME_LEASE_LOST';
  end if;

  if p_succeeded then
    update public.bank_purchases
    set consume_status = 'CONSUMED'::public.google_play_consume_status,
        consume_attempt_count = consume_attempt_count + 1,
        consume_last_attempt_at = now(),
        consumed_at = now(),
        consume_last_error_code = null,
        consume_lease_id = null,
        consume_lease_expires_at = null,
        consume_retry_exhausted_at = null
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
        consume_last_error_code = v_error_code,
        consume_lease_id = null,
        consume_lease_expires_at = null,
        consume_retry_exhausted_at = case
          when consume_attempt_count + 1 >= 8 then now()
          else null
        end
    where id = v_purchase.id
    returning * into v_purchase;
  end if;

  return v_purchase;
end;
$function$;

revoke execute on function public.complete_google_play_consume_retry(text, uuid, boolean, text)
  from public, anon, authenticated;
grant execute on function public.complete_google_play_consume_retry(text, uuid, boolean, text)
  to service_role;

-- App-driven recovery may overlap a worker lease. A successful app recovery
-- wins and releases the lease; a failed app attempt leaves the worker lease in
-- place so another worker cannot claim the same purchase concurrently.
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
        consume_last_error_code = null,
        consume_lease_id = null,
        consume_lease_expires_at = null,
        consume_retry_exhausted_at = null
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
        consume_last_error_code = v_error_code,
        consume_retry_exhausted_at = case
          when consume_attempt_count + 1 >= 8 then now()
          else null
        end
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
