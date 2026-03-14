import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const REPORTS = [
  { type: "transactions", label: "Business transaction export" },
  { type: "monthly-summary", label: "Business monthly P&L-style summary" },
];

export default function BusinessReportsPage() {
  return (
    <AppShell workspace="business">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Business Reports</h1>
          <p className="text-muted-foreground">
            Download CSV/XLSX exports for your business workspace.
          </p>
        </div>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Exports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {REPORTS.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between rounded-xl border border-border/60 p-3"
              >
                <span className="text-sm">{item.label}</span>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link
                      href={`/api/reports/export?type=${item.type}&format=csv&workspace=business`}
                    >
                      CSV
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link
                      href={`/api/reports/export?type=${item.type}&format=xlsx&workspace=business`}
                    >
                      XLSX
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
