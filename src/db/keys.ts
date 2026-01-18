export const KV_KEYS = {
  refreshToken: "gocardless:refresh_token",
  accessToken: "gocardless:access_token",
  accessTokenExpiresAt: "gocardless:access_token_expires_at",
  requisitions: "gocardless:requisitions",
  accounts: "gocardless:accounts",
  settings: "app:settings",
  lastApiCall: "app:last_api_call",
  tokenStatus: "app:token_status",
  cache: {
    balances: (accountId: string) => `cache:balances:${accountId}`,
    transactions: (accountId: string) => `cache:transactions:${accountId}`,
    details: (accountId: string) => `cache:details:${accountId}`,
  },
};

