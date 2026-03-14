import { saveInvestmentHoldingAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getInvestments } from "@/db/store";

function currency(value: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(value);
}

export default async function InvestmentsPage() {
  const holdings = await getInvestments();
  const totalCost = holdings.reduce((sum, item) => sum + item.costBasis, 0);
  const totalCurrent = holdings.reduce((sum, item) => sum + item.currentValue, 0);
  const totalDividends = holdings.reduce((sum, item) => sum + item.dividendsYtd, 0);
  const gains = totalCurrent - totalCost;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Investments</h1>
          <p className="text-muted-foreground">
            Holdings, contribution performance, dividends, and concentration checks.
          </p>
        </div>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Add holding</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveInvestmentHoldingAction} className="grid gap-3 md:grid-cols-7">
              <Input name="symbol" placeholder="VWCE" required />
              <Input name="account" placeholder="Interactive Brokers" required />
              <Input name="units" type="number" step="0.0001" placeholder="Units" required />
              <Input name="costBasis" type="number" step="0.01" placeholder="Cost basis" />
              <Input name="currentValue" type="number" step="0.01" placeholder="Current value" />
              <Input name="dividendsYtd" type="number" step="0.01" placeholder="Dividends YTD" />
              <Button type="submit">Save</Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/60 bg-card/70">
            <CardHeader><CardTitle className="text-sm">Cost basis</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{currency(totalCost)}</CardContent>
          </Card>
          <Card className="border-border/60 bg-card/70">
            <CardHeader><CardTitle className="text-sm">Current value</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{currency(totalCurrent)}</CardContent>
          </Card>
          <Card className="border-border/60 bg-card/70">
            <CardHeader><CardTitle className="text-sm">Gain / loss</CardTitle></CardHeader>
            <CardContent className={`text-2xl font-semibold ${gains >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {currency(gains)}
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/70">
            <CardHeader><CardTitle className="text-sm">Dividends YTD</CardTitle></CardHeader>
            <CardContent className="text-2xl font-semibold">{currency(totalDividends)}</CardContent>
          </Card>
        </div>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Holdings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {holdings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No holdings tracked yet.</p>
            ) : (
              holdings.map((item) => {
                const weight = totalCurrent > 0 ? (item.currentValue / totalCurrent) * 100 : 0;
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                    <div>
                      <p className="font-medium">{item.symbol}</p>
                      <p className="text-xs text-muted-foreground">{item.account} · {item.units} units</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{currency(item.currentValue)}</p>
                      <p className={`text-xs ${weight > 35 ? "text-amber-600" : "text-muted-foreground"}`}>
                        {weight.toFixed(1)}% allocation{weight > 35 ? " · concentration warning" : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
