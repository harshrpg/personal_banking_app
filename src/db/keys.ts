import type { WorkspaceMode } from "@/types/app";

function prefix(workspace: WorkspaceMode) {
  return workspace === "business" ? "business" : "personal";
}

export function getWorkspaceKeys(workspace: WorkspaceMode) {
  const scope = prefix(workspace);
  return {
    refreshToken: `gocardless:${scope}:refresh_token`,
    accessToken: `gocardless:${scope}:access_token`,
    accessTokenExpiresAt: `gocardless:${scope}:access_token_expires_at`,
    requisitions: `gocardless:${scope}:requisitions`,
    accounts: `gocardless:${scope}:accounts`,
    settings: `app:${scope}:settings`,
    lastApiCall: `app:${scope}:last_api_call`,
    dashboardSyncs: `app:${scope}:dashboard_syncs`,
    tokenStatus: `app:${scope}:token_status`,
    categories: `app:${scope}:categories`,
    categoryRules: `app:${scope}:category_rules`,
    transactionAnnotations: `app:${scope}:transaction_annotations`,
    budgets: `app:${scope}:budgets`,
    savingsGoals: `app:${scope}:savings_goals`,
    investments: `app:${scope}:investments`,
    notificationPreferences: `app:${scope}:notification_preferences`,
    aiTone: `app:${scope}:ai_tone`,
    cache: {
      balances: (accountId: string) => `cache:${scope}:balances:${accountId}`,
      transactions: (accountId: string) => `cache:${scope}:transactions:${accountId}`,
      details: (accountId: string) => `cache:${scope}:details:${accountId}`,
    },
  };
}

export const KV_KEYS = getWorkspaceKeys("personal");

