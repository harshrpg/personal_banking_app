import "server-only";

import type { NextRequest } from "next/server";

import { getRequiredEnv } from "@/lib/env";

export function requireAppKey(request: NextRequest): Response | null {
  const appKey = request.headers.get("x-app-key");
  if (!appKey || appKey !== getRequiredEnv("APP_API_KEY")) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}

