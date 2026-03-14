import { saveSavingsGoalAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { getSavingsGoals } from "@/db/store";

function currency(value: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(value);
}

export default async function SavingsPage() {
  const goals = await getSavingsGoals();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Savings goals</h1>
          <p className="text-muted-foreground">
            Track progress, target dates, and required monthly contributions.
          </p>
        </div>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Create savings goal</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveSavingsGoalAction} className="grid gap-3 md:grid-cols-5">
              <Input name="name" placeholder="Emergency fund" required />
              <Input name="currentAmount" type="number" placeholder="Current amount" />
              <Input name="targetAmount" type="number" placeholder="Target amount" required />
              <Input name="targetDate" type="date" required />
              <Button type="submit">Save goal</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Goal progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goals added yet.</p>
            ) : (
              goals.map((goal) => {
                const progress =
                  goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                const now = new Date();
                const end = new Date(goal.targetDate);
                const monthsRemaining = Math.max(
                  1,
                  Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)),
                );
                const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
                const requiredMonthly = remaining / monthsRemaining;
                const missed = end < now && goal.currentAmount < goal.targetAmount;
                return (
                  <div key={goal.id} className="rounded-xl border border-border/60 p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{goal.name}</span>
                      <span className="text-sm text-muted-foreground">
                        Target {new Date(goal.targetDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {currency(goal.currentAmount)} of {currency(goal.targetAmount)} - required
                      monthly {currency(requiredMonthly)}
                    </p>
                    <Progress className="mt-3" value={Math.min(100, progress)} />
                    {missed ? (
                      <p className="mt-2 text-xs text-red-500">
                        Missed target alert: goal date has passed.
                      </p>
                    ) : null}
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
