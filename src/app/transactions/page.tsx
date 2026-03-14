import { annotateTransactionAction, upsertCategoryRuleAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCategoryRules, getTransactionAnnotations } from "@/db/store";
import { getEnrichedSelectedAccounts } from "@/lib/dashboard-data";
import { normalizeTransactions } from "@/lib/finance";

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);
}

export default async function TransactionsPage() {
  const accounts = await getEnrichedSelectedAccounts();
  const transactions = normalizeTransactions(accounts).slice(0, 80);
  const annotations = await getTransactionAnnotations();
  const rules = await getCategoryRules();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Transactions</h1>
          <p className="text-muted-foreground">
            Search, categorize, annotate, and split transactions with reusable rules.
          </p>
        </div>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Add categorization rule</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={upsertCategoryRuleAction} className="grid gap-3 md:grid-cols-5">
              <Input name="match" placeholder="Keyword match (e.g. netflix)" />
              <Input name="category" placeholder="Category" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="fixed" />
                Fixed
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="essential" />
                Essential
              </label>
              <Button type="submit">Save rule</Button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {rules.length === 0 ? (
                <span className="text-sm text-muted-foreground">No custom rules yet.</span>
              ) : (
                rules.slice(0, 12).map((rule) => (
                  <Badge key={rule.id} variant="secondary">
                    {rule.match} → {rule.category}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle className="text-base">Ledger</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Detected category</TableHead>
                  <TableHead>Edit annotation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="font-medium">{tx.name}</div>
                      <div className="text-xs text-muted-foreground">{tx.accountName}</div>
                    </TableCell>
                    <TableCell className={tx.amount < 0 ? "text-red-500" : "text-emerald-600"}>
                      {formatCurrency(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell>{annotations[tx.id]?.category ?? tx.category}</TableCell>
                    <TableCell>
                      <form action={annotateTransactionAction} className="grid gap-2 md:grid-cols-4">
                        <input type="hidden" name="transactionId" value={tx.id} />
                        <Input
                          name="category"
                          placeholder="Category"
                          defaultValue={annotations[tx.id]?.category}
                        />
                        <Input
                          name="notes"
                          placeholder="Notes"
                          defaultValue={annotations[tx.id]?.notes}
                        />
                        <Input
                          name="tags"
                          placeholder="Tags comma-separated"
                          defaultValue={annotations[tx.id]?.tags?.join(",")}
                        />
                        <div className="flex gap-2">
                          <Input
                            name="splitCount"
                            type="number"
                            min={1}
                            defaultValue={annotations[tx.id]?.splitCount ?? 1}
                          />
                          <Button type="submit" size="sm">
                            Save
                          </Button>
                        </div>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
