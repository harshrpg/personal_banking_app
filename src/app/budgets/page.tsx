import { saveBudgetAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getBudgets } from "@/db/store";

function currency(value: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(value);
}

export default async function BudgetsPage() {
  const budgets = await getBudgets();
  const total = budgets.reduce((sum, item) => sum + item.monthlyBudget, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Budgets</h1>
          <p className="text-muted-foreground">
            Set monthly category budgets with optional rollover behavior.
          </p>
        </div>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Add or update budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveBudgetAction} className="grid gap-3 md:grid-cols-4">
              <Input name="category" placeholder="Category" required />
              <Input name="monthlyBudget" type="number" placeholder="Monthly budget" required />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="rolloverEnabled" />
                Rollover enabled
              </label>
              <Button type="submit">Save budget</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Budget vs plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Total planned budget: {currency(total)}</p>
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No budgets configured yet.</p>
            ) : (
              budgets.map((item) => (
                <div key={item.category} className="flex items-center justify-between rounded-xl border border-border/60 p-3">
                  <span>{item.category}</span>
                  <span className="font-semibold">
                    {currency(item.monthlyBudget)}
                    {item.rolloverEnabled ? " · rollover" : ""}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
