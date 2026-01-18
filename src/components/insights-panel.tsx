import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function InsightsPanel({
  categories,
  merchants,
  currentMonthSpend,
  lastMonthSpend,
  currency,
}: {
  categories: { category: string; value: number }[];
  merchants: { merchant: string; value: number }[];
  currentMonthSpend: number;
  lastMonthSpend: number;
  currency: string;
}) {
  const maxCategory = Math.max(...categories.map((item) => item.value), 1);
  const delta =
    lastMonthSpend === 0 ? 0 : ((currentMonthSpend - lastMonthSpend) / lastMonthSpend) * 100;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(value);

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader>
        <CardTitle className="text-lg">Insights</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <p className="text-sm font-medium">Spend by category</p>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No spending data yet.</p>
          ) : (
            categories.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.category}</span>
                  <span>{formatCurrency(item.value)}</span>
                </div>
                <Progress value={(item.value / maxCategory) * 100} />
              </div>
            ))
          )}
        </div>
        <div className="space-y-4">
          <p className="text-sm font-medium">Top merchants</p>
          {merchants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No merchants yet.</p>
          ) : (
            <ul className="space-y-3 text-sm text-muted-foreground">
              {merchants.map((item) => (
                <li key={item.merchant} className="flex items-center justify-between">
                  <span>{item.merchant}</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(item.value)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-4">
          <p className="text-sm font-medium">Month over month</p>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4 text-sm">
            <p className="text-muted-foreground">Current month</p>
            <p className="text-2xl font-semibold">{formatCurrency(currentMonthSpend)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Last month: {formatCurrency(lastMonthSpend)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(1)}% vs last month
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

