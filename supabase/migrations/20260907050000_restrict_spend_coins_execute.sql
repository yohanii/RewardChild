-- spend_coins is an internal helper called by trusted SECURITY DEFINER RPCs.
-- Keep direct execution limited to its owner (postgres).
revoke execute on function public.spend_coins(
  bigint,
  integer,
  public.reference_type,
  bigint,
  text
) from public, anon, authenticated, service_role;
