import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { requireAppKey } from "@/lib/api-guard";
import { initializeToken } from "@/lib/token-manager";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const auth = requireAppKey(request);
  if (auth) return auth;
  if (!(await rateLimit("initialize"))) {
    return new Response("Too many requests", { status: 429 });
  }

  await initializeToken();
  return NextResponse.json({ ok: true });
}

