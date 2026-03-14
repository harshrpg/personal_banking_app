import "server-only";

import { NextRequest } from "next/server";

import { getEnrichedSelectedAccounts } from "@/lib/dashboard-data";
import { buildDashboardTopMetrics, normalizeTransactions } from "@/lib/finance";
import {
  buildXlsxBuffer,
  toMonthlySummaryCsv,
  toMonthlySummaryRows,
  toTransactionsCsv,
  toTransactionsRows,
} from "@/lib/finance-report";
import type { WorkspaceMode } from "@/types/app";

function parseWorkspace(request: NextRequest): WorkspaceMode {
  const raw = request.nextUrl.searchParams.get("workspace");
  return raw === "business" ? "business" : "personal";
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") ?? "transactions";
  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const workspace = parseWorkspace(request);

  const enriched = await getEnrichedSelectedAccounts(workspace);
  const transactions = normalizeTransactions(enriched);

  const csv =
    type === "monthly-summary"
      ? toMonthlySummaryCsv(enriched, transactions)
      : toTransactionsCsv(transactions);
  const xlsxRows =
    type === "monthly-summary"
      ? toMonthlySummaryRows(enriched, transactions)
      : toTransactionsRows(transactions);

  const metrics = buildDashboardTopMetrics(enriched, transactions);
  const fileName =
    type === "monthly-summary"
      ? `monthly-summary-${new Date().toISOString().slice(0, 10)}.${format}`
      : `transactions-${new Date().toISOString().slice(0, 10)}.${format}`;
  const contentType =
    format === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv; charset=utf-8";

  return new Response(format === "xlsx" ? buildXlsxBuffer(xlsxRows, type) : csv, {
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${fileName}"`,
      "x-report-net-inflow-outflow": metrics.netInflowOutflow.toFixed(2),
    },
  });
}
