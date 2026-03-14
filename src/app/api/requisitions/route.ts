import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { addRequisition, getAccounts, getSettings } from "@/db/store";
import { requireAppKey } from "@/lib/api-guard";
import { getRequiredEnv } from "@/lib/env";
import { createEndUserAgreement, createRequisition } from "@/lib/gocardless";
import { rateLimit } from "@/lib/rate-limit";
import type { WorkspaceMode } from "@/types/app";

function parseWorkspace(request: NextRequest): WorkspaceMode {
  const raw = request.nextUrl.searchParams.get("workspace");
  return raw === "business" ? "business" : "personal";
}

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

  const workspace = parseWorkspace(request);
  const settings = await getSettings(workspace);
  const existingAccounts = await getAccounts(workspace);
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
  const callbackPath =
    workspace === "business" ? "/business/connect/callback" : "/connect/callback";
  const redirectUrl = `${getRequiredEnv("APP_URL")}${callbackPath}?ref=${reference}&workspace=${workspace}`;
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
  }, workspace);

  return NextResponse.json({
    requisitionId: requisition.id,
    link: requisition.link,
  });
}

