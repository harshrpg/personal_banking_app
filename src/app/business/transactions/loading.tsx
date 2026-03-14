import { AppShell } from "@/components/app-shell";

export default function BusinessTransactionsLoading() {
  return (
    <AppShell workspace="business">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-9 w-72 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-96 animate-pulse rounded bg-muted" />
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/70 p-6">
          <div className="h-8 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
