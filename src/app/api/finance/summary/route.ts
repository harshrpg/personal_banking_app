import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { requireAppKey } from "@/lib/api-guard";
import { getEnrichedSelectedAccounts } from "@/lib/dashboard-data";
import { buildFinanceSummary } from "@/lib/finance-report";
import type { FinancePeriod, WorkspaceMode } from "@/types/app";

const PERIODS: FinancePeriod[] = ["daily", "weekly", "monthly", "yearly"];

function parseWorkspace(request: NextRequest): WorkspaceMode {
  const raw = request.nextUrl.searchParams.get("workspace");
  return raw === "business" ? "business" : "personal";
}

export async function GET(request: NextRequest) {
  const auth = requireAppKey(request);
  if (auth) return auth;

  const periodParam = request.nextUrl.searchParams.get("period");
  const period = PERIODS.includes(periodParam as FinancePeriod)
    ? (periodParam as FinancePeriod)
    : "monthly";
  const workspace = parseWorkspace(request);

  const enriched = await getEnrichedSelectedAccounts(workspace);

  const summary = buildFinanceSummary(enriched, period);
  return NextResponse.json(summary);
}
