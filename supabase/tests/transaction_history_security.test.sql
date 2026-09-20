begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

insert into public.users (id, auth_user_id, nickname, tag, role)
values
  (990001, '99000000-0000-0000-0000-000000000001', 'LedgerParent', 'P001', 'PARENT'),
  (990002, '99000000-0000-0000-0000-000000000002', 'LedgerChild', 'C002', 'CHILD'),
  (990003, '99000000-0000-0000-0000-000000000003', 'LedgerOther', 'C003', 'CHILD');

insert into public.relations (parent_id, child_id, status)
values (990001, 990002, 'ACTIVE');

insert into public.transactions (id, user_id, type, amount, note)
values
  (990001, 990001, 'ATTENDANCE_REWARD', 120, 'Parent transaction'),
  (990002, 990002, 'QUEST_REWARD', 50, 'Child transaction'),
  (990003, 990003, 'ADJUSTMENT', 10, 'Unrelated transaction');

set local role authenticated;

do $test$
begin
  perform set_config(
    'request.jwt.claims',
    '{"sub":"99000000-0000-0000-0000-000000000001","role":"authenticated"}',
    true
  );
  if not exists (select 1 from public.transactions where id = 990001)
     or exists (select 1 from public.transactions where id in (990002, 990003)) then
    raise exception 'parent transaction history is not owner-only';
  end if;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"99000000-0000-0000-0000-000000000002","role":"authenticated"}',
    true
  );
  if not exists (select 1 from public.transactions where id = 990002)
     or exists (select 1 from public.transactions where id in (990001, 990003)) then
    raise exception 'child transaction history is not owner-only';
  end if;

  if has_table_privilege('authenticated', 'public.transactions', 'insert')
     or has_table_privilege('authenticated', 'public.transactions', 'update')
     or has_table_privilege('authenticated', 'public.transactions', 'delete') then
    raise exception 'authenticated transaction write privilege was added';
  end if;
end;
$test$;

select extensions.pass('transaction history is owner-only and remains read-only');
select * from extensions.finish();

rollback;
