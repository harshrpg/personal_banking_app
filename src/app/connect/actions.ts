"use server";

import { appFetch } from "@/lib/app-api";
import type { WorkspaceMode } from "@/types/app";

export async function startConnectionAction(
  institutionId: string,
  workspace: WorkspaceMode = "personal",
) {
  const response = await appFetch<{ link: string }>(
    `/api/requisitions?workspace=${workspace}`,
    {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ institutionId }),
    },
  );
  return response.link;
}

export async function initializeTokenAction() {
  await appFetch("/api/initialize", { method: "POST" });
}



