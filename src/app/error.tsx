"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-xl space-y-4 rounded-2xl border border-border/60 bg-card/80 p-6 text-sm text-muted-foreground shadow-lg">
        <div className="text-base font-semibold text-foreground">
          Something went wrong on the server
        </div>
        <p>
          This usually happens when required environment variables are missing
          on Vercel. Check server logs for the detailed error message.
        </p>
        <div className="rounded-xl border border-border/60 bg-muted/50 p-3 text-xs">
          <div>Error digest: {error.digest ?? "not available"}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg bg-primary px-4 py-2 text-xs text-primary-foreground"
            onClick={() => reset()}
          >
            Retry
          </button>
        </div>
        <div className="text-xs">
          Required: <code>REDIS_URL</code>, <code>APP_API_KEY</code>,{" "}
          <code>APP_URL</code> or <code>VERCEL_URL</code>,{" "}
          <code>GC_SECRET_ID</code>, <code>GC_SECRET_KEY</code>.
        </div>
      </div>
    </div>
  );
}

