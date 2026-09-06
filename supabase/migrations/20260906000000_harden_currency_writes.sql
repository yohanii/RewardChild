-- Currency balances and their transaction ledger are server-managed.
drop policy if exists "balances_insert_policy" on public.balances;
drop policy if exists "balances_update_policy" on public.balances;
drop policy if exists "transactions_insert_policy" on public.transactions;

revoke insert, update, delete, truncate on table public.balances from anon, authenticated;
revoke insert, update, delete, truncate on table public.transactions from anon, authenticated;

-- These trigger functions must retain write access after client DML is revoked.
alter function public.apply_transaction_to_balance() security definer;
alter function public.apply_transaction_to_balance() set search_path to public;

alter function public.create_initial_credit_tx() security definer;
alter function public.create_initial_credit_tx() set search_path to public;

alter function public.apply_initial_credit_on_role_change() security definer;
alter function public.apply_initial_credit_on_role_change() set search_path to public;

revoke execute on function public.apply_transaction_to_balance()
  from public, anon, authenticated;
revoke execute on function public.create_initial_credit_tx()
  from public, anon, authenticated;
revoke execute on function public.apply_initial_credit_on_role_change()
  from public, anon, authenticated;

create or replace function public.spend_coins(
  p_user_id bigint,
  p_amount integer,
  p_reference_type public.reference_type default null::public.reference_type,
  p_reference_id bigint default null::bigint,
  p_note text default null::text
)
returns void
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_att integer;
  v_cash integer;
  v_total integer;
  v_use_att integer;
  v_use_cash integer;
begin
  if auth.role() is distinct from 'service_role'
     and public.uid_to_user_id(auth.uid()) is distinct from p_user_id then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'p_amount must be a positive integer';
  end if;

  select amount into v_att
  from public.balances
  where user_id = p_user_id and type = 'ATTENDANCE';

  v_att := coalesce(v_att, 0);

  select amount into v_cash
  from public.balances
  where user_id = p_user_id and type = 'CASH';

  v_cash := coalesce(v_cash, 0);
  v_total := v_att + v_cash;

  if v_total < p_amount then
    raise exception 'INSUFFICIENT_FUNDS: available %, required %', v_total, p_amount
      using errcode = 'P0001';
  end if;

  v_use_att := least(v_att, p_amount);
  v_use_cash := p_amount - v_use_att;

  if v_use_att > 0 then
    insert into public.transactions (
      user_id, type, amount, reference_type, reference_id, note
    ) values (
      p_user_id,
      'SPEND_ATTENDANCE',
      -v_use_att,
      p_reference_type,
      p_reference_id,
      coalesce(p_note, 'Spend from ATTENDANCE bucket')
    );
  end if;

  if v_use_cash > 0 then
    insert into public.transactions (
      user_id, type, amount, reference_type, reference_id, note
    ) values (
      p_user_id,
      'SPEND_CASH',
      -v_use_cash,
      p_reference_type,
      p_reference_id,
      coalesce(p_note, 'Spend from CASH bucket')
    );
  end if;
end;
$function$;

create or replace function public.give_attendance(
  p_user_id bigint,
  p_cap integer default 200
)
returns integer
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_role text;
  v_current_att integer;
  v_delta integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  select role into v_role
  from public.users
  where id = p_user_id;

  if v_role is distinct from 'PARENT' then
    return 0;
  end if;

  select amount into v_current_att
  from public.balances
  where user_id = p_user_id and type = 'ATTENDANCE';

  v_current_att := coalesce(v_current_att, 0);
  v_delta := p_cap - v_current_att;

  if v_delta <= 0 then
    return 0;
  end if;

  insert into public.transactions (
    user_id, type, amount, reference_type, reference_id, note
  ) values (
    p_user_id,
    'ATTENDANCE_REWARD',
    v_delta,
    null,
    null,
    'Daily attendance top-up'
  );

  return v_delta;
end;
$function$;

revoke execute on function public.spend_coins(bigint, integer, public.reference_type, bigint, text)
  from public, anon;
grant execute on function public.spend_coins(bigint, integer, public.reference_type, bigint, text)
  to authenticated, service_role;

revoke execute on function public.give_attendance(bigint, integer)
  from public, anon, authenticated;
grant execute on function public.give_attendance(bigint, integer)
  to service_role;
