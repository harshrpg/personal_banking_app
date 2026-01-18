import "server-only";

import { KV_KEYS } from "@/db/keys";
import { delKey, getJson, setJson } from "@/db/kv";
import type {
  AccountBalanceSnapshot,
  AccountRecord,
  AccountTransactionsSnapshot,
  AppSettings,
  RequisitionRecord,
} from "@/types/app";

const DEFAULT_SETTINGS: AppSettings = {
  defaultCountry: "ie",
  maxHistoricalDays: 90,
  accessValidForDays: 90,
  maxAccounts: 3,
};

export async function getSettings(): Promise<AppSettings> {
  const stored = await getJson<AppSettings>(KV_KEYS.settings);
  return stored ?? DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await setJson(KV_KEYS.settings, settings);
}

export async function getRequisitions(): Promise<RequisitionRecord[]> {
  return (await getJson<RequisitionRecord[]>(KV_KEYS.requisitions)) ?? [];
}

export async function saveRequisitions(
  requisitions: RequisitionRecord[],
): Promise<void> {
  await setJson(KV_KEYS.requisitions, requisitions);
}

export async function addRequisition(
  requisition: RequisitionRecord,
): Promise<void> {
  const existing = await getRequisitions();
  await saveRequisitions([requisition, ...existing]);
}

export async function updateRequisition(
  requisitionId: string,
  updates: Partial<RequisitionRecord>,
): Promise<void> {
  const existing = await getRequisitions();
  const updated = existing.map((item) =>
    item.id === requisitionId ? { ...item, ...updates } : item,
  );
  await saveRequisitions(updated);
}

export async function getAccounts(): Promise<AccountRecord[]> {
  return (await getJson<AccountRecord[]>(KV_KEYS.accounts)) ?? [];
}

export async function saveAccounts(accounts: AccountRecord[]): Promise<void> {
  await setJson(KV_KEYS.accounts, accounts);
}

export async function upsertAccount(account: AccountRecord): Promise<void> {
  const existing = await getAccounts();
  const index = existing.findIndex((item) => item.accountId === account.accountId);
  if (index === -1) {
    existing.push(account);
  } else {
    existing[index] = { ...existing[index], ...account };
  }
  await saveAccounts(existing);
}

export async function removeAccount(accountId: string): Promise<void> {
  const existing = await getAccounts();
  await saveAccounts(existing.filter((item) => item.accountId !== accountId));
  await delKey(KV_KEYS.cache.balances(accountId));
  await delKey(KV_KEYS.cache.transactions(accountId));
  await delKey(KV_KEYS.cache.details(accountId));
}

export async function getCachedBalances(accountId: string) {
  return getJson<AccountBalanceSnapshot>(KV_KEYS.cache.balances(accountId));
}

export async function setCachedBalances(snapshot: AccountBalanceSnapshot) {
  return setJson(KV_KEYS.cache.balances(snapshot.accountId), snapshot, {
    ex: 60 * 10,
  });
}

export async function getCachedTransactions(accountId: string) {
  return getJson<AccountTransactionsSnapshot>(
    KV_KEYS.cache.transactions(accountId),
  );
}

export async function setCachedTransactions(snapshot: AccountTransactionsSnapshot) {
  return setJson(KV_KEYS.cache.transactions(snapshot.accountId), snapshot, {
    ex: 60 * 10,
  });
}

export async function resetAllData(): Promise<void> {
  const accounts = await getAccounts();
  await Promise.all(
    accounts.map((account) => removeAccount(account.accountId)),
  );
  await delKey(KV_KEYS.requisitions);
  await delKey(KV_KEYS.settings);
  await delKey(KV_KEYS.refreshToken);
  await delKey(KV_KEYS.accessToken);
  await delKey(KV_KEYS.accessTokenExpiresAt);
  await delKey(KV_KEYS.lastApiCall);
  await delKey(KV_KEYS.tokenStatus);
}

