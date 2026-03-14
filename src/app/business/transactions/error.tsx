"use client";

import { Button } from "@/components/ui/button";

export default function BusinessTransactionsError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-8">
      <div className="w-full rounded-3xl border border-border/60 bg-card/70 p-10 text-center">
        <h1 className="text-2xl font-semibold">Unable to load business statement</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not load your transactions right now. Please try again.
        </p>
        <Button type="button" className="mt-6" onClick={reset}>
          Retry
        </Button>
      </div>
    </div>
  );
}
