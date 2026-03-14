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
import { getJson, setJson } from "@/db/kv";
import { getWorkspaceKeys } from "@/db/keys";
import {
  getAccountBalances,
  getAccountDetails,
  getAccountTransactions,
} from "@/lib/gocardless";
import { requireAppKey } from "@/lib/api-guard";
import { rateLimit } from "@/lib/rate-limit";
import type {
  AccountBalanceSnapshot,
  AccountRecord,
  DashboardSyncStatus,
  WorkspaceMode,
} from "@/types/app";

const DASHBOARD_SYNC_LIMIT = 4;
const DASHBOARD_SYNC_WINDOW_SECONDS = 60 * 60 * 24;
const DASHBOARD_SYNC_WINDOW_MS = DASHBOARD_SYNC_WINDOW_SECONDS * 1000;

function parseWorkspace(request: NextRequest): WorkspaceMode {
  const raw = request.nextUrl.searchParams.get("workspace");
  return raw === "business" ? "business" : "personal";
}

async function getSyncTimestamps(workspace: WorkspaceMode): Promise<number[]> {
  return (await getJson<number[]>(getWorkspaceKeys(workspace).dashboardSyncs)) ?? [];
}

function pruneSyncTimestamps(timestamps: number[], now: number) {
  return timestamps.filter((timestamp) => now - timestamp < DASHBOARD_SYNC_WINDOW_MS);
}

function buildSyncStatus(
  timestamps: number[],
  now: number,
): DashboardSyncStatus {
  const pruned = pruneSyncTimestamps(timestamps, now);
  const used = pruned.length;
  const remaining = Math.max(0, DASHBOARD_SYNC_LIMIT - used);
  const lastSyncAt =
    used > 0 ? new Date(Math.max(...pruned)).toISOString() : undefined;
  const nextAvailableAt =
    remaining === 0
      ? new Date(Math.min(...pruned) + DASHBOARD_SYNC_WINDOW_MS).toISOString()
      : undefined;
  return {
    limit: DASHBOARD_SYNC_LIMIT,
    used,
    remaining,
    windowSeconds: DASHBOARD_SYNC_WINDOW_SECONDS,
    nextAvailableAt,
    lastSyncAt,
  };
}

function humanizeGoCardlessErrorMessage(message: string) {
  const prefix = "GoCardless error";
  if (!message.startsWith(prefix)) return message;
  const jsonStart = message.indexOf("{");
  if (jsonStart === -1) return message;
  const raw = message.slice(jsonStart);
  try {
    const parsed = JSON.parse(raw) as { summary?: string; detail?: string };
    if (!parsed.summary && !parsed.detail) return message;
    return [parsed.summary, parsed.detail].filter(Boolean).join(". ");
  } catch {
    return message;
  }
}

async function getDashboardSyncStatusForWorkspace(
  workspace: WorkspaceMode,
): Promise<DashboardSyncStatus> {
  const now = Date.now();
  const keys = getWorkspaceKeys(workspace);
  const timestamps = await getSyncTimestamps(workspace);
  const pruned = pruneSyncTimestamps(timestamps, now);
  if (pruned.length !== timestamps.length) {
    await setJson(keys.dashboardSyncs, pruned);
  }
  return buildSyncStatus(pruned, now);
}

async function recordDashboardSync(
  workspace: WorkspaceMode,
): Promise<DashboardSyncStatus> {
  const now = Date.now();
  const keys = getWorkspaceKeys(workspace);
  const timestamps = await getSyncTimestamps(workspace);
  const pruned = pruneSyncTimestamps(timestamps, now);
  const updated = [...pruned, now];
  await setJson(keys.dashboardSyncs, updated);
  return buildSyncStatus(updated, now);
}

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

async function refreshAccount(account: AccountRecord, workspace: WorkspaceMode) {
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
  }, workspace);

  const balanceSnapshot = parseBalanceSnapshot(account.accountId, balances);
  if (balanceSnapshot) {
    await setCachedBalances(balanceSnapshot, workspace);
  }

  await setCachedTransactions({
    accountId: account.accountId,
    booked: transactions.transactions.booked ?? [],
    pending: transactions.transactions.pending ?? [],
    updatedAt: new Date().toISOString(),
  }, workspace);
}

export async function GET(request: NextRequest) {
  const auth = requireAppKey(request);
  if (auth) return auth;
  if (!(await rateLimit("dashboard"))) {
    return new Response("Too many requests", { status: 429 });
  }

  const sync = request.nextUrl.searchParams.get("sync") === "true";
  const accountId = request.nextUrl.searchParams.get("accountId");
  const workspace = parseWorkspace(request);

  const settings = await getSettings(workspace);
  const allAccounts = await getAccounts(workspace);
  const activeAccounts = allAccounts.filter((item) => item.selected);
  const accounts = accountId
    ? activeAccounts.filter((item) => item.accountId === accountId)
    : activeAccounts;

  let syncStatus = await getDashboardSyncStatusForWorkspace(workspace);
  if (sync) {
    if (syncStatus.remaining === 0) {
      return NextResponse.json(
        { message: "Dashboard sync rate limit reached", sync: syncStatus },
        { status: 429 },
      );
    }
    try {
      for (const account of accounts) {
        await refreshAccount(account, workspace);
      }
    } catch (error) {
      const rawMessage =
        error instanceof Error
          ? error.message
          : "Unable to sync dashboard. Please try again.";
      const message = humanizeGoCardlessErrorMessage(rawMessage);
      return NextResponse.json(
        { message, sync: await getDashboardSyncStatusForWorkspace(workspace) },
        { status: 502 },
      );
    }
    if (accounts.length > 0) {
      syncStatus = await recordDashboardSync(workspace);
    }
  }

  const enrichedAccounts = await Promise.all(
    accounts.map(async (account) => {
      const cachedBalances = await getCachedBalances(account.accountId, workspace);
      const cachedTransactions = await getCachedTransactions(
        account.accountId,
        workspace,
      );
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
    sync: syncStatus,
  });
}

