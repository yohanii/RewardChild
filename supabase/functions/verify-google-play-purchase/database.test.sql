begin;

insert into public.users (id, auth_user_id, nickname, tag, role)
values (
  990001,
  '90000000-0000-0000-0000-000000000001'::uuid,
  'BankVerifier',
  '990001',
  'PARENT'::public.user_role
);

select set_config('request.jwt.claim.role', 'service_role', true);

do $test$
declare
  v_purchase public.bank_purchases%rowtype;
  v_cash_before integer;
  v_cash_after integer;
  v_transaction_count integer;
begin
  if has_function_privilege(
    'authenticated',
    'public.create_google_play_purchase_pending(uuid,text,text)',
    'execute'
  ) then
    raise exception 'authenticated can create Google Play pending purchases';
  end if;
  if has_function_privilege(
    'authenticated',
    'public.finalize_google_play_purchase(text,text,text)',
    'execute'
  ) then
    raise exception 'authenticated can finalize Google Play purchases';
  end if;
  if has_function_privilege(
    'authenticated',
    'public.record_google_play_consume_result(text,boolean,text)',
    'execute'
  ) then
    raise exception 'authenticated can record Google Play consumption';
  end if;
  if has_table_privilege('authenticated', 'public.bank_purchases', 'update') then
    raise exception 'authenticated can update bank_purchases';
  end if;
  if has_table_privilege('authenticated', 'public.transactions', 'insert') then
    raise exception 'authenticated can insert transactions';
  end if;

  select coalesce(sum(amount), 0)::integer
  into v_cash_before
  from public.balances
  where user_id = 990001
    and type = 'CASH'::public.balance_type;

  select * into v_purchase
  from public.create_google_play_purchase_pending(
    '90000000-0000-0000-0000-000000000001'::uuid,
    'rewardchild_cash_200',
    'database-test-token'
  );

  if v_purchase.status <> 'PENDING'::public.bank_purchase_status
     or v_purchase.consume_status <> 'NOT_STARTED'::public.google_play_consume_status then
    raise exception 'pending purchase has invalid initial state';
  end if;

  select * into v_purchase
  from public.finalize_google_play_purchase(
    'database-test-token',
    'rewardchild_cash_200',
    'GPA.database-test'
  );

  if v_purchase.status <> 'PAID'::public.bank_purchase_status
     or v_purchase.consume_status <> 'PENDING'::public.google_play_consume_status then
    raise exception 'finalized purchase has invalid payment/consume state';
  end if;

  select coalesce(sum(amount), 0)::integer
  into v_cash_after
  from public.balances
  where user_id = 990001
    and type = 'CASH'::public.balance_type;

  if v_cash_after - v_cash_before <> 200 then
    raise exception 'CASH grant was %, expected 200', v_cash_after - v_cash_before;
  end if;

  select count(*) into v_transaction_count
  from public.transactions
  where type = 'BANK_PURCHASE'::public.transaction_type
    and reference_type = 'BANK_PURCHASE'::public.reference_type
    and reference_id = v_purchase.id
    and amount = 200;

  if v_transaction_count <> 1 then
    raise exception 'expected exactly one BANK_PURCHASE transaction';
  end if;

  perform public.finalize_google_play_purchase(
    'database-test-token',
    'rewardchild_cash_200',
    'GPA.database-test'
  );

  select count(*) into v_transaction_count
  from public.transactions
  where type = 'BANK_PURCHASE'::public.transaction_type
    and reference_type = 'BANK_PURCHASE'::public.reference_type
    and reference_id = v_purchase.id;

  if v_transaction_count <> 1 then
    raise exception 'repeated finalize created a duplicate transaction';
  end if;

  select * into v_purchase
  from public.record_google_play_consume_result(
    'database-test-token',
    false,
    'GOOGLE_CONSUME_HTTP_503'
  );

  if v_purchase.consume_status <> 'FAILED'::public.google_play_consume_status
     or v_purchase.consume_attempt_count <> 1 then
    raise exception 'consume failure was not tracked';
  end if;

  select * into v_purchase
  from public.record_google_play_consume_result(
    'database-test-token',
    true,
    null
  );

  if v_purchase.consume_status <> 'CONSUMED'::public.google_play_consume_status
     or v_purchase.consume_attempt_count <> 2
     or v_purchase.consumed_at is null then
    raise exception 'consume success was not tracked';
  end if;

  select * into v_purchase
  from public.record_google_play_consume_result(
    'database-test-token',
    true,
    null
  );

  if v_purchase.consume_attempt_count <> 2 then
    raise exception 'repeated consume result was not idempotent';
  end if;

  select * into v_purchase
  from public.create_google_play_purchase_pending(
    '90000000-0000-0000-0000-000000000001'::uuid,
    'rewardchild_cash_200',
    'database-rollback-token'
  );

  begin
    perform public.finalize_google_play_purchase(
      'database-rollback-token',
      'wrong_product',
      'GPA.should-not-persist'
    );
    raise exception 'mismatched product unexpectedly finalized';
  exception
    when others then
      if sqlerrm <> 'GOOGLE_PLAY_PRODUCT_MISMATCH' then
        raise;
      end if;
  end;

  select bp.* into v_purchase
  from public.bank_purchases bp
  join private.google_play_purchase_tokens token
    on token.bank_purchase_id = bp.id
  where token.purchase_token = 'database-rollback-token';

  if v_purchase.status <> 'PENDING'::public.bank_purchase_status then
    raise exception 'failed finalize left a partial PAID state';
  end if;

  if exists (
    select 1
    from public.transactions
    where type = 'BANK_PURCHASE'::public.transaction_type
      and reference_type = 'BANK_PURCHASE'::public.reference_type
      and reference_id = v_purchase.id
  ) then
    raise exception 'failed finalize left a partial transaction';
  end if;
end;
$test$;

rollback;
