import "server-only";

import { NextRequest, NextResponse } from "next/server";

import {
  getAccounts,
  getCachedBalances,
  getCachedTransactions,
  getSettings,
  setCachedBalances,
  setCachedTransactions,
  upsertAccount,
} from "@/db/store";
import {
  getAccountBalances,
  getAccountDetails,
  getAccountTransactions,
} from "@/lib/gocardless";
import { requireAppKey } from "@/lib/api-guard";
import { rateLimit } from "@/lib/rate-limit";
import type { AccountBalanceSnapshot, AccountRecord } from "@/types/app";

function parseBalanceSnapshot(
  accountId: string,
  balances: Awaited<ReturnType<typeof getAccountBalances>>,
): AccountBalanceSnapshot | null {
  const preferred =
    balances.balances.find((item) => item.balanceType === "closingBooked") ??
    balances.balances[0];
  if (!preferred) return null;
  return {
    accountId,
    amount: Number(preferred.balanceAmount.amount),
    currency: preferred.balanceAmount.currency,
    balanceType: preferred.balanceType,
    updatedAt: preferred.lastChangeDateTime ?? new Date().toISOString(),
  };
}

async function refreshAccount(account: AccountRecord) {
  const [details, balances, transactions] = await Promise.all([
    getAccountDetails(account.accountId),
    getAccountBalances(account.accountId),
    getAccountTransactions(account.accountId),
  ]);

  const name =
    details.account.name ??
    details.account.product ??
    details.account.ownerName ??
    account.name;

  await upsertAccount({
    ...account,
    name,
    currency: details.account.currency ?? account.currency,
    lastSync: new Date().toISOString(),
  });

  const balanceSnapshot = parseBalanceSnapshot(account.accountId, balances);
  if (balanceSnapshot) {
    await setCachedBalances(balanceSnapshot);
  }

  await setCachedTransactions({
    accountId: account.accountId,
    booked: transactions.transactions.booked ?? [],
    pending: transactions.transactions.pending ?? [],
    updatedAt: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  const auth = requireAppKey(request);
  if (auth) return auth;
  if (!(await rateLimit("dashboard"))) {
    return new Response("Too many requests", { status: 429 });
  }

  const sync = request.nextUrl.searchParams.get("sync") === "true";
  const accountId = request.nextUrl.searchParams.get("accountId");

  const settings = await getSettings();
  const allAccounts = await getAccounts();
  const activeAccounts = allAccounts.filter((item) => item.selected);
  const accounts = accountId
    ? activeAccounts.filter((item) => item.accountId === accountId)
    : activeAccounts;

  for (const account of accounts) {
    const cachedBalances = await getCachedBalances(account.accountId);
    const cachedTransactions = await getCachedTransactions(account.accountId);
    if (sync || !cachedBalances || !cachedTransactions) {
      await refreshAccount(account);
    }
  }

  const enrichedAccounts = await Promise.all(
    accounts.map(async (account) => {
      const cachedBalances = await getCachedBalances(account.accountId);
      const cachedTransactions = await getCachedTransactions(account.accountId);
      return {
        ...account,
        balances: cachedBalances,
        transactions: cachedTransactions,
      };
    }),
  );

  return NextResponse.json({
    settings,
    accounts: enrichedAccounts,
  });
}

