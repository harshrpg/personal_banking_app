import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { addRequisition, getAccounts, getSettings } from "@/db/store";
import { requireAppKey } from "@/lib/api-guard";
import { getRequiredEnv } from "@/lib/env";
import { createEndUserAgreement, createRequisition } from "@/lib/gocardless";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const auth = requireAppKey(request);
  if (auth) return auth;
  if (!(await rateLimit("requisitions:create"))) {
    return new Response("Too many requests", { status: 429 });
  }

  const payload = (await request.json()) as { institutionId?: string };
  if (!payload.institutionId) {
    return new Response("institutionId required", { status: 400 });
  }

  const settings = await getSettings();
  const existingAccounts = await getAccounts();
  if (existingAccounts.length >= settings.maxAccounts) {
    return new Response("Max accounts connected", { status: 400 });
  }

  const agreement = await createEndUserAgreement({
    institutionId: payload.institutionId,
    maxHistoricalDays: settings.maxHistoricalDays,
    accessValidForDays: settings.accessValidForDays,
    accessScope: ["balances", "details", "transactions"],
  });

  const reference = `req_${Date.now()}`;
  const redirectUrl = `${getRequiredEnv("APP_URL")}/connect/callback?ref=${reference}`;
  const requisition = await createRequisition({
    institutionId: payload.institutionId,
    agreementId: agreement.id,
    reference,
    redirectUrl,
  });

  await addRequisition({
    id: requisition.id,
    institutionId: payload.institutionId,
    reference,
    createdAt: new Date().toISOString(),
    status: requisition.status,
    accounts: requisition.accounts ?? [],
  });

  return NextResponse.json({
    requisitionId: requisition.id,
    link: requisition.link,
  });
}

