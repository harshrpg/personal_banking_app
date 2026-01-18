import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { KV_KEYS } from "@/db/keys";
import { getJson } from "@/db/kv";
import { requireAppKey } from "@/lib/api-guard";
import { rateLimit } from "@/lib/rate-limit";
import type { ApiHealthStatus } from "@/types/app";

export async function GET(request: NextRequest) {
  const auth = requireAppKey(request);
  if (auth) return auth;
  if (!(await rateLimit("health"))) {
    return new Response("Too many requests", { status: 429 });
  }

  const tokenStatus =
    (await getJson<ApiHealthStatus>(KV_KEYS.tokenStatus)) ?? {
      tokenStatus: "missing",
    };
  const lastApiCall = await getJson<ApiHealthStatus["lastApiCall"]>(
    KV_KEYS.lastApiCall,
  );

  return NextResponse.json({
    ...tokenStatus,
    lastApiCall,
  });
}

