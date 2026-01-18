import { ArrowUpRight, Clock3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardAccount } from "@/types/app";

function formatCurrency(amount: number, currency?: string) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency || "EUR",
  }).format(amount);
}

export function AccountCard({ account }: { account: DashboardAccount }) {
  const balance = account.balances?.amount ?? 0;
  const currency = account.balances?.currency ?? account.currency ?? "EUR";

  return (
    <Card className="border-border/60 bg-card/70 shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{account.alias || account.name}</span>
          <ArrowUpRight className="h-4 w-4" />
        </div>
        <CardTitle className="text-2xl">{formatCurrency(balance, currency)}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{account.institutionId}</span>
        <span className="flex items-center gap-1">
          <Clock3 className="h-3 w-3" />
          {account.lastSync ? new Date(account.lastSync).toLocaleString() : "Never"}
        </span>
      </CardContent>
    </Card>
  );
}

