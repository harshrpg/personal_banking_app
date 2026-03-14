import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { BusinessDashboardCharts } from "@/components/business-dashboard-charts";
import { Button } from "@/components/ui/button";
import { appFetch } from "@/lib/app-api";
import {
  buildMonthlySubscriptionLeaks,
  buildDashboardTopMetrics,
  buildIncomeBySource,
  buildMonthlyTrend,
  buildSpendByMerchant,
  buildYearlyTrend,
  detectSubscriptions,
  normalizeTransactions,
} from "@/lib/finance";
import type { DashboardResponse } from "@/types/app";

function prettyLabel(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function BusinessDashboardPage() {
  const data = await appFetch<DashboardResponse>("/api/dashboard?workspace=business");
  const accounts = data.accounts ?? [];
  const transactions = normalizeTransactions(accounts);
  const currency = (accounts[0]?.balances?.currency ??
    transactions[0]?.currency ??
    "EUR") as string;

  if (accounts.length === 0) {
    return (
      <AppShell workspace="business">
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 p-12 text-center">
          <h1 className="text-2xl font-semibold">Business dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your business bank account to unlock monthly/yearly analytics and exports.
          </p>
          <Button asChild className="mt-6">
            <Link href="/business/connect">Connect business account</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const monthlyTrend = buildMonthlyTrend(transactions, 12).map((item) => ({
    period: item.month,
    income: item.income,
    expense: item.expense,
    net: item.net,
  }));
  const metrics = buildDashboardTopMetrics(accounts, transactions);
  const yearlyTrend = buildYearlyTrend(transactions, 5);
  const expenses = buildSpendByMerchant(transactions, 7).map((item) => ({
    label: prettyLabel(item.merchant),
    value: item.value,
  }));
  const income = buildIncomeBySource(transactions, 7).map((item) => ({
    label: prettyLabel(item.merchant),
    value: item.value,
  }));
  const subscriptions = detectSubscriptions(transactions)
    .sort((a, b) => b.monthlyEstimate - a.monthlyEstimate)
    .slice(0, 8);
  const subscriptionLeaks = buildMonthlySubscriptionLeaks(transactions, 12);
  const settled = transactions.filter((item) => !item.pending);
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  const annual = settled.filter((item) => {
    const date = new Date(item.date);
    return date >= yearStart && date <= yearEnd;
  });
  const topLine = annual
    .filter((item) => item.kind === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const bottomLine = annual.reduce((sum, item) => {
    if (item.kind === "income") return sum + item.amount;
    if (item.kind === "expense") return sum - Math.abs(item.amount);
    return sum;
  }, 0);
  const annualGoal = 100_000;
  const annualRangeLabel = `${yearStart.toLocaleDateString("en-IE")} - ${yearEnd.toLocaleDateString("en-IE")}`;
  const ytdByMonth = new Map<string, { income: number; expense: number }>();
  for (const item of annual) {
    const date = new Date(item.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const current = ytdByMonth.get(key) ?? { income: 0, expense: 0 };
    if (item.kind === "income") current.income += item.amount;
    if (item.kind === "expense") current.expense += Math.abs(item.amount);
    ytdByMonth.set(key, current);
  }
  const topBottomSeries = Array.from(ytdByMonth.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .reduce<{
      cumulativeIncome: number;
      cumulativeNet: number;
      series: Array<{ period: string; topLine: number; bottomLine: number; goal: number }>;
    }>(
      (acc, [period, value]) => {
        const cumulativeIncome = acc.cumulativeIncome + value.income;
        const cumulativeNet = acc.cumulativeNet + value.income - value.expense;
        return {
          cumulativeIncome,
          cumulativeNet,
          series: [
            ...acc.series,
            {
              period,
              topLine: cumulativeIncome,
              bottomLine: cumulativeNet,
              goal: annualGoal,
            },
          ],
        };
      },
      { cumulativeIncome: 0, cumulativeNet: 0, series: [] },
    )
    .series;

  return (
    <AppShell workspace="business">
      <BusinessDashboardCharts
        currency={currency}
        metrics={metrics}
        topLine={topLine}
        bottomLine={bottomLine}
        annualGoal={annualGoal}
        annualRangeLabel={annualRangeLabel}
        topBottomSeries={topBottomSeries}
        subscriptionLeaks={subscriptionLeaks}
        monthlyTrend={monthlyTrend}
        yearlyTrend={yearlyTrend}
        expenses={expenses}
        income={income}
        subscriptions={subscriptions}
      />
    </AppShell>
  );
}
