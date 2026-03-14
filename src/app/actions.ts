"use server";

import { revalidatePath } from "next/cache";

import {
  getAccounts,
  getBudgets,
  getCategoryRules,
  getInvestments,
  getSavingsGoals,
  getTransactionAnnotations,
  removeAccount,
  resetAllData,
  saveAccounts,
  saveBudgets,
  saveCategoryRules,
  saveInvestments,
  saveSavingsGoals,
  saveSettings,
  saveTransactionAnnotations,
} from "@/db/store";
import { getRequiredEnv } from "@/lib/env";
import type {
  AppSettings,
  BudgetItem,
  CategorizationRule,
  DashboardSyncStatus,
  InvestmentHolding,
  SavingsGoal,
} from "@/types/app";

export type SyncDashboardActionState = {
  ok: boolean;
  message?: string;
  sync?: DashboardSyncStatus;
};

export async function updateSettingsAction(formData: FormData) {
  const defaultCountry = (formData.get("defaultCountry") as "ie" | "gb") ?? "ie";
  const maxHistoricalDaysInput = Number(formData.get("maxHistoricalDays") ?? 90);
  const accessValidForDaysInput = Number(formData.get("accessValidForDays") ?? 90);
  const recurringRuleSensitivity =
    (formData.get("recurringRuleSensitivity") as "low" | "medium" | "high") ?? "medium";
  const merchantAliasMode =
    (formData.get("merchantAliasMode") as "strict" | "balanced" | "loose") ?? "balanced";
  const aiTone =
    (formData.get("aiTone") as "strict" | "coach" | "neutral") ?? "neutral";
  const budgetAlertThresholdInput = Number(formData.get("budgetAlertThreshold") ?? 85);
  const notificationsEnabled = String(formData.get("notificationsEnabled") ?? "") === "on";
  const privacyMode =
    (formData.get("privacyMode") as "standard" | "minimal") ?? "standard";
  const maxHistoricalDays = Number.isFinite(maxHistoricalDaysInput)
    ? Math.min(Math.max(maxHistoricalDaysInput, 1), 365)
    : 90;
  const accessValidForDays = Number.isFinite(accessValidForDaysInput)
    ? Math.min(Math.max(accessValidForDaysInput, 1), 365)
    : 90;
  const budgetAlertThreshold = Number.isFinite(budgetAlertThresholdInput)
    ? Math.min(Math.max(budgetAlertThresholdInput, 1), 200)
    : 85;

  const settings: AppSettings = {
    defaultCountry,
    maxHistoricalDays,
    accessValidForDays,
    maxAccounts: 3,
    recurringRuleSensitivity,
    merchantAliasMode,
    budgetAlertThreshold,
    notificationsEnabled,
    privacyMode,
    aiTone,
  };
  await saveSettings(settings);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function updateAccountAliasAction(formData: FormData) {
  const accountId = String(formData.get("accountId"));
  const alias = String(formData.get("alias") ?? "");
  const accounts = await getAccounts();
  const updated = accounts.map((account) =>
    account.accountId === accountId
      ? { ...account, alias: alias || undefined }
      : account,
  );
  await saveAccounts(updated);
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function deleteAccountAction(formData: FormData) {
  const accountId = String(formData.get("accountId"));
  await removeAccount(accountId);
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

export async function syncAccountAction(formData: FormData) {
  const accountId = String(formData.get("accountId"));
  const response = await fetch(
    `${getRequiredEnv("APP_URL")}/api/dashboard?sync=true&accountId=${accountId}`,
    {
      headers: {
        "x-app-key": getRequiredEnv("APP_API_KEY"),
      },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(await response.text());
  }
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
}

export async function syncDashboardAction(
  _prevState: SyncDashboardActionState,
  _formData: FormData,
): Promise<SyncDashboardActionState> {
  try {
    const response = await fetch(`${getRequiredEnv("APP_URL")}/api/dashboard?sync=true`, {
      headers: {
        "x-app-key": getRequiredEnv("APP_API_KEY"),
      },
      cache: "no-store",
    });
    const text = await response.text();
    let parsed: { sync?: DashboardSyncStatus; message?: string } | undefined;
    try {
      parsed = JSON.parse(text) as { sync?: DashboardSyncStatus; message?: string };
    } catch {
      parsed = undefined;
    }
    if (!response.ok) {
      return {
        ok: false,
        message: parsed?.message ?? text ?? "Unable to sync dashboard.",
        sync: parsed?.sync,
      };
    }
    if (parsed?.sync) {
      revalidatePath("/dashboard");
      revalidatePath("/accounts");
    }
    return { ok: true, sync: parsed?.sync };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to sync dashboard.",
    };
  }
}

export async function resetAllDataAction() {
  await resetAllData();
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/settings");
}

export async function annotateTransactionAction(formData: FormData) {
  const transactionId = String(formData.get("transactionId") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "").trim();
  const splitCountInput = Number(formData.get("splitCount") ?? "1");
  if (!transactionId) return;
  const current = await getTransactionAnnotations();
  current[transactionId] = {
    ...current[transactionId],
    category: category || undefined,
    notes: notes || undefined,
    tags: tagsRaw
      ? tagsRaw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined,
    splitCount: Number.isFinite(splitCountInput) && splitCountInput > 0 ? splitCountInput : 1,
  };
  await saveTransactionAnnotations(current);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function upsertCategoryRuleAction(formData: FormData) {
  const match = String(formData.get("match") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  if (!match || !category) return;
  const essential = String(formData.get("essential") ?? "") === "on";
  const fixed = String(formData.get("fixed") ?? "") === "on";
  const rules = await getCategoryRules();
  const rule: CategorizationRule = {
    id: `${Date.now()}`,
    match,
    category,
    essential,
    fixed,
    updatedAt: new Date().toISOString(),
  };
  rules.unshift(rule);
  await saveCategoryRules(rules);
  revalidatePath("/transactions");
  revalidatePath("/settings");
}

export async function saveBudgetAction(formData: FormData) {
  const category = String(formData.get("category") ?? "").trim();
  const monthlyBudget = Number(formData.get("monthlyBudget") ?? "0");
  if (!category || !Number.isFinite(monthlyBudget) || monthlyBudget <= 0) return;
  const rolloverEnabled = String(formData.get("rolloverEnabled") ?? "") === "on";
  const budgets = await getBudgets();
  const next: BudgetItem = { category, monthlyBudget, rolloverEnabled };
  const existing = budgets.findIndex((item) => item.category === category);
  if (existing >= 0) budgets[existing] = next;
  else budgets.push(next);
  await saveBudgets(budgets);
  revalidatePath("/budgets");
}

export async function saveSavingsGoalAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = Number(formData.get("targetAmount") ?? "0");
  const currentAmount = Number(formData.get("currentAmount") ?? "0");
  const targetDate = String(formData.get("targetDate") ?? "");
  if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0 || !targetDate) return;
  const goals = await getSavingsGoals();
  const goal: SavingsGoal = {
    id: `${Date.now()}`,
    name,
    targetAmount,
    currentAmount: Number.isFinite(currentAmount) ? currentAmount : 0,
    targetDate,
  };
  goals.unshift(goal);
  await saveSavingsGoals(goals);
  revalidatePath("/savings");
}

export async function saveInvestmentHoldingAction(formData: FormData) {
  const symbol = String(formData.get("symbol") ?? "").trim();
  const account = String(formData.get("account") ?? "").trim();
  const units = Number(formData.get("units") ?? "0");
  const costBasis = Number(formData.get("costBasis") ?? "0");
  const currentValue = Number(formData.get("currentValue") ?? "0");
  const dividendsYtd = Number(formData.get("dividendsYtd") ?? "0");
  if (!symbol || !account || !Number.isFinite(units) || units <= 0) return;
  const holdings = await getInvestments();
  const holding: InvestmentHolding = {
    id: `${Date.now()}`,
    symbol,
    account,
    units,
    costBasis: Number.isFinite(costBasis) ? costBasis : 0,
    currentValue: Number.isFinite(currentValue) ? currentValue : 0,
    dividendsYtd: Number.isFinite(dividendsYtd) ? dividendsYtd : 0,
  };
  holdings.unshift(holding);
  await saveInvestments(holdings);
  revalidatePath("/investments");
}

