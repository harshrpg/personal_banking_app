import type { DashboardAccount, FinancePeriod, FinanceTransaction } from "@/types/app";
import * as XLSX from "xlsx";
import {
  buildDashboardTopMetrics,
  buildMonthlyTrend,
  buildPeriodRollups,
  buildSpendByCategory,
  buildSpendByMerchant,
  detectAnomalies,
  detectSubscriptions,
  normalizeTransactions,
} from "@/lib/finance";

function csvEscape(value: string | number | boolean) {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toTransactionsCsv(transactions: FinanceTransaction[]) {
  const header = [
    "id",
    "date",
    "merchant",
    "amount",
    "currency",
    "account",
    "category",
    "kind",
    "pending",
  ];
  const rows = transactions.map((item) => [
    item.id,
    item.date,
    item.name,
    item.amount,
    item.currency,
    item.accountName,
    item.category,
    item.kind,
    item.pending,
  ]);
  return [header, ...rows]
    .map((row) => row.map((value) => csvEscape(value)).join(","))
    .join("\n");
}

export function toTransactionsRows(transactions: FinanceTransaction[]) {
  return transactions.map((item) => ({
    id: item.id,
    date: item.date,
    merchant: item.name,
    amount: item.amount,
    currency: item.currency,
    account: item.accountName,
    category: item.category,
    kind: item.kind,
    pending: item.pending,
  }));
}

export function toMonthlySummaryCsv(
  accounts: DashboardAccount[],
  transactions: FinanceTransaction[],
) {
  const currency = accounts[0]?.balances?.currency ?? "EUR";
  const metrics = buildDashboardTopMetrics(accounts, transactions);
  const monthly = buildPeriodRollups("monthly", transactions, metrics.totalBalance);
  const header = [
    "period",
    "opening_balance",
    "income",
    "expenses",
    "transfers",
    "savings",
    "investments",
    "closing_balance",
    "delta_vs_prior",
    "currency",
  ];
  const rows = monthly.map((row) => [
    row.label,
    row.openingBalance,
    row.income,
    row.expenses,
    row.transfers,
    row.savingsContribution,
    row.investmentsAdded,
    row.closingBalance,
    row.deltaVsPriorPeriod,
    currency,
  ]);
  return [header, ...rows]
    .map((row) => row.map((value) => csvEscape(value)).join(","))
    .join("\n");
}

export function toMonthlySummaryRows(
  accounts: DashboardAccount[],
  transactions: FinanceTransaction[],
) {
  const currency = accounts[0]?.balances?.currency ?? "EUR";
  const metrics = buildDashboardTopMetrics(accounts, transactions);
  const monthly = buildPeriodRollups("monthly", transactions, metrics.totalBalance);
  return monthly.map((row) => ({
    period: row.label,
    opening_balance: row.openingBalance,
    income: row.income,
    expenses: row.expenses,
    transfers: row.transfers,
    savings: row.savingsContribution,
    investments: row.investmentsAdded,
    closing_balance: row.closingBalance,
    delta_vs_prior: row.deltaVsPriorPeriod,
    currency,
  }));
}

export function buildXlsxBuffer(rows: Record<string, unknown>[], sheetName: string) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function buildFinanceSummary(accounts: DashboardAccount[], period: FinancePeriod) {
  const transactions = normalizeTransactions(accounts);
  const metrics = buildDashboardTopMetrics(accounts, transactions);
  const rollups = buildPeriodRollups(period, transactions, metrics.totalBalance);
  const latest = rollups.at(-1);
  const categories = buildSpendByCategory(transactions, 5);
  const merchants = buildSpendByMerchant(transactions, 5);
  const trend = buildMonthlyTrend(transactions, 6);
  const anomalies = detectAnomalies(transactions, 5);
  const subscriptions = detectSubscriptions(transactions);
  return {
    period,
    metrics,
    latestRollup: latest,
    topCategories: categories,
    topMerchants: merchants,
    trend,
    anomalies,
    subscriptions,
    summaryText: buildPlainEnglishSummary(metrics, categories, merchants, anomalies),
  };
}

function buildPlainEnglishSummary(
  metrics: ReturnType<typeof buildDashboardTopMetrics>,
  categories: ReturnType<typeof buildSpendByCategory>,
  merchants: ReturnType<typeof buildSpendByMerchant>,
  anomalies: ReturnType<typeof detectAnomalies>,
) {
  const topCategory = categories[0];
  const topMerchant = merchants[0];
  const anomalyLine =
    anomalies.length > 0
      ? `Largest unusual spend: ${anomalies[0].merchant} at ${anomalies[0].amount.toFixed(2)}.`
      : "No strong anomalies detected in current data.";
  return [
    `Net monthly inflow/outflow is ${metrics.netInflowOutflow.toFixed(2)}.`,
    `Savings rate is ${metrics.savingsRate.toFixed(1)}%.`,
    metrics.cashRunwayMonths === null
      ? "Cash runway is currently not available because monthly burn is zero."
      : `Cash runway is ${metrics.cashRunwayMonths.toFixed(1)} months (${metrics.isCashEnough ? "above" : "below"} the ${metrics.runwayThresholdMonths}-month threshold).`,
    `Profitability status is ${metrics.profitabilityStatus}.`,
    metrics.revenueGrowthMoM === null
      ? "Revenue growth MoM is not available yet."
      : `Revenue growth MoM is ${metrics.revenueGrowthMoM.toFixed(1)}%.`,
    metrics.revenueGrowth3m === null
      ? "Revenue growth trend is not available yet."
      : `Revenue growth (rolling window) is ${metrics.revenueGrowth3m.toFixed(1)}%.`,
    `Burn speed is ${metrics.burnPerDay.toFixed(2)} per day (${metrics.burnPerWeek.toFixed(2)} per week).`,
    topCategory
      ? `Top spending category is ${topCategory.category} (${topCategory.value.toFixed(2)}).`
      : "No category spend detected yet.",
    topMerchant
      ? `Top merchant concentration is ${topMerchant.merchant} (${topMerchant.value.toFixed(2)}).`
      : "No merchant spend concentration detected yet.",
    anomalyLine,
  ].join(" ");
}
