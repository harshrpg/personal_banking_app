import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getCategoryRules, saveCategoryRules } from "@/db/store";
import { requireAppKey } from "@/lib/api-guard";
import type { CategorizationRule } from "@/types/app";

export async function GET(request: NextRequest) {
  const auth = requireAppKey(request);
  if (auth) return auth;
  const rules = await getCategoryRules();
  return NextResponse.json({ rules });
}

export async function POST(request: NextRequest) {
  const auth = requireAppKey(request);
  if (auth) return auth;
  const body = (await request.json()) as Partial<CategorizationRule>;
  if (!body.match || !body.category) {
    return NextResponse.json(
      { message: "match and category are required." },
      { status: 400 },
    );
  }
  const rules = await getCategoryRules();
  const nextRule: CategorizationRule = {
    id: body.id ?? `${Date.now()}`,
    match: body.match,
    category: body.category,
    essential: Boolean(body.essential),
    fixed: Boolean(body.fixed),
    updatedAt: new Date().toISOString(),
  };
  const existingIdx = rules.findIndex((item) => item.id === nextRule.id);
  if (existingIdx >= 0) rules[existingIdx] = nextRule;
  else rules.unshift(nextRule);
  await saveCategoryRules(rules);
  return NextResponse.json({ ok: true, rule: nextRule });
}
