import { AppShell } from "@/components/app-shell";
import { SubscriptionsPanel } from "@/components/subscriptions-panel";
import { getEnrichedSelectedAccounts } from "@/lib/dashboard-data";
import { detectSubscriptions, normalizeTransactions } from "@/lib/finance";
import { fromDetectedSubscriptions } from "@/lib/costs";

export default async function SubscriptionsPage() {
  const accounts = await getEnrichedSelectedAccounts();
  const transactions = normalizeTransactions(accounts);
  const subscriptions = fromDetectedSubscriptions(detectSubscriptions(transactions));
  const currency = transactions[0]?.currency ?? "EUR";

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Subscriptions</h1>
          <p className="text-muted-foreground">
            Recurring payment detection with early signals for avoidable spend.
          </p>
        </div>
        <SubscriptionsPanel items={subscriptions} currency={currency} />
      </div>
    </AppShell>
  );
}
