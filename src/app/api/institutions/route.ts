import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { KV_KEYS } from "@/db/keys";
import { getJson } from "@/db/kv";
import { listInstitutions } from "@/lib/gocardless";
import { requireAppKey } from "@/lib/api-guard";
import { rateLimit } from "@/lib/rate-limit";
import type { GcCountryCode } from "@/types/gocardless";

export async function GET(request: NextRequest) {
  const auth = requireAppKey(request);
  if (auth) return auth;
  if (!(await rateLimit("institutions"))) {
    return new Response("Too many requests", { status: 429 });
  }

  const requested =
    (request.nextUrl.searchParams.get("country") as GcCountryCode) ?? "ie";
  const country: GcCountryCode = requested === "gb" ? "gb" : "ie";

  const refreshToken = await getJson<string>(KV_KEYS.refreshToken);
  if (!refreshToken) {
    return NextResponse.json({ institutions: [], requiresInit: true });
  }

  const institutions = await listInstitutions(country);
  return NextResponse.json({ institutions, requiresInit: false });
}

