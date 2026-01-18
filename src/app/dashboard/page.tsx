import { AppShell } from "@/components/app-shell";
import { AccountCard } from "@/components/account-card";
import { InsightsPanel } from "@/components/insights-panel";
import { TransactionsTable } from "@/components/transactions-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appFetch } from "@/lib/app-api";
import { buildInsights } from "@/lib/insights";
import type { DashboardAccount } from "@/types/app";

function normalizeTransactions(accounts: DashboardAccount[]) {
  const items: {
    id: string;
    date: string;
    name: string;
    amount: number;
    currency: string;
    accountId: string;
    accountName: string;
  }[] = [];

  accounts.forEach((account) => {
    const booked = account.transactions?.booked ?? [];
    booked.forEach((tx, index) => {
      const amount = Number(tx.transactionAmount.amount);
      const name =
        tx.creditorName ||
        tx.debtorName ||
        tx.remittanceInformationUnstructured ||
        "Transaction";
      items.push({
        id: tx.transactionId ?? `${account.accountId}-${index}`,
        date: tx.bookingDate || tx.valueDate || new Date().toISOString(),
        name,
        amount,
        currency: tx.transactionAmount.currency,
        accountId: account.accountId,
        accountName: account.alias || account.name,
      });
    });
  });

  return items.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function totalBalance(accounts: DashboardAccount[]) {
  return accounts.reduce((sum, account) => {
    const amount = account.balances?.amount ?? 0;
    return sum + amount;
  }, 0);
}

export default async function DashboardPage() {
  const data = await appFetch<{ accounts: DashboardAccount[] }>("/api/dashboard");
  const accounts = data.accounts ?? [];
  const transactions = normalizeTransactions(accounts);
  const total = totalBalance(accounts);
  const insights = buildInsights(transactions);

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total balance</p>
              <h1 className="text-3xl font-semibold">
                {new Intl.NumberFormat("en-IE", {
                  style: "currency",
                  currency: accounts[0]?.balances?.currency ?? "EUR",
                }).format(total)}
              </h1>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-2 text-xs text-muted-foreground">
              {accounts.length} of 3 accounts connected
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
          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            <TabsContent value="transactions">
              <TransactionsTable transactions={transactions} />
            </TabsContent>
            <TabsContent value="insights">
              <InsightsPanel
                categories={insights.categories}
                merchants={insights.merchants}
                currentMonthSpend={insights.currentMonthSpend}
                lastMonthSpend={insights.lastMonthSpend}
                currency={accounts[0]?.balances?.currency ?? "EUR"}
              />
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </AppShell>
  );
}

