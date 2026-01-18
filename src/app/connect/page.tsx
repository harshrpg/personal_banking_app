import { AppShell } from "@/components/app-shell";
import { appFetch } from "@/lib/app-api";
import { getSettings } from "@/db/store";
import type { ApiHealthStatus } from "@/types/app";
import type { GcInstitution } from "@/types/gocardless";
import { ConnectPanel } from "@/components/connect-panel";

export default async function ConnectPage() {
  const [ieInstitutions, gbInstitutions, health, settings] = await Promise.all([
    appFetch<{ institutions: GcInstitution[]; requiresInit: boolean }>(
      "/api/institutions?country=ie",
    ),
    appFetch<{ institutions: GcInstitution[]; requiresInit: boolean }>(
      "/api/institutions?country=gb",
    ),
    appFetch<ApiHealthStatus>("/api/health"),
    getSettings(),
  ]);

  const requiresInit = ieInstitutions.requiresInit || gbInstitutions.requiresInit;

  return (
    <AppShell>
      <ConnectPanel
        institutions={{ ie: ieInstitutions.institutions, gb: gbInstitutions.institutions }}
        health={health}
        defaultCountry={settings.defaultCountry}
        requiresInit={requiresInit}
      />
    </AppShell>
  );
}

