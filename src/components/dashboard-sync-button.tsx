"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { syncDashboardAction } from "@/app/actions";
import type { DashboardSyncStatus } from "@/types/app";
import type { SyncDashboardActionState } from "@/app/actions";

type DashboardSyncButtonProps = {
  sync: DashboardSyncStatus;
  accountsCount: number;
};

function formatCountdown(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function DashboardSyncButton({ sync, accountsCount }: DashboardSyncButtonProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    SyncDashboardActionState,
    FormData
  >(syncDashboardAction, { ok: true, sync });
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const currentSync = state.sync ?? sync;
  const lastSyncAtRef = useRef(currentSync.lastSyncAt);
  const [now, setNow] = useState(() => Date.now());

  const nextAvailableAt = currentSync.nextAvailableAt
    ? new Date(currentSync.nextAvailableAt).getTime()
    : null;

  const remainingSeconds = useMemo(() => {
    if (!nextAvailableAt) return 0;
    return Math.max(0, Math.ceil((nextAvailableAt - now) / 1000));
  }, [nextAvailableAt, now]);

  const isBlocked = currentSync.remaining === 0 && remainingSeconds > 0;
  const isDisabled = pending || isBlocked || accountsCount === 0;

  useEffect(() => {
    if (!nextAvailableAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [nextAvailableAt]);

  useEffect(() => {
    if (pending || !state.ok || !state.sync?.lastSyncAt) return;
    if (state.sync.lastSyncAt !== lastSyncAtRef.current) {
      lastSyncAtRef.current = state.sync.lastSyncAt;
      router.refresh();
    }
  }, [pending, router, state]);

  const errorMessage =
    state.message && state.message.trim().length > 0
      ? state.message.trim()
      : "An error occurred while trying to sync your accounts.";
  const errorOpen = !state.ok && dismissedError !== errorMessage;

  const helperText = accountsCount === 0
    ? "Connect an account to enable sync."
    : isBlocked
      ? `0 of ${currentSync.limit} syncs left · Next sync in ${formatCountdown(remainingSeconds)}`
      : currentSync.remaining < currentSync.limit
        ? `${currentSync.remaining} of ${currentSync.limit} syncs left`
        : `${currentSync.limit} syncs per day`;

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <Button type="submit" variant="secondary" disabled={isDisabled}>
          <RefreshCw className={pending ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
          {pending ? "Syncing..." : "Sync now"}
        </Button>
      </form>
      <div className="text-xs text-muted-foreground">{helperText}</div>
      <Dialog
        open={errorOpen}
        onOpenChange={(open) => {
          if (!open) setDismissedError(errorMessage);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync failed</DialogTitle>
            <DialogDescription>{errorMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDismissedError(errorMessage)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

