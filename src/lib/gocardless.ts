import "server-only";

import { KV_KEYS } from "@/db/keys";
import { setJson } from "@/db/kv";
import { getAccessToken } from "@/lib/token-manager";
import type {
  GcAccountBalancesResponse,
  GcAccountDetailsResponse,
  GcAccountTransactionsResponse,
  GcAgreementResponse,
  GcCountryCode,
  GcInstitution,
  GcRequisitionResponse,
} from "@/types/gocardless";

const GC_BASE_URL = "https://bankaccountdata.gocardless.com/api/v2";

async function recordApiCall(path: string, ok: boolean, status: number) {
  await setJson(KV_KEYS.lastApiCall, {
    path,
    ok,
    status,
    at: new Date().toISOString(),
  });
}

async function gcFetch<T>(
  path: string,
  init?: RequestInit,
  options?: { auth?: boolean },
): Promise<T> {
  const authEnabled = options?.auth !== false;
  const accessToken = authEnabled ? await getAccessToken() : null;
  const response = await fetch(`${GC_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  await recordApiCall(path, response.ok, response.status);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GoCardless error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export async function listInstitutions(country: GcCountryCode) {
  return gcFetch<GcInstitution[]>(`/institutions/?country=${country}`);
}

export async function createEndUserAgreement(input: {
  institutionId: string;
  maxHistoricalDays: number;
  accessValidForDays: number;
  accessScope: string[];
}) {
  return gcFetch<GcAgreementResponse>("/agreements/enduser/", {
    method: "POST",
    body: JSON.stringify({
      institution_id: input.institutionId,
      max_historical_days: input.maxHistoricalDays,
      access_valid_for_days: input.accessValidForDays,
      access_scope: input.accessScope,
    }),
  });
}

export async function createRequisition(input: {
  institutionId: string;
  agreementId: string;
  reference: string;
  redirectUrl: string;
}) {
  return gcFetch<GcRequisitionResponse>("/requisitions/", {
    method: "POST",
    body: JSON.stringify({
      redirect: input.redirectUrl,
      institution_id: input.institutionId,
      reference: input.reference,
      agreement: input.agreementId,
    }),
  });
}

export async function getRequisition(requisitionId: string) {
  return gcFetch<GcRequisitionResponse>(`/requisitions/${requisitionId}/`);
}

export async function getAccountDetails(accountId: string) {
  return gcFetch<GcAccountDetailsResponse>(`/accounts/${accountId}/details/`);
}

export async function getAccountBalances(accountId: string) {
  return gcFetch<GcAccountBalancesResponse>(`/accounts/${accountId}/balances/`);
}

export async function getAccountTransactions(accountId: string) {
  return gcFetch<GcAccountTransactionsResponse>(
    `/accounts/${accountId}/transactions/`,
  );
}

