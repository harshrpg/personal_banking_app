import { AppShell } from "@/components/app-shell";
import { AccountCard } from "@/components/account-card";
import { DashboardSyncButton } from "@/components/dashboard-sync-button";
import { FixedVariablesPanel } from "@/components/fixed-variables-panel";
import { InsightsPanel } from "@/components/insights-panel";
import { SubscriptionsPanel } from "@/components/subscriptions-panel";
import { TransactionsTable } from "@/components/transactions-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appFetch } from "@/lib/app-api";
import { fromDetectedFixedExpenses, fromDetectedSubscriptions } from "@/lib/costs";
import {
  buildDashboardTopMetrics,
  buildThursdayMonthlyTrend,
  buildSpendByCategory,
  buildSpendByMerchant,
  detectAnomalies,
  detectFixedExpenses,
  detectSubscriptions,
  getCurrentThursdayMonthWindow,
  normalizeTransactions,
} from "@/lib/finance";
import type { DashboardResponse } from "@/types/app";

function buildLinePoints(values: number[], width: number, height: number, padding: number) {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const min = 0;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  return values
    .map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : padding + (index / (values.length - 1)) * innerWidth;
      const normalized = (value - min) / (max - min || 1);
      const y = padding + innerHeight - normalized * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const tabParam =
    typeof params?.tab === "string" ? params.tab : undefined;
  const allowedTabs = [
    "transactions",
    "insights",
    "subscriptions",
    "fixed-variables",
  ];
  const initialTab = allowedTabs.includes(tabParam ?? "")
    ? (tabParam as string)
    : "transactions";
  const data = await appFetch<DashboardResponse>("/api/dashboard");
  const accounts = data.accounts ?? [];
  const transactions = normalizeTransactions(accounts);
  const settledTransactions = transactions.filter((item) => !item.pending);
  const metrics = buildDashboardTopMetrics(accounts, transactions);
  const categories = buildSpendByCategory(transactions, 5);
  const merchants = buildSpendByMerchant(transactions, 5);
  const trend = buildThursdayMonthlyTrend(transactions, 6);
  const currentMonthSpend = trend.at(-1)?.expense ?? 0;
  const lastMonthSpend = trend.at(-2)?.expense ?? 0;
  const currentWindow = getCurrentThursdayMonthWindow(new Date());
  const currentWindowTransactions = settledTransactions.filter((item) => {
    const date = new Date(item.date);
    return date >= currentWindow.start && date <= currentWindow.effectiveEnd;
  });
  const currentMonthInflow = currentWindowTransactions.reduce(
    (sum, item) => (item.amount > 0 ? sum + item.amount : sum),
    0,
  );
  const currentMonthOutflow = currentWindowTransactions.reduce(
    (sum, item) => (item.amount < 0 ? sum + Math.abs(item.amount) : sum),
    0,
  );
  const inflowSeries = trend.map((item) => item.income);
  const outflowSeries = trend.map((item) => item.expense);
  const chartValues = [...inflowSeries, ...outflowSeries];
  const chartWidth = 720;
  const chartHeight = 220;
  const chartPadding = 24;
  const inflowPoints = buildLinePoints(inflowSeries, chartWidth, chartHeight, chartPadding);
  const outflowPoints = buildLinePoints(outflowSeries, chartWidth, chartHeight, chartPadding);
  const anomalies = detectAnomalies(transactions, 3);
  const detectedSubscriptions = fromDetectedSubscriptions(detectSubscriptions(transactions));
  const detectedFixed = fromDetectedFixedExpenses(detectFixedExpenses(transactions));
  const syncStatus = data.sync;
  const currency = (accounts[0]?.balances?.currency ??
    transactions[0]?.currency ??
    "EUR") as string;
  const totalInflowToDate = settledTransactions.reduce(
    (sum, item) => (item.amount > 0 ? sum + item.amount : sum),
    0,
  );
  const totalOutflowToDate = settledTransactions.reduce(
    (sum, item) => (item.amount < 0 ? sum + Math.abs(item.amount) : sum),
    0,
  );
  const dashboardTransactions = transactions.map((item) => ({
    id: item.id,
    date: item.date,
    name: item.name,
    amount: item.amount,
    currency: item.currency,
    accountId: item.accountId,
    accountName: item.accountName,
  }));

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
              <p className="text-sm text-muted-foreground">Inflow to date</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600">
                {new Intl.NumberFormat("en-IE", {
                  style: "currency",
                  currency,
                }).format(totalInflowToDate)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Total money that entered your account(s).
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
              <p className="text-sm text-muted-foreground">Outflow to date</p>
              <p className="mt-2 text-2xl font-semibold text-red-500">
                {new Intl.NumberFormat("en-IE", {
                  style: "currency",
                  currency,
                }).format(totalOutflowToDate)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Total money that left your account(s).
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
              <p className="text-sm text-muted-foreground">Inflow this month</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600">
                {new Intl.NumberFormat("en-IE", {
                  style: "currency",
                  currency,
                }).format(currentMonthInflow)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Settled credits in the Thursday monthly cycle.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
              <p className="text-sm text-muted-foreground">Outflow this month</p>
              <p className="mt-2 text-2xl font-semibold text-red-500">
                {new Intl.NumberFormat("en-IE", {
                  style: "currency",
                  currency,
                }).format(currentMonthOutflow)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Settled debits in the Thursday monthly cycle.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card/70 p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Inflow vs outflow trend</p>
                <p className="text-xs text-muted-foreground">
                  Monthly cycle: last Thursday to last Thursday (last {trend.length} cycles).
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Inflow
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Outflow
                </span>
              </div>
            </div>
            {trend.length === 0 || Math.max(...chartValues, 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not enough settled transaction history to draw the trend yet.
              </p>
            ) : (
              <>
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-56 w-full rounded-xl border border-border/60 bg-background/40"
                  role="img"
                  aria-label="Monthly inflow and outflow line chart"
                >
                  <line
                    x1={chartPadding}
                    y1={chartHeight - chartPadding}
                    x2={chartWidth - chartPadding}
                    y2={chartHeight - chartPadding}
                    className="stroke-border"
                  />
                  <polyline
                    fill="none"
                    stroke="rgb(16 185 129)"
                    strokeWidth="3"
                    points={inflowPoints}
                  />
                  <polyline
                    fill="none"
                    stroke="rgb(239 68 68)"
                    strokeWidth="3"
                    points={outflowPoints}
                  />
                </svg>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground md:grid-cols-6">
                  {trend.map((item) => (
                    <div key={item.month} className="rounded-lg border border-border/60 px-2 py-1">
                      <p>{item.month}</p>
                      <p>
                        +{new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(item.income)}
                      </p>
                      <p>
                        -{new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(item.expense)}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Current cycle window: {currentWindow.label}
                </p>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total balance</p>
              <h1 className="text-3xl font-semibold">
                {new Intl.NumberFormat("en-IE", {
                  style: "currency",
                  currency,
                }).format(metrics.totalBalance)}
              </h1>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground md:grid-cols-4">
                <span>
                  Available cash:{" "}
                  {new Intl.NumberFormat("en-IE", {
                    style: "currency",
                    currency,
                  }).format(metrics.availableCash)}
                </span>
                <span>
                  Net inflow/outflow:{" "}
                  {new Intl.NumberFormat("en-IE", {
                    style: "currency",
                    currency,
                  }).format(metrics.netInflowOutflow)}
                </span>
                <span>Savings rate: {metrics.savingsRate.toFixed(1)}%</span>
                <span>
                  Cash runway:{" "}
                  {metrics.cashRunwayMonths === null
                    ? "n/a"
                    : `${metrics.cashRunwayMonths.toFixed(1)} months`}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-2 text-xs text-muted-foreground">
                {accounts.length} of 3 accounts connected
              </div>
              <DashboardSyncButton sync={syncStatus} accountsCount={accounts.length} />
            </div>
          </div>
          {accounts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 p-12 text-center text-sm text-muted-foreground">
              No accounts connected yet. Head to Connect to get started.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {accounts.map((account) => (
                <AccountCard key={account.accountId} account={account} />
              ))}
            </div>
          )}
        </section>

        <section>
          <Tabs defaultValue={initialTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="fixed-variables">Fixed variables</TabsTrigger>
            </TabsList>
            <TabsContent value="transactions">
              <TransactionsTable transactions={dashboardTransactions} />
            </TabsContent>
            <TabsContent value="insights">
              <InsightsPanel
                categories={categories}
                merchants={merchants}
                currentMonthSpend={currentMonthSpend}
                lastMonthSpend={lastMonthSpend}
                anomalies={anomalies}
                currency={currency}
              />
            </TabsContent>
            <TabsContent value="subscriptions">
              <SubscriptionsPanel items={detectedSubscriptions} currency={currency} />
            </TabsContent>
            <TabsContent value="fixed-variables">
              <FixedVariablesPanel items={detectedFixed} currency={currency} />
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </AppShell>
  );
}

