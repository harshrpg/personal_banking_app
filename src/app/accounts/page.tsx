import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAccounts } from "@/db/store";
import {
  deleteAccountAction,
  syncAccountAction,
  updateAccountAliasAction,
} from "@/app/actions";

export default async function AccountsPage() {
  const accounts = await getAccounts();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Accounts</h1>
          <p className="text-muted-foreground">
            Rename, refresh, or disconnect linked accounts.
          </p>
        </div>

        {accounts.length === 0 ? (
          <Card className="border-border/60 bg-card/70">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No accounts connected yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {accounts.map((account) => (
              <Card key={account.accountId} className="border-border/60 bg-card/70">
                <CardHeader>
                  <CardTitle className="text-base">
                    {account.alias || account.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {account.institutionId} · {account.currency ?? "—"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <form
                    action={updateAccountAliasAction}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <input type="hidden" name="accountId" value={account.accountId} />
                    <Input
                      name="alias"
                      placeholder="Set alias"
                      defaultValue={account.alias ?? ""}
                    />
                    <Button type="submit" variant="secondary">
                      Save
                    </Button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    <form action={syncAccountAction}>
                      <input type="hidden" name="accountId" value={account.accountId} />
                      <Button type="submit" variant="outline">
                        Force re-sync
                      </Button>
                    </form>
                    <form action={deleteAccountAction}>
                      <input type="hidden" name="accountId" value={account.accountId} />
                      <Button type="submit" variant="destructive">
                        Disconnect
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

