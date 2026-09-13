# Google Play Purchase Verification

Authenticated parents call:

```http
POST /functions/v1/verify-google-play-purchase
Authorization: Bearer <Supabase user JWT>
Content-Type: application/json

{"productId":"rewardchild_cash_200","purchaseToken":"..."}
```

The function validates the JWT and the database `PARENT` role, verifies the token with `purchases.productsv2.getproductpurchasev2`, finalizes the Bank purchase, and consumes the one-time product. Client-provided prices, CASH amounts, parent IDs, and auth user IDs are not accepted.

## Required secrets

Set these only as Supabase Edge Function secrets:

- `GOOGLE_PLAY_PACKAGE_NAME`: Android application ID registered in Play Console.
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`: Complete Google service-account JSON containing `client_email`, PKCS#8 `private_key`, and optionally `token_uri`.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are supplied by Supabase. The service-role key must never be included in the app.

Create a Google Cloud service account and enable the Google Play Android Developer API. In Play Console's **Users and permissions**, invite that service-account email and grant only the Billing permissions needed to view financial/order data and manage orders/subscriptions. A Cloud-project link is no longer required. Do not commit the JSON key.

Example command shape (values intentionally omitted):

```bash
npx supabase secrets set \
  GOOGLE_PLAY_PACKAGE_NAME=... \
  GOOGLE_PLAY_SERVICE_ACCOUNT_JSON='...'
```

## Account binding

When launching Billing, set `obfuscatedAccountId` to the lowercase SHA-256 hex digest of the signed-in Supabase auth user UUID. If Google returns this field, the function requires an exact match.

## Retry behavior

`purchaseToken` is the idempotency key. A repeated request reuses the same pending/paid row and never grants CASH twice. If consume fails after payout, the endpoint returns HTTP 202; retrying verifies the token again and retries only consumption. A scheduled retry worker is still required before production so processing does not depend on the app reopening.

Google requires one-time purchases to be acknowledged or consumed within three days. Alert on `FAILED`/stale `PENDING` consumption and run the retry worker comfortably before that deadline.
