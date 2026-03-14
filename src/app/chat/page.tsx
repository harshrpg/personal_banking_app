import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appFetch } from "@/lib/app-api";

type FinanceSummaryResponse = {
  summaryText: string;
  anomalies: { merchant: string; amount: number; currency: string; reason: string }[];
  topCategories: { category: string; value: number }[];
  topMerchants: { merchant: string; value: number }[];
};

function currency(value: number, c = "EUR") {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: c }).format(value);
}

export default async function ChatPage() {
  const summary = await appFetch<FinanceSummaryResponse>("/api/finance/summary?period=monthly");
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">AI finance assistant</h1>
          <p className="text-muted-foreground">
            Read-only agent context over deterministic summaries and trends.
          </p>
        </div>
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Monthly summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{summary.summaryText}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Top categories</p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {summary.topCategories.map((item) => (
                    <li key={item.category} className="flex justify-between">
                      <span>{item.category}</span>
                      <span>{currency(item.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium">Top merchants</p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {summary.topMerchants.map((item) => (
                    <li key={item.merchant} className="flex justify-between">
                      <span>{item.merchant}</span>
                      <span>{currency(item.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Anomalies</p>
              <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                {summary.anomalies.length === 0 ? (
                  <li>No anomalies detected.</li>
                ) : (
                  summary.anomalies.map((item) => (
                    <li key={`${item.merchant}-${item.amount}`} className="flex items-center justify-between">
                      <span>{item.merchant}</span>
                      <span>{currency(item.amount, item.currency)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
