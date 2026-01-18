import "server-only";

import { getRequiredEnv } from "@/lib/env";

export async function appFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const baseUrl = getRequiredEnv("APP_URL");
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-app-key": getRequiredEnv("APP_API_KEY"),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`App API error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

