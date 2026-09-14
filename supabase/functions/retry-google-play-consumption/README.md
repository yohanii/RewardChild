# Google Play Consumption Retry Worker

This server-only Edge Function claims eligible paid Google Play purchases and
retries consumption without touching CASH, balances, or the transaction ledger.
It reuses the Google service-account authentication and Play API client from
`verify-google-play-purchase`.

## Selection and backoff

The database claim RPC selects only purchases with:

- `provider = GOOGLE_PLAY`
- `status = PAID`
- `consume_status IN (PENDING, FAILED)`
- no active five-minute lease
- fewer than eight consume attempts
- no `consume_retry_exhausted_at`
- the applicable delay elapsed since payment or the last attempt

Backoff after payment/attempt counts 0 through 5+ is 5 minutes, 5 minutes,
15 minutes, 1 hour, 6 hours, then 12 hours. Eight failed attempts set
`consume_retry_exhausted_at`; operations should alert on this non-null column.
The schedule should run every five minutes so several retries occur within the
Google Play three-day processing window.

Claims use `FOR UPDATE SKIP LOCKED` and a five-minute lease. Completion requires
the matching lease ID. An app recovery and worker may both reach Google, but the
existing advisory token lock and idempotent result functions ensure this cannot
grant CASH or create a ledger transaction again.

## Security

The function has gateway JWT verification disabled for service-to-service calls,
then requires the exact server secret/service-role key in the `apikey` header.
Publishable keys and user JWTs cannot authorize it. It returns counts only and
never returns or logs purchase tokens. Claim and completion RPCs are executable
only by `service_role`.

## Future remote scheduling

After deploying the migration and function to the intended project:

1. Set `GOOGLE_PLAY_PACKAGE_NAME` and `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` as Edge
   Function secrets.
2. Deploy `retry-google-play-consumption` with JWT verification enabled.
3. Store the project URL and server secret key in Supabase Vault; do not place the
   key directly in migration SQL.
4. Enable `pg_cron` and `pg_net` in the Supabase Dashboard.
5. Create a five-minute cron job that calls the function using `net.http_post`,
   retrieving the URL and `apikey` value from Vault.
6. Monitor non-2xx invocations, `completionFailed`, stale leases, and rows where
   `consume_retry_exhausted_at is not null`.

The remote cron and function deployment are intentionally not created here.
