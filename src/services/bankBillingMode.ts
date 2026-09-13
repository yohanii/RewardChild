export type BankBillingMode = 'google-play' | 'mock'

export function resolveBankBillingMode(
  configuredProvider: string | undefined,
  isDevelopment: boolean,
): BankBillingMode {
  return isDevelopment && configuredProvider === 'mock' ? 'mock' : 'google-play'
}
