"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { DashboardTopMetrics } from "@/types/app";

type TrendPoint = {
  period: string;
  income: number;
  expense: number;
  net: number;
};
type TopBottomPoint = {
  period: string;
  topLine: number;
  bottomLine: number;
  goal: number;
};
type SubscriptionLeakItem = {
  month: string;
  group: string;
  total: number;
  count: number;
  currency: string;
};

type BreakdownItem = {
  label: string;
  value: number;
};

type SubscriptionItem = {
  merchant: string;
  monthlyEstimate: number;
};

const CHART_COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#a855f7",
  "#f97316",
  "#f43f5e",
  "#eab308",
  "#14b8a6",
];

function formatCompactCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(value);
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTooltipCurrency(value: unknown, currency: string) {
  const numeric = typeof value === "number" ? value : Number(value ?? 0);
  return formatCurrency(Number.isFinite(numeric) ? numeric : 0, currency);
}

function formatPercent(value: number | null) {
  if (value === null) return "n/a";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function BusinessDashboardCharts({
  currency,
  metrics,
  topLine,
  bottomLine,
  annualGoal,
  annualRangeLabel,
  topBottomSeries,
  subscriptionLeaks,
  monthlyTrend,
  yearlyTrend,
  expenses,
  income,
  subscriptions,
}: {
  currency: string;
  metrics: DashboardTopMetrics;
  topLine: number;
  bottomLine: number;
  annualGoal: number;
  annualRangeLabel: string;
  topBottomSeries: TopBottomPoint[];
  subscriptionLeaks: SubscriptionLeakItem[];
  monthlyTrend: TrendPoint[];
  yearlyTrend: TrendPoint[];
  expenses: BreakdownItem[];
  income: BreakdownItem[];
  subscriptions: SubscriptionItem[];
}) {
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const trend = period === "monthly" ? monthlyTrend : yearlyTrend;
  const totalIncome = useMemo(
    () => trend.reduce((sum, item) => sum + item.income, 0),
    [trend],
  );
  const totalExpenses = useMemo(
    () => trend.reduce((sum, item) => sum + item.expense, 0),
    [trend],
  );
  const totalNet = totalIncome - totalExpenses;
  const enoughCashLabel =
    metrics.isCashEnough === null
      ? "n/a"
      : metrics.isCashEnough
        ? `Yes (${metrics.runwayThresholdMonths}m+ runway)`
        : `No (< ${metrics.runwayThresholdMonths}m runway)`;
  const topLineProgress = annualGoal > 0 ? Math.max(0, (topLine / annualGoal) * 100) : 0;
  const bottomLineProgress = annualGoal > 0 ? Math.max(0, (bottomLine / annualGoal) * 100) : 0;
  const vdpSubscriptions = subscriptions.filter((item) => item.merchant.startsWith("vdp"));
  const monthlySubscriptionLeakTrend = useMemo(() => {
    const monthTotals = new Map<string, number>();
    for (const row of subscriptionLeaks) {
      monthTotals.set(row.month, (monthTotals.get(row.month) ?? 0) + row.total);
    }
    return Array.from(monthTotals.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([month, total]) => ({ month, total }));
  }, [subscriptionLeaks]);
  const subscriptionLeaksByMonth = useMemo(() => {
    const monthMap = new Map<string, SubscriptionLeakItem[]>();
    for (const row of subscriptionLeaks) {
      const current = monthMap.get(row.month) ?? [];
      current.push(row);
      monthMap.set(row.month, current);
    }
    return Array.from(monthMap.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([month, rows]) => ({
        month,
        rows: rows.sort((a, b) => b.total - a.total),
      }));
  }, [subscriptionLeaks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Business Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monthly and yearly commercial views with income, expense, and subscription analysis.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-border/60 bg-card/70 p-1">
          <button
            type="button"
            onClick={() => setPeriod("monthly")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              period === "monthly"
                ? "bg-sky-600 text-white"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setPeriod("yearly")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              period === "yearly"
                ? "bg-sky-600 text-white"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            Yearly
          </button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/60 bg-card/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top line ({annualRangeLabel})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(topLine, currency)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Goal {formatCurrency(annualGoal, currency)} · {topLineProgress.toFixed(1)}%
                </p>
                <div className="mt-3 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(topLineProgress, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bottom line ({annualRangeLabel})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn("text-2xl font-semibold", bottomLine >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {formatCurrency(bottomLine, currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Goal {formatCurrency(annualGoal, currency)} · {bottomLineProgress.toFixed(1)}%
                </p>
                <div className="mt-3 h-2 rounded-full bg-muted">
                  <div
                    className={cn("h-2 rounded-full", bottomLine >= 0 ? "bg-sky-500" : "bg-rose-500")}
                    style={{ width: `${Math.min(bottomLineProgress, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Top line vs bottom line (YTD cumulative)</CardTitle>
            </CardHeader>
            <CardContent>
              {topBottomSeries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No settled YTD income/expense history to plot yet.
                </p>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={topBottomSeries} margin={{ top: 8, right: 12, left: 6, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                      <XAxis dataKey="period" />
                      <YAxis tickFormatter={(value) => formatCompactCurrency(value, currency)} />
                      <Tooltip formatter={(value) => formatTooltipCurrency(value, currency)} />
                      <Legend />
                      <ReferenceLine
                        y={annualGoal}
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        label={{ value: "Goal", position: "insideTopLeft" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="topLine"
                        stroke="#22c55e"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        name="Top line (cum.)"
                      />
                      <Line
                        type="monotone"
                        dataKey="bottomLine"
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        name="Bottom line (cum.)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Do we have enough cash?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-semibold",
                metrics.isCashEnough === null
                  ? "text-foreground"
                  : metrics.isCashEnough
                    ? "text-emerald-600"
                    : "text-rose-600",
              )}
            >
              {enoughCashLabel}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Runway:{" "}
              {metrics.cashRunwayMonths === null
                ? "n/a"
                : `${metrics.cashRunwayMonths.toFixed(1)} months`}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Are we making or losing money?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-semibold",
                metrics.profitabilityStatus === "losing" ? "text-rose-600" : "text-emerald-600",
              )}
            >
              {metrics.profitabilityStatus === "losing"
                ? "Losing"
                : metrics.profitabilityStatus === "making"
                  ? "Making"
                  : "Break-even"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Net this cycle: {formatCurrency(metrics.netInflowOutflow, currency)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Is revenue growing?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-semibold",
                (metrics.revenueGrowthMoM ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {formatPercent(metrics.revenueGrowthMoM)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              3-month trend: {formatPercent(metrics.revenueGrowth3m)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              How fast are we spending cash?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-rose-600">
              {formatCurrency(metrics.burnPerWeek, currency)}/wk
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatCurrency(metrics.burnPerDay, currency)}/day
            </p>
          </CardContent>
        </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {period === "monthly" ? "Income (12 months)" : "Income (5 years)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">
              {formatCurrency(totalIncome, currency)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {period === "monthly" ? "Expenses (12 months)" : "Expenses (5 years)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-rose-600">
              {formatCurrency(totalExpenses, currency)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net cash flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-semibold",
                totalNet >= 0 ? "text-emerald-600" : "text-rose-600",
              )}
            >
              {formatCurrency(totalNet, currency)}
            </p>
          </CardContent>
        </Card>
          </div>

          <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle className="text-base">
            Income vs expense trend ({period === "monthly" ? "monthly" : "yearly"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, left: 6, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="period" />
                <YAxis tickFormatter={(value) => formatCompactCurrency(value, currency)} />
                <Tooltip formatter={(value) => formatTooltipCurrency(value, currency)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Expense breakdown by counterparty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenses}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                  >
                    {expenses.map((item, index) => (
                      <Cell key={item.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value) => formatTooltipCurrency(value, currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Income breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={income}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                  >
                    {income.map((item, index) => (
                      <Cell key={item.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value) => formatTooltipCurrency(value, currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
          </div>
        </TabsContent>
        <TabsContent value="subscriptions" className="space-y-6">
          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Subscription leak trend by month</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlySubscriptionLeakTrend.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No subscription-like expenses detected yet.
                </p>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySubscriptionLeakTrend} margin={{ top: 8, right: 12, left: 6, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => formatCompactCurrency(value, currency)} />
                      <Tooltip formatter={(value) => formatTooltipCurrency(value, currency)} />
                      <Bar dataKey="total" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Monthly grouped subscriptions (leak table)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptionLeaksByMonth.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No grouped subscriptions to display yet.
                </p>
              ) : (
                subscriptionLeaksByMonth.map((monthBlock) => (
                  <div key={monthBlock.month} className="rounded-xl border border-border/60 bg-background/60 p-3">
                    <p className="mb-2 text-sm font-semibold">{monthBlock.month}</p>
                    <div className="space-y-1">
                      {monthBlock.rows.map((item) => (
                        <div
                          key={`${item.month}:${item.group}`}
                          className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm"
                        >
                          <span className="font-medium uppercase">{item.group}</span>
                          <span className="text-muted-foreground">{item.count} tx</span>
                          <span className="font-semibold text-rose-600">
                            {formatCurrency(item.total, item.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Subscription breakdown (monthly estimate)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subscriptions.map((item) => ({
                      merchant: item.merchant,
                      value: item.monthlyEstimate,
                    }))}
                    margin={{ top: 8, right: 12, left: 6, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                    <XAxis dataKey="merchant" />
                    <YAxis tickFormatter={(value) => formatCompactCurrency(value, currency)} />
                    <Tooltip formatter={(value) => formatTooltipCurrency(value, currency)} />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 rounded-xl border border-border/60 bg-background/60 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Counterparties starting with VDP
                </p>
                {vdpSubscriptions.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    No VDP-prefixed subscriptions detected.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1 text-sm">
                    {vdpSubscriptions.map((item) => (
                      <p key={item.merchant} className="flex items-center justify-between gap-2">
                        <span className="font-medium">{item.merchant.toUpperCase()}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(item.monthlyEstimate, currency)}/mo
                        </span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
