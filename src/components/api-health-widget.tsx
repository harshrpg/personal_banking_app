import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appFetch } from "@/lib/app-api";
import type { ApiHealthStatus } from "@/types/app";

export async function ApiHealthWidget() {
  if (process.env.NEXT_PUBLIC_DEBUG !== "true") {
    return null;
  }

  const health = await appFetch<ApiHealthStatus>("/api/health");

  return (
    <Card className="mt-8 border-border/60 bg-card/70">
      <CardHeader>
        <CardTitle className="text-base">API health</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        <div>Token: {health.tokenStatus}</div>
        {health.lastApiCall ? (
          <div>
            Last call: {health.lastApiCall.path} · {health.lastApiCall.status}
          </div>
        ) : (
          <div>No API calls yet.</div>
        )}
      </CardContent>
    </Card>
  );
}

