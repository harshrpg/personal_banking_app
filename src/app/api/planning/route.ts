import "server-only";

import { NextRequest, NextResponse } from "next/server";

import {
  getBudgets,
  getInvestments,
  getSavingsGoals,
  saveBudgets,
  saveInvestments,
  saveSavingsGoals,
} from "@/db/store";
import { requireAppKey } from "@/lib/api-guard";
import type { BudgetItem, InvestmentHolding, SavingsGoal } from "@/types/app";

export async function GET(request: NextRequest) {
  const auth = requireAppKey(request);
  if (auth) return auth;
  return NextResponse.json({
    budgets: await getBudgets(),
    savingsGoals: await getSavingsGoals(),
    investments: await getInvestments(),
  });
}

export async function POST(request: NextRequest) {
  const auth = requireAppKey(request);
  if (auth) return auth;
  const body = (await request.json()) as {
    budgets?: BudgetItem[];
    savingsGoals?: SavingsGoal[];
    investments?: InvestmentHolding[];
  };
  if (body.budgets) await saveBudgets(body.budgets);
  if (body.savingsGoals) await saveSavingsGoals(body.savingsGoals);
  if (body.investments) await saveInvestments(body.investments);
  return NextResponse.json({ ok: true });
}
