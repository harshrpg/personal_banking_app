"use server";

import { appFetch } from "@/lib/app-api";

export async function startConnectionAction(institutionId: string) {
  const response = await appFetch<{ link: string }>("/api/requisitions", {
    method: "POST",
    body: JSON.stringify({ institutionId }),
  });
  return response.link;
}

export async function initializeTokenAction() {
  await appFetch("/api/initialize", { method: "POST" });
}

