"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowUpRight, Search, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { initializeTokenAction, startConnectionAction } from "@/app/connect/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ApiHealthStatus } from "@/types/app";
import type { GcInstitution } from "@/types/gocardless";

type InstitutionMap = {
  ie: GcInstitution[];
  gb: GcInstitution[];
};

export function ConnectPanel({
  institutions,
  health,
  defaultCountry,
  requiresInit,
}: {
  institutions: InstitutionMap;
  health: ApiHealthStatus;
  defaultCountry: "ie" | "gb";
  requiresInit: boolean;
}) {
  const router = useRouter();
  const [country, setCountry] = useState<"ie" | "gb">(defaultCountry);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isInitPending, startInit] = useTransition();

  const filtered = useMemo(() => {
    const list = institutions[country] ?? [];
    return list.filter((institution) =>
      institution.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [institutions, country, search]);

  const canConnect =
    !requiresInit &&
    health.tokenStatus !== "missing" &&
    health.tokenStatus !== "error";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Connect a bank</h1>
          <p className="text-muted-foreground">
            Choose your institution and complete the secure authorization flow.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={country === "ie" ? "default" : "secondary"}
            onClick={() => setCountry("ie")}
          >
            Ireland
          </Button>
          <Button
            variant={country === "gb" ? "default" : "secondary"}
            onClick={() => setCountry("gb")}
          >
            United Kingdom
          </Button>
        </div>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg">Connection status</CardTitle>
            <p className="text-sm text-muted-foreground">
              Token status: {health.tokenStatus}
            </p>
          </div>
          {!canConnect && (
            <Button
              onClick={() =>
                startInit(async () => {
                  try {
                    await initializeTokenAction();
                    toast.success("Token initialized");
                    router.refresh();
                  } catch (error) {
                    toast.error("Failed to initialize token");
                  }
                })
              }
              disabled={isInitPending}
            >
              Initialize token
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="secondary" className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Server-side secrets
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Premium onboarding
          </Badge>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search institutions"
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length} institutions
        </span>
      </div>

      {requiresInit ? (
        <Card className="border-dashed border-border/70 bg-card/40">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Initialize the token to load institutions.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((institution) => (
          <Card key={institution.id} className="border-border/60 bg-card/70">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  {institution.logo ? (
                    <AvatarImage src={institution.logo} alt={institution.name} />
                  ) : null}
                  <AvatarFallback>
                    {institution.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">{institution.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {institution.countries.join(", ").toUpperCase()}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <Button
                disabled={!canConnect || isPending}
                onClick={() =>
                  startTransition(async () => {
                    try {
                      const link = await startConnectionAction(institution.id);
                      window.location.href = link;
                    } catch (error) {
                      toast.error("Failed to start connection");
                    }
                  })
                }
              >
                Connect
              </Button>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

