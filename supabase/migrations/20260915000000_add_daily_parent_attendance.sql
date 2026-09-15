-- A durable claim is required even when a parent is already at the cap.
create table public.attendance_claims (
  user_id bigint not null references public.users(id) on delete cascade,
  claimed_on date not null,
  claimed_at timestamptz not null default now(),
  amount_granted integer not null default 0,
  constraint attendance_claims_pkey primary key (user_id, claimed_on),
  constraint attendance_claims_amount_granted_check
    check (amount_granted between 0 and 200)
);

alter table public.attendance_claims enable row level security;

revoke all on table public.attendance_claims from public, anon, authenticated;
grant select, insert, update, delete on table public.attendance_claims to service_role;

create or replace function public.claim_daily_attendance()
returns integer
language plpgsql
security definer
set search_path to public
as $function$
declare
  v_user_id bigint;
  v_claimed_on date := (statement_timestamp() at time zone 'Asia/Seoul')::date;
  v_current_attendance integer;
  v_granted integer;
begin
  if auth.role() is distinct from 'authenticated' or auth.uid() is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '42501';
  end if;

  select u.id
  into v_user_id
  from public.users u
  where u.auth_user_id = auth.uid()
    and u.role = 'PARENT'::public.user_role
  for share;

  if v_user_id is null then
    raise exception 'PARENT_REQUIRED' using errcode = '42501';
  end if;

  insert into public.attendance_claims (user_id, claimed_on)
  values (v_user_id, v_claimed_on)
  on conflict (user_id, claimed_on) do nothing;

  if not found then
    return 0;
  end if;

  insert into public.balances (user_id, type, amount)
  values (v_user_id, 'ATTENDANCE', 0)
  on conflict (user_id, type) do nothing;

  select b.amount
  into v_current_attendance
  from public.balances b
  where b.user_id = v_user_id
    and b.type = 'ATTENDANCE'
  for update;

  v_granted := greatest(0, 200 - v_current_attendance);

  if v_granted > 0 then
    insert into public.transactions (
      user_id, type, amount, reference_type, reference_id, note
    ) values (
      v_user_id,
      'ATTENDANCE_REWARD',
      v_granted,
      null,
      null,
      'Daily attendance top-up'
    );
  end if;

  update public.attendance_claims
  set amount_granted = v_granted
  where user_id = v_user_id
    and claimed_on = v_claimed_on;

  return v_granted;
end;
$function$;

revoke execute on function public.claim_daily_attendance()
  from public, anon, service_role;
grant execute on function public.claim_daily_attendance()
  to authenticated;

-- The replacement authenticated RPC supersedes this externally callable admin helper.
revoke execute on function public.give_attendance(bigint, integer)
  from public, anon, authenticated, service_role;

