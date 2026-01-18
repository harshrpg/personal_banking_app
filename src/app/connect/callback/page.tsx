import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequisitions } from "@/db/store";
import { appFetch } from "@/lib/app-api";

export default async function ConnectCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requisitionId =
    (params.requisition_id as string) || (params.id as string) || "";
  const reference = (params.ref as string) || "";

  const resolvedRequisitionId = requisitionId
    ? requisitionId
    : reference
      ? (await getRequisitions()).find((item) => item.reference === reference)
          ?.id ?? ""
      : "";

  if (!resolvedRequisitionId) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-xl border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Connection missing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We could not find a requisition reference in the callback URL.
            </p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const data = await appFetch<{ requisition: { status: string } }>(
    `/api/requisitions/${resolvedRequisitionId}`,
  );

  return (
    <AppShell>
      <Card className="mx-auto max-w-xl border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>Connection in progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Requisition status: <span className="font-medium">{data.requisition.status}</span>
          </p>
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}

