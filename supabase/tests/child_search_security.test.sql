begin;

create extension if not exists pgtap with schema extensions;
select extensions.plan(1);

insert into public.users (id, auth_user_id, nickname, tag, role)
values
  (970001, '97000000-0000-0000-0000-000000000001', 'SearchParent', 'A001', 'PARENT'),
  (970002, '97000000-0000-0000-0000-000000000002', 'SearchChildCaller', 'A002', 'CHILD'),
  (970003, '97000000-0000-0000-0000-000000000003', 'AvailableChild', 'B003', 'CHILD'),
  (970004, '97000000-0000-0000-0000-000000000004', 'OtherParent', 'B004', 'PARENT'),
  (970005, '97000000-0000-0000-0000-000000000005', 'PendingChild', 'B005', 'CHILD'),
  (970006, '97000000-0000-0000-0000-000000000006', 'ActiveChild', 'B006', 'CHILD'),
  (970007, '97000000-0000-0000-0000-000000000007', 'BlockedChild', 'B007', 'CHILD'),
  (970008, '97000000-0000-0000-0000-000000000008', 'RateParent', 'B008', 'PARENT'),
  (970009, '97000000-0000-0000-0000-000000000009', 'UnsearchedChild', 'B009', 'CHILD');

insert into public.relations (parent_id, child_id, status)
values
  (970001, 970005, 'PENDING'),
  (970001, 970006, 'ACTIVE'),
  (970001, 970007, 'BLOCKED');

do $test$
declare
  v_found_id bigint;
  v_attempt integer;
begin
  if has_function_privilege('anon', 'public.find_child_by_tag(text,text)', 'execute')
     or has_function_privilege('service_role', 'public.find_child_by_tag(text,text)', 'execute')
     or not has_function_privilege('authenticated', 'public.find_child_by_tag(text,text)', 'execute') then
    raise exception 'child search RPC grants are incorrect';
  end if;

  if pg_get_function_result('public.find_child_by_tag(text,text)'::regprocedure)
       <> 'TABLE(id bigint)' then
    raise exception 'child search exposes more than id: %',
      pg_get_function_result('public.find_child_by_tag(text,text)'::regprocedure);
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'private'
      and table_name = 'child_search_attempts'
      and column_name not in ('parent_id', 'attempted_at')
  ) then
    raise exception 'search attempts retain search input or result data';
  end if;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"97000000-0000-0000-0000-000000000001","role":"anon"}',
    true
  );
  begin
    perform public.find_child_by_tag('AvailableChild', 'B003');
    raise exception 'anon child search unexpectedly succeeded';
  exception when insufficient_privilege then
    if sqlerrm <> 'AUTHENTICATION_REQUIRED' then raise; end if;
  end;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"97000000-0000-0000-0000-000000000002","role":"authenticated"}',
    true
  );
  begin
    perform public.find_child_by_tag('AvailableChild', 'B003');
    raise exception 'CHILD search unexpectedly succeeded';
  exception when insufficient_privilege then
    if sqlerrm <> 'PARENT_REQUIRED' then raise; end if;
  end;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"97000000-0000-0000-0000-000000000001","role":"authenticated"}',
    true
  );

  select id into v_found_id
  from public.find_child_by_tag('AvailableChild', 'b003');
  if v_found_id is distinct from 970003 then
    raise exception 'PARENT could not find an available CHILD';
  end if;

  v_found_id := null;
  select id into v_found_id
  from public.find_child_by_tag('MissingChild', 'FFFF');
  if found or v_found_id is not null then
    raise exception 'nonexistent child search returned a row';
  end if;

  v_found_id := null;
  select id into v_found_id
  from public.find_child_by_tag('SearchParent', 'A001');
  if found or v_found_id is not null then
    raise exception 'self search returned a row';
  end if;

  v_found_id := null;
  select id into v_found_id
  from public.find_child_by_tag('OtherParent', 'B004');
  if found or v_found_id is not null then
    raise exception 'PARENT target search returned a row';
  end if;

  v_found_id := null;
  select id into v_found_id
  from public.find_child_by_tag('PendingChild', 'B005');
  if found or v_found_id is not null then
    raise exception 'existing PENDING relation target returned a row';
  end if;

  v_found_id := null;
  select id into v_found_id
  from public.find_child_by_tag('ActiveChild', 'B006');
  if found or v_found_id is not null then
    raise exception 'existing ACTIVE relation target returned a row';
  end if;

  v_found_id := null;
  select id into v_found_id
  from public.find_child_by_tag('BlockedChild', 'B007');
  if found or v_found_id is not null then
    raise exception 'existing BLOCKED relation target returned a row';
  end if;

  if (select count(*) from private.child_search_attempts where parent_id = 970001) <> 7 then
    raise exception 'parent search attempts were not recorded';
  end if;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"97000000-0000-0000-0000-000000000008","role":"authenticated"}',
    true
  );
  for v_attempt in 1..10 loop
    perform public.find_child_by_tag('MissingChild', 'FFFF');
  end loop;

  begin
    perform public.find_child_by_tag('AvailableChild', 'B003');
    raise exception 'rate-limited search unexpectedly succeeded';
  exception when raise_exception then
    if sqlerrm <> 'CHILD_SEARCH_RATE_LIMITED' then raise; end if;
  end;

  if (select count(*) from private.child_search_attempts where parent_id = 970008) <> 10 then
    raise exception 'rate limiter recorded an incorrect attempt count';
  end if;

  perform set_config(
    'request.jwt.claims',
    '{"sub":"97000000-0000-0000-0000-000000000001","role":"authenticated"}',
    true
  );
  begin
    perform public.create_relation_request(970004);
    raise exception 'direct PARENT-id relation request unexpectedly succeeded';
  exception when insufficient_privilege then
    if sqlerrm <> 'CHILD_SEARCH_REQUIRED' then raise; end if;
  end;

  begin
    perform public.create_relation_request(979999);
    raise exception 'direct nonexistent-id relation request unexpectedly succeeded';
  exception when insufficient_privilege then
    if sqlerrm <> 'CHILD_SEARCH_REQUIRED' then raise; end if;
  end;

  begin
    perform public.create_relation_request(970009);
    raise exception 'relation request without a successful search unexpectedly succeeded';
  exception when insufficient_privilege then
    if sqlerrm <> 'CHILD_SEARCH_REQUIRED' then raise; end if;
  end;

  perform public.create_relation_request(970003);
  if not exists (
    select 1 from public.relations
    where parent_id = 970001
      and child_id = 970003
      and status = 'PENDING'
  ) then
    raise exception 'secured search conflicts with relation request RPC';
  end if;

  if exists (
    select 1 from private.child_search_matches where parent_id = 970001
  ) then
    raise exception 'relation request did not consume its search match';
  end if;
end;
$test$;

select extensions.pass('child search authorization, disclosure, targets, and rate limit');
select * from extensions.finish();

rollback;
