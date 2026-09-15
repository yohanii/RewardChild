begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

insert into public.users (id, auth_user_id, nickname, tag, role)
values
  (960001, '96000000-0000-0000-0000-000000000001', 'AttendanceZero', '960001', 'PARENT'),
  (960002, '96000000-0000-0000-0000-000000000002', 'AttendanceEighty', '960002', 'PARENT'),
  (960003, '96000000-0000-0000-0000-000000000003', 'AttendanceFull', '960003', 'PARENT'),
  (960004, '96000000-0000-0000-0000-000000000004', 'AttendanceTomorrow', '960004', 'PARENT'),
  (960005, '96000000-0000-0000-0000-000000000005', 'AttendanceFailure', '960005', 'PARENT'),
  (960006, '96000000-0000-0000-0000-000000000006', 'AttendanceChild', '960006', 'CHILD');

insert into public.transactions (user_id, type, amount, note)
values
  (960001, 'SPEND_ATTENDANCE', -200, 'attendance test setup'),
  (960002, 'SPEND_ATTENDANCE', -120, 'attendance test setup'),
  (960004, 'SPEND_ATTENDANCE', -200, 'attendance test setup'),
  (960005, 'SPEND_ATTENDANCE', -200, 'attendance test setup');

do $test$
declare
  v_granted integer;
  v_today date := (statement_timestamp() at time zone 'Asia/Seoul')::date;
begin
  if has_function_privilege('anon', 'public.claim_daily_attendance()', 'execute')
     or has_function_privilege('service_role', 'public.claim_daily_attendance()', 'execute')
     or not has_function_privilege('authenticated', 'public.claim_daily_attendance()', 'execute') then
    raise exception 'daily attendance RPC grants are incorrect';
  end if;

  if has_function_privilege(
    'service_role',
    'public.give_attendance(bigint,integer)',
    'execute'
  ) then
    raise exception 'legacy give_attendance remains externally executable';
  end if;

  if has_table_privilege('authenticated', 'public.attendance_claims', 'select')
     or has_table_privilege('authenticated', 'public.attendance_claims', 'insert') then
    raise exception 'authenticated can access attendance claim records directly';
  end if;

  if pg_get_function_arguments('public.claim_daily_attendance()'::regprocedure) <> '' then
    raise exception 'daily attendance RPC accepts client input';
  end if;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"96000000-0000-0000-0000-000000000001","role":"anon"}',
    true
  );
  begin
    perform public.claim_daily_attendance();
    raise exception 'unauthenticated attendance claim unexpectedly succeeded';
  exception when insufficient_privilege then
    if sqlerrm <> 'AUTHENTICATION_REQUIRED' then raise; end if;
  end;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"96000000-0000-0000-0000-000000000001","role":"authenticated"}',
    true
  );
  v_granted := public.claim_daily_attendance();

  if v_granted <> 200
     or (select amount from public.balances where user_id = 960001 and type = 'ATTENDANCE') <> 200
     or (select amount_granted from public.attendance_claims
         where user_id = 960001 and claimed_on = v_today) <> 200
     or (select count(*) from public.transactions
         where user_id = 960001 and type = 'ATTENDANCE_REWARD' and amount = 200) <> 1 then
    raise exception '0 to 200 attendance claim failed';
  end if;

  insert into public.transactions (user_id, type, amount, note)
  values (960001, 'SPEND_ATTENDANCE', -50, 'same-day spend test');

  if public.claim_daily_attendance() <> 0
     or (select amount from public.balances where user_id = 960001 and type = 'ATTENDANCE') <> 150
     or (select count(*) from public.transactions
         where user_id = 960001 and type = 'ATTENDANCE_REWARD') <> 1 then
    raise exception 'same-day claim paid again after spending';
  end if;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"96000000-0000-0000-0000-000000000002","role":"authenticated"}',
    true
  );
  v_granted := public.claim_daily_attendance();
  if v_granted <> 120
     or (select amount from public.balances where user_id = 960002 and type = 'ATTENDANCE') <> 200 then
    raise exception '80 to 200 attendance claim failed: granted %, balance %',
      v_granted,
      (select amount from public.balances where user_id = 960002 and type = 'ATTENDANCE');
  end if;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"96000000-0000-0000-0000-000000000003","role":"authenticated"}',
    true
  );
  v_granted := public.claim_daily_attendance();
  if v_granted <> 0
     or not exists (
       select 1 from public.attendance_claims
       where user_id = 960003 and claimed_on = v_today and amount_granted = 0
     )
     or exists (
       select 1 from public.transactions
       where user_id = 960003 and type = 'ATTENDANCE_REWARD'
     ) then
    raise exception 'full balance claim failed: granted %, claim %, rewards %',
      v_granted,
      (select count(*) from public.attendance_claims
       where user_id = 960003 and claimed_on = v_today and amount_granted = 0),
      (select count(*) from public.transactions
       where user_id = 960003 and type = 'ATTENDANCE_REWARD');
  end if;

  insert into public.attendance_claims (user_id, claimed_on, amount_granted)
  values (960004, v_today - 1, 0);
  perform set_config(
    'request.jwt.claims',
    '{"sub":"96000000-0000-0000-0000-000000000004","role":"authenticated"}',
    true
  );
  v_granted := public.claim_daily_attendance();
  if v_granted <> 200
     or not exists (
       select 1 from public.attendance_claims
       where user_id = 960004 and claimed_on = v_today
     ) then
    raise exception 'next Korea service date failed: granted %, uid %, claims %',
      v_granted,
      auth.uid(),
      (select array_agg(claimed_on order by claimed_on)
       from public.attendance_claims where user_id = 960004);
  end if;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"96000000-0000-0000-0000-000000000006","role":"authenticated"}',
    true
  );
  begin
    perform public.claim_daily_attendance();
    raise exception 'CHILD attendance claim unexpectedly succeeded';
  exception when insufficient_privilege then
    if sqlerrm <> 'PARENT_REQUIRED' then raise; end if;
  end;
end;
$test$;

create function pg_temp.reject_attendance_reward()
returns trigger
language plpgsql
as $function$
begin
  if new.user_id = 960005 and new.type = 'ATTENDANCE_REWARD' then
    raise exception 'FORCED_ATTENDANCE_FAILURE';
  end if;
  return new;
end;
$function$;

create trigger test_reject_attendance_reward
before insert on public.transactions
for each row
execute function pg_temp.reject_attendance_reward();

do $test_atomicity$
declare
  v_today date := (statement_timestamp() at time zone 'Asia/Seoul')::date;
begin
  perform set_config(
    'request.jwt.claims',
    '{"sub":"96000000-0000-0000-0000-000000000005","role":"authenticated"}',
    true
  );

  begin
    perform public.claim_daily_attendance();
    raise exception 'forced attendance failure unexpectedly succeeded';
  exception when others then
    if sqlerrm <> 'FORCED_ATTENDANCE_FAILURE' then raise; end if;
  end;

  if exists (
       select 1 from public.attendance_claims
       where user_id = 960005 and claimed_on = v_today
     )
     or (select amount from public.balances
         where user_id = 960005 and type = 'ATTENDANCE') <> 0
     or exists (
       select 1 from public.transactions
       where user_id = 960005 and type = 'ATTENDANCE_REWARD'
     ) then
    raise exception 'failed attendance claim left partial state';
  end if;
end;
$test_atomicity$;

select extensions.pass('daily attendance rules and atomicity');
select * from extensions.finish();

rollback;
