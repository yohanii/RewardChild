begin;

insert into public.users (id, auth_user_id, nickname, tag, role)
values
  (990101, '91000000-0000-0000-0000-000000000001'::uuid, 'MockParent', '990101', 'PARENT'),
  (990102, '91000000-0000-0000-0000-000000000002'::uuid, 'MockChild', '990102', 'CHILD');

select set_config('request.jwt.claim.role', 'service_role', true);

do $test$
declare
  v_purchase public.bank_purchases%rowtype;
  v_replayed_purchase public.bank_purchases%rowtype;
  v_balance_before integer;
  v_balance_after integer;
  v_purchase_count_before bigint;
  v_transaction_count_before bigint;
  v_expected_cash integer;
  v_product_id text;
  v_key text;
begin
  if has_function_privilege(
    'authenticated',
    'public.create_mock_bank_purchase(uuid,text,text)',
    'execute'
  ) then
    raise exception 'authenticated can execute create_mock_bank_purchase';
  end if;

  if position(
    'cash' in lower(pg_get_function_arguments(
      'public.create_mock_bank_purchase(uuid,text,text)'::regprocedure
    ))
  ) > 0 then
    raise exception 'Mock RPC accepts a client-provided CASH argument';
  end if;

  select coalesce(amount, 0) into v_balance_before
  from public.balances
  where user_id = 990101 and type = 'CASH';
  v_balance_before := coalesce(v_balance_before, 0);

  for v_product_id, v_expected_cash in
    values
      ('rewardchild_cash_200', 200),
      ('rewardchild_cash_660', 660),
      ('rewardchild_cash_1200', 1200)
  loop
    v_key := 'mock-db-test-' || v_product_id;

    select * into v_purchase
    from public.create_mock_bank_purchase(
      '91000000-0000-0000-0000-000000000001'::uuid,
      v_product_id,
      v_key
    );

    if v_purchase.cash_granted <> v_expected_cash
       or v_purchase.status <> 'PAID'
       or v_purchase.provider <> 'MOCK'
       or v_purchase.consume_status <> 'CONSUMED' then
      raise exception 'invalid Mock purchase for %', v_product_id;
    end if;

    if v_purchase.cash_granted is distinct from (
      select cash_amount from public.bank_items
      where google_play_product_id = v_product_id and is_active
    ) then
      raise exception 'Mock grant does not match bank_items.cash_amount';
    end if;

    select * into v_replayed_purchase
    from public.create_mock_bank_purchase(
      '91000000-0000-0000-0000-000000000001'::uuid,
      v_product_id,
      v_key
    );

    if v_replayed_purchase.id <> v_purchase.id then
      raise exception 'idempotency replay created another purchase';
    end if;

    if (select count(*) from public.transactions
        where type = 'BANK_PURCHASE'
          and reference_type = 'BANK_PURCHASE'
          and reference_id = v_purchase.id) <> 1 then
      raise exception 'Mock purchase did not create exactly one transaction';
    end if;
  end loop;

  select amount into v_balance_after
  from public.balances
  where user_id = 990101 and type = 'CASH';

  if v_balance_after - v_balance_before <> 2060 then
    raise exception 'Mock CASH total was %, expected 2060', v_balance_after - v_balance_before;
  end if;

  begin
    perform public.create_mock_bank_purchase(
      '91000000-0000-0000-0000-000000000002'::uuid,
      'rewardchild_cash_200',
      'mock-child-key'
    );
    raise exception 'CHILD Mock purchase unexpectedly succeeded';
  exception when insufficient_privilege then
    if sqlerrm <> 'PARENT_REQUIRED' then raise; end if;
  end;

  select count(*) into v_purchase_count_before from public.bank_purchases;
  select count(*) into v_transaction_count_before from public.transactions;

  begin
    perform public.create_mock_bank_purchase(
      '91000000-0000-0000-0000-000000000001'::uuid,
      'not-an-active-product',
      'mock-failure-key'
    );
    raise exception 'inactive Mock product unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'BANK_ITEM_NOT_ACTIVE' then raise; end if;
  end;

  if (select count(*) from public.bank_purchases) <> v_purchase_count_before
     or (select count(*) from public.transactions) <> v_transaction_count_before then
    raise exception 'failed Mock purchase left partial records';
  end if;

  if exists (
    select 1 from private.mock_bank_purchase_keys
    where idempotency_key in ('mock-child-key', 'mock-failure-key')
  ) then
    raise exception 'failed Mock purchase left an idempotency record';
  end if;
end;
$test$;

create function pg_temp.reject_mock_bank_transaction()
returns trigger
language plpgsql
as $function$
begin
  if new.note = '개발용 Mock 결제 CASH 지급' then
    raise exception 'FORCED_TRANSACTION_FAILURE';
  end if;
  return new;
end;
$function$;

create trigger test_reject_mock_bank_transaction
before insert on public.transactions
for each row
execute function pg_temp.reject_mock_bank_transaction();

do $test_atomic_failure$
declare
  v_purchase_count_before bigint;
  v_transaction_count_before bigint;
  v_balance_before integer;
begin
  select count(*) into v_purchase_count_before from public.bank_purchases;
  select count(*) into v_transaction_count_before from public.transactions;
  select coalesce(amount, 0) into v_balance_before
  from public.balances where user_id = 990101 and type = 'CASH';
  v_balance_before := coalesce(v_balance_before, 0);

  begin
    perform public.create_mock_bank_purchase(
      '91000000-0000-0000-0000-000000000001'::uuid,
      'rewardchild_cash_200',
      'mock-forced-mid-transaction-failure'
    );
    raise exception 'forced transaction failure unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'FORCED_TRANSACTION_FAILURE' then raise; end if;
  end;

  if (select count(*) from public.bank_purchases) <> v_purchase_count_before
     or (select count(*) from public.transactions) <> v_transaction_count_before
     or (select coalesce(amount, 0) from public.balances
         where user_id = 990101 and type = 'CASH') <> v_balance_before
     or exists (
       select 1 from private.mock_bank_purchase_keys
       where idempotency_key = 'mock-forced-mid-transaction-failure'
     ) then
    raise exception 'mid-transaction failure left partial Mock purchase state';
  end if;
end;
$test_atomic_failure$;

rollback;
