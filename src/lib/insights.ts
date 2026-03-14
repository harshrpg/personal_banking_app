import type { DashboardTransaction } from "@/components/transactions-table";
import {
  buildMonthlyTrend,
  buildSpendByCategory,
  buildSpendByMerchant,
  detectAnomalies,
} from "@/lib/finance";
import type { FinanceTransaction } from "@/types/app";

export function buildInsights(transactions: DashboardTransaction[]) {
  const normalized: FinanceTransaction[] = transactions.map((item) => ({
    id: item.id,
    accountId: item.accountId,
    accountName: item.accountName,
    date: item.date,
    name: item.name,
    amount: item.amount,
    currency: item.currency,
    pending: false,
    category: "Miscellaneous",
    kind: item.amount >= 0 ? "income" : "expense",
    normalizedMerchant: item.name.toLowerCase(),
  }));

  const categories = buildSpendByCategory(normalized, 5);
  const merchants = buildSpendByMerchant(normalized, 5).map((item) => ({
    merchant: item.merchant,
    value: item.value,
  }));
  const monthly = buildMonthlyTrend(normalized, 2);
  const current = monthly.at(-1);
  const previous = monthly.at(-2);
  const anomalies = detectAnomalies(normalized, 3);

  return {
    categories,
    merchants,
    currentMonthSpend: current?.expense ?? 0,
    lastMonthSpend: previous?.expense ?? 0,
    anomalies,
  };
}



