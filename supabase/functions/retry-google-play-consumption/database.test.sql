begin;

insert into public.users (id, auth_user_id, nickname, tag, role)
values (
  990201,
  '92000000-0000-0000-0000-000000000001'::uuid,
  'ConsumeWorkerParent',
  '990201',
  'PARENT'
);

select set_config('request.jwt.claim.role', 'service_role', true);

select public.create_google_play_purchase_pending(
  '92000000-0000-0000-0000-000000000001', 'rewardchild_cash_200', 'retry-eligible-failed'
);
select public.finalize_google_play_purchase(
  'retry-eligible-failed', 'rewardchild_cash_200', 'GPA.retry.failed'
);
select public.record_google_play_consume_result(
  'retry-eligible-failed', false, 'GOOGLE_CONSUME_HTTP_503'
);

select public.create_google_play_purchase_pending(
  '92000000-0000-0000-0000-000000000001', 'rewardchild_cash_200', 'retry-consumed'
);
select public.finalize_google_play_purchase(
  'retry-consumed', 'rewardchild_cash_200', 'GPA.retry.consumed'
);
select public.record_google_play_consume_result('retry-consumed', true, null);

select public.create_google_play_purchase_pending(
  '92000000-0000-0000-0000-000000000001', 'rewardchild_cash_200', 'retry-payment-pending'
);

select public.create_google_play_purchase_pending(
  '92000000-0000-0000-0000-000000000001', 'rewardchild_cash_200', 'retry-backoff-not-due'
);
select public.finalize_google_play_purchase(
  'retry-backoff-not-due', 'rewardchild_cash_200', 'GPA.retry.backoff'
);
select public.record_google_play_consume_result(
  'retry-backoff-not-due', false, 'GOOGLE_CONSUME_HTTP_503'
);

select public.create_google_play_purchase_pending(
  '92000000-0000-0000-0000-000000000001', 'rewardchild_cash_200', 'retry-stale-pending'
);
select public.finalize_google_play_purchase(
  'retry-stale-pending', 'rewardchild_cash_200', 'GPA.retry.stale'
);

select public.create_google_play_purchase_pending(
  '92000000-0000-0000-0000-000000000001', 'rewardchild_cash_200', 'retry-app-overlap'
);
select public.finalize_google_play_purchase(
  'retry-app-overlap', 'rewardchild_cash_200', 'GPA.retry.overlap'
);

select public.create_google_play_purchase_pending(
  '92000000-0000-0000-0000-000000000001', 'rewardchild_cash_200', 'retry-exhausted'
);
select public.finalize_google_play_purchase(
  'retry-exhausted', 'rewardchild_cash_200', 'GPA.retry.exhausted'
);

update public.bank_purchases bp
set consume_last_attempt_at = now() - interval '6 minutes'
from private.google_play_purchase_tokens gpt
where gpt.bank_purchase_id = bp.id
  and gpt.purchase_token = 'retry-eligible-failed';

update public.bank_purchases bp
set paid_at = now() - interval '6 minutes'
from private.google_play_purchase_tokens gpt
where gpt.bank_purchase_id = bp.id
  and gpt.purchase_token in ('retry-stale-pending', 'retry-app-overlap');

update public.bank_purchases bp
set consume_status = 'FAILED',
    consume_attempt_count = 7,
    consume_last_attempt_at = now() - interval '13 hours',
    consume_last_error_code = 'GOOGLE_CONSUME_HTTP_503'
from private.google_play_purchase_tokens gpt
where gpt.bank_purchase_id = bp.id
  and gpt.purchase_token = 'retry-exhausted';

create temporary table first_claim as
select * from public.claim_google_play_consume_retries(20, now());

do $test$
declare
  v_failed_lease uuid;
  v_pending_lease uuid;
  v_overlap_lease uuid;
  v_exhausted_lease uuid;
  v_transaction_count bigint;
  v_cash integer;
  v_purchase public.bank_purchases%rowtype;
