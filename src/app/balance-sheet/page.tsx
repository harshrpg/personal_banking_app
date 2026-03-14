import { AppShell } from "@/components/app-shell";
import { BalanceSheetPanel } from "@/components/balance-sheet-panel";
import { appFetch } from "@/lib/app-api";
import { buildDashboardTopMetrics, buildPeriodRollups, normalizeTransactions } from "@/lib/finance";
import type { DashboardResponse, FinancePeriod } from "@/types/app";

const PERIODS: FinancePeriod[] = ["daily", "weekly", "monthly", "yearly"];

export default async function BalanceSheetPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const period = PERIODS.includes(params?.period as FinancePeriod)
    ? (params?.period as FinancePeriod)
    : "monthly";
  const data = await appFetch<DashboardResponse>("/api/dashboard");
  const transactions = normalizeTransactions(data.accounts);
  const metrics = buildDashboardTopMetrics(data.accounts, transactions);
  const rollups = buildPeriodRollups(period, transactions, metrics.totalBalance);
  const currency = data.accounts[0]?.balances?.currency ?? "EUR";

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Balance sheet</h1>
          <p className="text-muted-foreground">
            Deterministic periodized opening/closing balances and flow breakdowns.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((item) => (
            <a
              key={item}
              href={`/balance-sheet?period=${item}`}
              className={`rounded-xl border px-3 py-1.5 text-sm ${
                item === period ? "border-primary bg-primary text-primary-foreground" : "border-border/60"
              }`}
            >
              {item}
            </a>
          ))}
        </div>
        <BalanceSheetPanel period={period} rows={rollups} currency={currency} />
      </div>
    </AppShell>
  );
}

