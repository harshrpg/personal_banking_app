"use server";

import { revalidatePath } from "next/cache";

import { getAccounts, removeAccount, resetAllData, saveAccounts, saveSettings } from "@/db/store";
import { getRequiredEnv } from "@/lib/env";
import type { AppSettings } from "@/types/app";

export async function updateSettingsAction(formData: FormData) {
  const defaultCountry = (formData.get("defaultCountry") as "ie" | "gb") ?? "ie";
  const maxHistoricalDaysInput = Number(formData.get("maxHistoricalDays") ?? 90);
  const accessValidForDaysInput = Number(formData.get("accessValidForDays") ?? 90);
  const maxHistoricalDays = Number.isFinite(maxHistoricalDaysInput)
    ? maxHistoricalDaysInput
    : 90;
  const accessValidForDays = Number.isFinite(accessValidForDaysInput)
    ? accessValidForDaysInput
    : 90;

  const settings: AppSettings = {
    defaultCountry,
    maxHistoricalDays,
    accessValidForDays,
    maxAccounts: 3,
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
  await fetch(
    `${getRequiredEnv("APP_URL")}/api/dashboard?sync=true&accountId=${accountId}`,
    {
      headers: {
        "x-app-key": getRequiredEnv("APP_API_KEY"),
      },
      cache: "no-store",
    },
  );
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
}

export async function resetAllDataAction() {
  await resetAllData();
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/settings");
}

