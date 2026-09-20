drop policy if exists "transactions_select_policy" on public.transactions;

create policy "transactions_select_own"
on public.transactions
for select
to authenticated
using (public.is_me_user_id(user_id));
