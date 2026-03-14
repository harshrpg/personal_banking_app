import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEnrichedSelectedAccounts } from "@/lib/dashboard-data";
import {
  buildMonthlyTrend,
  buildSpendByCategory,
  buildSpendByMerchant,
  detectAnomalies,
  normalizeTransactions,
} from "@/lib/finance";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);
}

export default async function AnalyticsPage() {
  const accounts = await getEnrichedSelectedAccounts();
  const transactions = normalizeTransactions(accounts);
  const trend = buildMonthlyTrend(transactions, 12);
  const categories = buildSpendByCategory(transactions, 10);
  const merchants = buildSpendByMerchant(transactions, 10);
  const anomalies = detectAnomalies(transactions, 12);
  const currency = transactions[0]?.currency ?? "EUR";

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Analytics</h1>
          <p className="text-muted-foreground">
            Income vs expense trends, concentration, and notable spend changes.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Income vs expense trend</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Income</TableHead>
                    <TableHead className="text-right">Expense</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trend.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell>{row.month}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.income, currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.expense, currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.net, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Top categories (monthly style breakdown)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categories.map((item) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <span>{item.category}</span>
                  <span className="font-semibold">{formatCurrency(item.value, currency)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Merchant concentration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {merchants.map((item) => (
                <div key={item.merchant} className="flex items-center justify-between text-sm">
                  <span>{item.merchant}</span>
                  <span className="font-semibold">{formatCurrency(item.value, currency)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/70">
            <CardHeader>
              <CardTitle className="text-base">Anomaly dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {anomalies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No anomalies detected.</p>
              ) : (
                anomalies.map((item) => (
                  <div key={item.transactionId} className="rounded-xl border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.merchant}</span>
                      <span className="font-semibold">{formatCurrency(item.amount, item.currency)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
