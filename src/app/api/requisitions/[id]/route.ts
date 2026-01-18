import "server-only";

import { NextRequest, NextResponse } from "next/server";

import {
  getAccounts,
  getSettings,
  setCachedBalances,
  setCachedTransactions,
  updateRequisition,
  upsertAccount,
} from "@/db/store";
import {
  getAccountBalances,
  getAccountDetails,
  getAccountTransactions,
  getRequisition,
} from "@/lib/gocardless";
import { requireAppKey } from "@/lib/api-guard";
import { rateLimit } from "@/lib/rate-limit";
import type { AccountRecord } from "@/types/app";

function parseBalance(
  balances: Awaited<ReturnType<typeof getAccountBalances>>,
) {
  const preferred =
    balances.balances.find((item) => item.balanceType === "closingBooked") ??
    balances.balances[0];
  if (!preferred) {
    return null;
  }
  return {
    amount: Number(preferred.balanceAmount.amount),
    currency: preferred.balanceAmount.currency,
    balanceType: preferred.balanceType,
    updatedAt: preferred.lastChangeDateTime ?? new Date().toISOString(),
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAppKey(request);
  if (auth) return auth;
  if (!(await rateLimit("requisitions:sync"))) {
    return new Response("Too many requests", { status: 429 });
  }

  const { id } = await context.params;
  const requisition = await getRequisition(id);
  await updateRequisition(id, {
    status: requisition.status,
    accounts: requisition.accounts ?? [],
  });

  const settings = await getSettings();
  const existingAccounts = await getAccounts();
  const remainingSlots = Math.max(
    0,
    settings.maxAccounts - existingAccounts.length,
  );
  const accountsToAdd = requisition.accounts?.slice(0, remainingSlots) ?? [];

  const syncedAccounts: AccountRecord[] = [];

  for (const accountId of accountsToAdd) {
    const [details, balances, transactions] = await Promise.all([
      getAccountDetails(accountId),
      getAccountBalances(accountId),
      getAccountTransactions(accountId),
    ]);

    const name =
      details.account.name ??
      details.account.product ??
      details.account.ownerName ??
      "Account";

    const account: AccountRecord = {
      accountId,
      institutionId: requisition.institution_id,
      name,
      currency: details.account.currency,
      lastSync: new Date().toISOString(),
      selected: true,
    };

    await upsertAccount(account);
    const balanceSnapshot = parseBalance(balances);
    if (balanceSnapshot) {
      await setCachedBalances({
        accountId,
        ...balanceSnapshot,
      });
    }

    await setCachedTransactions({
      accountId,
      booked: transactions.transactions.booked ?? [],
      pending: transactions.transactions.pending ?? [],
      updatedAt: new Date().toISOString(),
    });

    syncedAccounts.push(account);
  }

  return NextResponse.json({
    requisition,
    accounts: syncedAccounts,
  });
}

