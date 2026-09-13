import {
  GooglePlayError,
  type GoogleProductPurchaseV2,
} from './core.ts'

type ServiceAccountCredentials = {
  client_email: string
  private_key: string
  token_uri?: string
}

type Fetch = typeof fetch

let cachedAccessToken: { value: string; expiresAt: number } | null = null

function base64Url(input: Uint8Array) {
  let binary = ''
  for (const byte of input) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function encodeJson(value: unknown) {
  return base64Url(new TextEncoder().encode(JSON.stringify(value)))
}

function privateKeyBytes(pem: string) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')

  const binary = atob(body)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function createServiceAccountAssertion(credentials: ServiceAccountCredentials) {
  const now = Math.floor(Date.now() / 1000)
  const tokenUri = credentials.token_uri ?? 'https://oauth2.googleapis.com/token'
  const encodedHeader = encodeJson({ alg: 'RS256', typ: 'JWT' })
  const encodedClaims = encodeJson({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  })
  const unsigned = `${encodedHeader}.${encodedClaims}`
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes(credentials.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  )
  return { assertion: `${unsigned}.${base64Url(new Uint8Array(signature))}`, tokenUri }
}

async function getAccessToken(credentials: ServiceAccountCredentials, fetcher: Fetch) {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return cachedAccessToken.value
  }

  const { assertion, tokenUri } = await createServiceAccountAssertion(credentials)
  const response = await fetcher(tokenUri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  if (!response.ok) {
    throw new GooglePlayError('CONFIGURATION', 'GOOGLE_OAUTH_FAILED')
  }

  const body = await response.json() as { access_token?: string; expires_in?: number }
  if (!body.access_token) {
    throw new GooglePlayError('CONFIGURATION', 'GOOGLE_OAUTH_INVALID_RESPONSE')
  }

  cachedAccessToken = {
    value: body.access_token,
    expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000,
  }
  return body.access_token
}

function googleError(status: number, operation: 'VERIFY' | 'CONSUME') {
  if (operation === 'VERIFY' && (status === 400 || status === 404 || status === 410)) {
    return new GooglePlayError('INVALID', 'GOOGLE_PURCHASE_NOT_FOUND')
  }
  if (status === 401 || status === 403) {
    return new GooglePlayError('CONFIGURATION', 'GOOGLE_API_AUTH_FAILED')
  }
  return new GooglePlayError('TEMPORARY', `GOOGLE_${operation}_HTTP_${status}`)
}

export function createGooglePlayClient({
  packageName,
  credentials,
  fetcher = fetch,
  apiBaseUrl = 'https://androidpublisher.googleapis.com/androidpublisher/v3',
}: {
  packageName: string
  credentials: ServiceAccountCredentials
  fetcher?: Fetch
  apiBaseUrl?: string
}) {
  const encodedPackageName = encodeURIComponent(packageName)

  return {
    async verifyPurchase(purchaseToken: string): Promise<GoogleProductPurchaseV2> {
      const accessToken = await getAccessToken(credentials, fetcher)
      const url = `${apiBaseUrl}/applications/${encodedPackageName}/purchases/productsv2/tokens/${encodeURIComponent(purchaseToken)}`
      const response = await fetcher(url, {
        headers: { authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) throw googleError(response.status, 'VERIFY')
      return await response.json() as GoogleProductPurchaseV2
    },

    async consumePurchase(productId: string, purchaseToken: string): Promise<void> {
      const accessToken = await getAccessToken(credentials, fetcher)
      const url = `${apiBaseUrl}/applications/${encodedPackageName}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:consume`
      const response = await fetcher(url, {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) throw googleError(response.status, 'CONSUME')
    },
  }
}

export function parseServiceAccountCredentials(value: string): ServiceAccountCredentials {
  let parsed: Partial<ServiceAccountCredentials>
  try {
    parsed = JSON.parse(value) as Partial<ServiceAccountCredentials>
  } catch {
    throw new Error('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not valid JSON')
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('Google service account credentials are incomplete')
  }
  return parsed as ServiceAccountCredentials
}
