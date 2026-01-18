import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccounts } from "@/db/store";

export default async function Home() {
  const accounts = await getAccounts();
  if (accounts.length > 0) {
    redirect("/dashboard");
  }

  return (
    <AppShell>
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="w-full max-w-2xl border-border/60 bg-card/70 shadow-xl shadow-primary/5">
          <CardHeader className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              OB
            </div>
            <CardTitle className="text-3xl font-semibold leading-tight">
              Connect your first bank account
            </CardTitle>
            <p className="text-muted-foreground">
              Link up to three institutions with GoCardless Bank Account Data to
              unlock balances, transactions, and insight previews.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link href="/connect">Connect bank</Link>
            </Button>
            <div className="text-sm text-muted-foreground">
              Secure connection · Server-side secrets · Single user
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
