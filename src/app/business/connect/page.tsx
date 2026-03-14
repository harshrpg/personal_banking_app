import { AppShell } from "@/components/app-shell";
import { ConnectPanel } from "@/components/connect-panel";
import { getSettings } from "@/db/store";
import { appFetch } from "@/lib/app-api";
import type { ApiHealthStatus } from "@/types/app";
import type { GcInstitution } from "@/types/gocardless";

export default async function BusinessConnectPage() {
  const [ieInstitutions, gbInstitutions, health, settings] = await Promise.all([
    appFetch<{ institutions: GcInstitution[]; requiresInit: boolean }>(
      "/api/institutions?country=ie",
    ),
    appFetch<{ institutions: GcInstitution[]; requiresInit: boolean }>(
      "/api/institutions?country=gb",
    ),
    appFetch<ApiHealthStatus>("/api/health"),
    getSettings("business"),
  ]);

  const requiresInit = ieInstitutions.requiresInit || gbInstitutions.requiresInit;

  return (
    <AppShell workspace="business">
      <ConnectPanel
        institutions={{ ie: ieInstitutions.institutions, gb: gbInstitutions.institutions }}
        health={health}
        defaultCountry={settings.defaultCountry}
        requiresInit={requiresInit}
        workspace="business"
      />
    </AppShell>
  );
}
