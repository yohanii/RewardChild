begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

insert into public.users (id, auth_user_id, nickname, tag, role)
values
  (980001, '98000000-0000-0000-0000-000000000001', 'ParentOne', 'P001', 'PARENT'),
  (980002, '98000000-0000-0000-0000-000000000002', 'ActiveChildOne', 'C002', 'CHILD'),
  (980003, '98000000-0000-0000-0000-000000000003', 'ActiveChildTwo', 'C003', 'CHILD'),
  (980004, '98000000-0000-0000-0000-000000000004', 'UnrelatedChild', 'C004', 'CHILD'),
  (980005, '98000000-0000-0000-0000-000000000005', 'BlockedHistoryChild', 'C005', 'CHILD'),
  (980006, '98000000-0000-0000-0000-000000000006', 'BlockedNoHistory', 'C006', 'CHILD'),
  (980007, '98000000-0000-0000-0000-000000000007', 'PendingParent', 'P007', 'PARENT'),
  (980008, '98000000-0000-0000-0000-000000000008', 'PendingChild', 'C008', 'CHILD');

insert into public.relations (parent_id, child_id, status)
values
  (980001, 980002, 'ACTIVE'),
  (980001, 980003, 'ACTIVE'),
  (980001, 980005, 'BLOCKED'),
  (980001, 980006, 'BLOCKED'),
  (980007, 980008, 'PENDING');

insert into public.shop_items (id, parent_id, title, price)
values (980001, 980001, 'Historical reward', 10);

insert into public.shop_purchases (id, child_id, shop_item_id, price_paid)
values (980001, 980005, 980001, 10);

set local role authenticated;

do $test$
declare
  v_profile record;
begin
  if has_function_privilege('anon', 'public.get_family_profiles(bigint[])', 'execute')
     or has_function_privilege('service_role', 'public.get_family_profiles(bigint[])', 'execute')
     or not has_function_privilege('authenticated', 'public.get_family_profiles(bigint[])', 'execute') then
    raise exception 'family profile RPC grants are incorrect';
  end if;

  if pg_get_function_result('public.get_family_profiles(bigint[])'::regprocedure)
       <> 'TABLE(id bigint, nickname text, tag text)' then
    raise exception 'family profile RPC exposes unexpected fields: %',
      pg_get_function_result('public.get_family_profiles(bigint[])'::regprocedure);
  end if;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"98000000-0000-0000-0000-000000000001","role":"authenticated"}',
    true
  );

  if (select count(*) from public.get_family_profiles(array[980002, 980003])) <> 2 then
    raise exception 'parent could not read both ACTIVE children';
  end if;
  if exists (select 1 from public.get_family_profiles(array[980004])) then
    raise exception 'parent could read an unrelated user';
  end if;
  if not exists (select 1 from public.get_family_profiles(array[980005])) then
    raise exception 'parent could not read BLOCKED child with visible purchase history';
  end if;
  if exists (select 1 from public.get_family_profiles(array[980006])) then
    raise exception 'parent could read BLOCKED child without purchase history';
  end if;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"98000000-0000-0000-0000-000000000002","role":"authenticated"}',
    true
  );

  select * into v_profile
  from public.get_family_profiles(array[980001]);
  if v_profile.id is distinct from 980001
     or v_profile.nickname is distinct from 'ParentOne'
     or v_profile.tag is distinct from 'P001' then
    raise exception 'child could not read ACTIVE parent profile';
  end if;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"98000000-0000-0000-0000-000000000005","role":"authenticated"}',
    true
  );
  if exists (select 1 from public.get_family_profiles(array[980001])) then
    raise exception 'BLOCKED child could read former parent profile unnecessarily';
  end if;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"98000000-0000-0000-0000-000000000008","role":"authenticated"}',
    true
  );
  if not exists (select 1 from public.get_family_profiles(array[980007])) then
    raise exception 'child could not read parent for a PENDING request';
  end if;
  if exists (select 1 from public.users where id = 980007) then
    raise exception 'child could directly read the full related users row';
  end if;
end;
$test$;

select extensions.pass('family profiles expose only minimal authorized family data');
select * from extensions.finish();

rollback;
