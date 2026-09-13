# Development Mock Bank Purchase

This function exists only for development UX testing. It accepts only an active
Bank `productId` and an `idempotencyKey`; price, CASH amount, parent ID, and auth
user ID are resolved server-side.

The endpoint is enabled only when both server-side values are set:

```text
REWARDCHILD_ENV=development
ENABLE_MOCK_BANK_PURCHASES=true
```

Do not set either value in production. The function returns 404 unless both
conditions match. The client-side provider flag cannot enable this endpoint.

Select the client adapter in a local Expo env file:

```text
EXPO_PUBLIC_BANK_BILLING_PROVIDER=mock
```

The app also requires Expo's compile-time `__DEV__` flag. Production bundles
therefore select Google Play even if the public value is accidentally present.

For a local Supabase stack, place the values in an uncommitted Edge Function env
file and serve the function with that env file. The service-role key remains only
inside Supabase Edge Runtime.

Authenticated requests use this body:

```json
{"productId":"rewardchild_cash_200","idempotencyKey":"a-client-generated-uuid"}
```

The service-role-only `create_mock_bank_purchase` RPC verifies the database user
is a parent, reads the active Bank item, records the paid Mock purchase and
`BANK_PURCHASE` transaction atomically, and relies on the existing transaction
trigger to update the CASH balance. Reusing the key returns the original purchase.
