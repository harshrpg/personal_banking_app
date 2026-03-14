import "server-only";

import { getWorkspaceKeys } from "@/db/keys";
import { delKey, getJson, setJson } from "@/db/kv";
import type {
  AccountBalanceSnapshot,
  AccountRecord,
  AccountTransactionsSnapshot,
  AppSettings,
  BudgetItem,
  CategorizationRule,
  InvestmentHolding,
  RequisitionRecord,
  SavingsGoal,
  TransactionAnnotation,
  WorkspaceMode,
} from "@/types/app";

const DEFAULT_SETTINGS: AppSettings = {
  defaultCountry: "ie",
  maxHistoricalDays: 90,
  accessValidForDays: 90,
  maxAccounts: 3,
  recurringRuleSensitivity: "medium",
  merchantAliasMode: "balanced",
  budgetAlertThreshold: 85,
  notificationsEnabled: true,
  privacyMode: "standard",
  aiTone: "neutral",
};

function resolveWorkspace(workspace?: WorkspaceMode): WorkspaceMode {
  return workspace ?? "personal";
}

function keysFor(workspace?: WorkspaceMode) {
  return getWorkspaceKeys(resolveWorkspace(workspace));
}

export async function getSettings(workspace?: WorkspaceMode): Promise<AppSettings> {
  const stored = await getJson<AppSettings>(keysFor(workspace).settings);
  return stored ?? DEFAULT_SETTINGS;
}

export async function saveSettings(
  settings: AppSettings,
  workspace?: WorkspaceMode,
): Promise<void> {
  await setJson(keysFor(workspace).settings, settings);
}

export async function getRequisitions(
  workspace?: WorkspaceMode,
): Promise<RequisitionRecord[]> {
  return (await getJson<RequisitionRecord[]>(keysFor(workspace).requisitions)) ?? [];
}

export async function saveRequisitions(
  requisitions: RequisitionRecord[],
  workspace?: WorkspaceMode,
): Promise<void> {
  await setJson(keysFor(workspace).requisitions, requisitions);
}

export async function addRequisition(
  requisition: RequisitionRecord,
  workspace?: WorkspaceMode,
): Promise<void> {
  const existing = await getRequisitions(workspace);
  await saveRequisitions([requisition, ...existing], workspace);
}

export async function updateRequisition(
  requisitionId: string,
  updates: Partial<RequisitionRecord>,
  workspace?: WorkspaceMode,
): Promise<void> {
  const existing = await getRequisitions(workspace);
  const updated = existing.map((item) =>
    item.id === requisitionId ? { ...item, ...updates } : item,
  );
  await saveRequisitions(updated, workspace);
}

export async function getAccounts(workspace?: WorkspaceMode): Promise<AccountRecord[]> {
  return (await getJson<AccountRecord[]>(keysFor(workspace).accounts)) ?? [];
}

export async function saveAccounts(
  accounts: AccountRecord[],
  workspace?: WorkspaceMode,
): Promise<void> {
  await setJson(keysFor(workspace).accounts, accounts);
}

export async function upsertAccount(
  account: AccountRecord,
  workspace?: WorkspaceMode,
): Promise<void> {
  const existing = await getAccounts(workspace);
  const index = existing.findIndex((item) => item.accountId === account.accountId);
  if (index === -1) {
    existing.push(account);
  } else {
    existing[index] = { ...existing[index], ...account };
  }
  await saveAccounts(existing, workspace);
}

export async function removeAccount(
  accountId: string,
  workspace?: WorkspaceMode,
): Promise<void> {
  const keys = keysFor(workspace);
  const existing = await getAccounts(workspace);
  await saveAccounts(
    existing.filter((item) => item.accountId !== accountId),
    workspace,
  );
  await delKey(keys.cache.balances(accountId));
  await delKey(keys.cache.transactions(accountId));
  await delKey(keys.cache.details(accountId));
}