begin
  if has_function_privilege(
    'authenticated',
    'public.claim_google_play_consume_retries(integer,timestamp with time zone)',
    'execute'
  ) or has_function_privilege(
    'authenticated',
    'public.complete_google_play_consume_retry(text,uuid,boolean,text)',
    'execute'
  ) then
    raise exception 'authenticated can execute consume worker RPCs';
  end if;

  if exists (
    select 1 from first_claim
    where purchase_token in ('retry-consumed', 'retry-payment-pending', 'retry-backoff-not-due')
  ) then
    raise exception 'ineligible purchase was claimed';
  end if;

  select lease_id into v_failed_lease from first_claim
  where purchase_token = 'retry-eligible-failed';
  select lease_id into v_pending_lease from first_claim
  where purchase_token = 'retry-stale-pending';
  select lease_id into v_overlap_lease from first_claim
  where purchase_token = 'retry-app-overlap';
  select lease_id into v_exhausted_lease from first_claim
  where purchase_token = 'retry-exhausted';

  if v_failed_lease is null or v_pending_lease is null
     or v_overlap_lease is null or v_exhausted_lease is null then
    raise exception 'eligible purchase was not claimed';
  end if;

  if exists (select 1 from public.claim_google_play_consume_retries(20, now())) then
    raise exception 'second worker claimed an actively leased purchase';
  end if;

  select count(*) into v_transaction_count
  from public.transactions
  where user_id = 990201 and type = 'BANK_PURCHASE';
  select amount into v_cash from public.balances
  where user_id = 990201 and type = 'CASH';

  select * into v_purchase from public.complete_google_play_consume_retry(
    'retry-eligible-failed', v_failed_lease, false, 'GOOGLE_CONSUME_HTTP_503'
  );
  if v_purchase.consume_status <> 'FAILED'
     or v_purchase.consume_attempt_count <> 2
     or v_purchase.consume_last_attempt_at is null then
    raise exception 'worker failure was not recorded';
  end if;

  select * into v_purchase from public.complete_google_play_consume_retry(
    'retry-stale-pending', v_pending_lease, true, null
  );
  if v_purchase.consume_status <> 'CONSUMED' or v_purchase.consumed_at is null then
    raise exception 'worker success was not recorded';
  end if;

  perform public.record_google_play_consume_result('retry-app-overlap', true, null);
  select * into v_purchase from public.complete_google_play_consume_retry(
    'retry-app-overlap', v_overlap_lease, false, 'STALE_WORKER_RESULT'
  );
  if v_purchase.consume_status <> 'CONSUMED' then
    raise exception 'stale worker overwrote app consume success';
  end if;

  select * into v_purchase from public.complete_google_play_consume_retry(
    'retry-exhausted', v_exhausted_lease, false, 'GOOGLE_CONSUME_HTTP_503'
  );
  if v_purchase.consume_attempt_count <> 8
     or v_purchase.consume_retry_exhausted_at is null then
    raise exception 'maximum retry exhaustion was not recorded';
  end if;

  if (select count(*) from public.transactions
      where user_id = 990201 and type = 'BANK_PURCHASE') <> v_transaction_count
     or (select amount from public.balances
         where user_id = 990201 and type = 'CASH') <> v_cash then
    raise exception 'consume retry changed CASH or transactions';
  end if;

  if exists (
    select 1 from public.claim_google_play_consume_retries(
      20,
      now() + interval '14 minutes'
    ) where purchase_token = 'retry-eligible-failed'
  ) then
    raise exception '15-minute backoff was ignored';
  end if;

  if not exists (
    select 1 from public.claim_google_play_consume_retries(
      20,
      now() + interval '16 minutes'
    ) where purchase_token = 'retry-eligible-failed'
  ) then
    raise exception 'purchase was not retryable after backoff';
  end if;
end;
$test$;

rollback;
