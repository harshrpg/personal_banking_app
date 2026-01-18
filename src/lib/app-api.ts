import "server-only";

import { getOptionalEnv } from "@/lib/env";

export async function appFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const appUrl = getOptionalEnv("APP_URL");
  const vercelUrl = getOptionalEnv("VERCEL_URL");
  const baseUrl =
    appUrl ?? (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");
  const appKey = getOptionalEnv("APP_API_KEY");
  if (!appKey) {
    throw new Error("Missing APP_API_KEY. Set it in your environment.");
  }
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-app-key": appKey,
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