export async function getCachedBalances(accountId: string, workspace?: WorkspaceMode) {
  return getJson<AccountBalanceSnapshot>(keysFor(workspace).cache.balances(accountId));
}

export async function setCachedBalances(
  snapshot: AccountBalanceSnapshot,
  workspace?: WorkspaceMode,
) {
  return setJson(keysFor(workspace).cache.balances(snapshot.accountId), snapshot, {
    ex: 60 * 10,
  });
}

export async function getCachedTransactions(
  accountId: string,
  workspace?: WorkspaceMode,
) {
  return getJson<AccountTransactionsSnapshot>(
    keysFor(workspace).cache.transactions(accountId),
  );
}

export async function setCachedTransactions(
  snapshot: AccountTransactionsSnapshot,
  workspace?: WorkspaceMode,
) {
  return setJson(keysFor(workspace).cache.transactions(snapshot.accountId), snapshot, {
    ex: 60 * 10,
  });
}

export async function resetAllData(workspace?: WorkspaceMode): Promise<void> {
  const keys = keysFor(workspace);
  const accounts = await getAccounts(workspace);
  await Promise.all(
    accounts.map((account) => removeAccount(account.accountId, workspace)),
  );
  await delKey(keys.requisitions);
  await delKey(keys.settings);
  await delKey(keys.refreshToken);
  await delKey(keys.accessToken);
  await delKey(keys.accessTokenExpiresAt);
  await delKey(keys.lastApiCall);
  await delKey(keys.tokenStatus);
  await delKey(keys.categories);
  await delKey(keys.categoryRules);
  await delKey(keys.transactionAnnotations);
  await delKey(keys.budgets);
  await delKey(keys.savingsGoals);
  await delKey(keys.investments);
  await delKey(keys.notificationPreferences);
  await delKey(keys.aiTone);
}

export async function getCategoryRules(
  workspace?: WorkspaceMode,
): Promise<CategorizationRule[]> {
  return (await getJson<CategorizationRule[]>(keysFor(workspace).categoryRules)) ?? [];
}

export async function saveCategoryRules(
  rules: CategorizationRule[],
  workspace?: WorkspaceMode,
): Promise<void> {
  await setJson(keysFor(workspace).categoryRules, rules);
}

export async function getTransactionAnnotations(
  workspace?: WorkspaceMode,
): Promise<
  Record<string, TransactionAnnotation>
> {
  return (
    (await getJson<Record<string, TransactionAnnotation>>(
      keysFor(workspace).transactionAnnotations,
    )) ??
    {}
  );
}

export async function saveTransactionAnnotations(
  annotations: Record<string, TransactionAnnotation>,
  workspace?: WorkspaceMode,
): Promise<void> {
  await setJson(keysFor(workspace).transactionAnnotations, annotations);
}

export async function getBudgets(workspace?: WorkspaceMode): Promise<BudgetItem[]> {
  return (await getJson<BudgetItem[]>(keysFor(workspace).budgets)) ?? [];
}

export async function saveBudgets(
  items: BudgetItem[],
  workspace?: WorkspaceMode,
): Promise<void> {
  await setJson(keysFor(workspace).budgets, items);
}

export async function getSavingsGoals(
  workspace?: WorkspaceMode,
): Promise<SavingsGoal[]> {
  return (await getJson<SavingsGoal[]>(keysFor(workspace).savingsGoals)) ?? [];
}

export async function saveSavingsGoals(
  goals: SavingsGoal[],
  workspace?: WorkspaceMode,
): Promise<void> {
  await setJson(keysFor(workspace).savingsGoals, goals);
}

export async function getInvestments(
  workspace?: WorkspaceMode,
): Promise<InvestmentHolding[]> {
  return (await getJson<InvestmentHolding[]>(keysFor(workspace).investments)) ?? [];
}

export async function saveInvestments(
  holdings: InvestmentHolding[],
  workspace?: WorkspaceMode,
): Promise<void> {
  await setJson(keysFor(workspace).investments, holdings);
}

