import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { BusinessStatementTable } from "@/components/business-statement-table";
import { Button } from "@/components/ui/button";
import { appFetch } from "@/lib/app-api";
import { normalizeTransactions } from "@/lib/finance";
import type { DashboardResponse } from "@/types/app";

export default async function BusinessTransactionsPage() {
  const data = await appFetch<DashboardResponse>("/api/dashboard?workspace=business");
  const accounts = data.accounts ?? [];

  if (accounts.length === 0) {
    return (
      <AppShell workspace="business">
        <div className="rounded-3xl border border-dashed border-border/60 bg-card/50 p-12 text-center">
          <h1 className="text-2xl font-semibold">Business statement</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your business bank account to review a full transaction statement.
          </p>
          <Button asChild className="mt-6">
            <Link href="/business/connect">Connect business account</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const transactions = normalizeTransactions(accounts);

  return (
    <AppShell workspace="business">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Business statement</h1>
          <p className="text-sm text-muted-foreground">
            Inspect every transaction with statement-level filtering and sorting.
          </p>
        </div>
        <BusinessStatementTable transactions={transactions} />
      </div>
    </AppShell>
  );
}
