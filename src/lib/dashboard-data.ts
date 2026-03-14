import "server-only";

import { getAccounts, getCachedBalances, getCachedTransactions } from "@/db/store";
import type { WorkspaceMode } from "@/types/app";

export async function getEnrichedSelectedAccounts(workspace?: WorkspaceMode) {
  const accounts = (await getAccounts(workspace)).filter((item) => item.selected);
  return Promise.all(
    accounts.map(async (account) => ({
      ...account,
      balances: await getCachedBalances(account.accountId, workspace),
      transactions: await getCachedTransactions(account.accountId, workspace),
    })),
  );
}
