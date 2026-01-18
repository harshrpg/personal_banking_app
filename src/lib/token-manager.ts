import "server-only";

import { KV_KEYS } from "@/db/keys";
import { getJson, setJson } from "@/db/kv";
import { getRequiredEnv } from "@/lib/env";
import type { ApiHealthStatus } from "@/types/app";
import type { GcTokenResponse } from "@/types/gocardless";

const GC_BASE_URL = "https://bankaccountdata.gocardless.com/api/v2";

async function updateTokenStatus(
  status: ApiHealthStatus["tokenStatus"],
  message?: string,
) {
  await setJson(KV_KEYS.tokenStatus, {
    tokenStatus: status,
    lastApiCall: undefined,
    message,
    updatedAt: new Date().toISOString(),
  } as ApiHealthStatus & { message?: string; updatedAt: string });
}

async function requestToken(payload: Record<string, string>) {
  const response = await fetch(`${GC_BASE_URL}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    await updateTokenStatus("error", `token/new failed: ${response.status}`);
    throw new Error(`GoCardless token/new failed: ${response.status}`);
  }

  return (await response.json()) as GcTokenResponse;
}

async function refreshToken(refresh: string) {
  const response = await fetch(`${GC_BASE_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  if (!response.ok) {
    await updateTokenStatus("error", `token/refresh failed: ${response.status}`);
    throw new Error(`GoCardless token/refresh failed: ${response.status}`);
  }

  return (await response.json()) as Pick<GcTokenResponse, "access" | "access_expires">;
}

export async function initializeToken(): Promise<void> {
  const secretId = getRequiredEnv("GC_SECRET_ID");
  const secretKey = getRequiredEnv("GC_SECRET_KEY");

  await updateTokenStatus("refreshing");
  const token = await requestToken({
    secret_id: secretId,
    secret_key: secretKey,
  });

  await setJson(KV_KEYS.refreshToken, token.refresh);
  await setJson(KV_KEYS.accessToken, token.access);
  await setJson(KV_KEYS.accessTokenExpiresAt, Date.now() + token.access_expires * 1000);
  await updateTokenStatus("ready");
}

export async function getAccessToken(): Promise<string> {
  const accessToken = await getJson<string>(KV_KEYS.accessToken);
  const accessTokenExpiresAt = await getJson<number>(
    KV_KEYS.accessTokenExpiresAt,
  );

  const now = Date.now();
  if (accessToken && accessTokenExpiresAt && accessTokenExpiresAt > now + 60_000) {
    return accessToken;
  }

  const refreshTokenValue = await getJson<string>(KV_KEYS.refreshToken);
  if (!refreshTokenValue) {
    await updateTokenStatus("missing");
    throw new Error("Missing refresh token. Initialize token first.");
  }

  await updateTokenStatus("refreshing");
  const refreshed = await refreshToken(refreshTokenValue);
  await setJson(KV_KEYS.accessToken, refreshed.access);
  await setJson(
    KV_KEYS.accessTokenExpiresAt,
    Date.now() + refreshed.access_expires * 1000,
  );
  await updateTokenStatus("ready");
  return refreshed.access;
}

