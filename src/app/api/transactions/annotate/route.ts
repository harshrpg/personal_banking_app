import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getTransactionAnnotations, saveTransactionAnnotations } from "@/db/store";
import { requireAppKey } from "@/lib/api-guard";
import type { TransactionAnnotation } from "@/types/app";

export async function GET(request: NextRequest) {
  const auth = requireAppKey(request);
  if (auth) return auth;
  const annotations = await getTransactionAnnotations();
  return NextResponse.json(annotations);
}

export async function POST(request: NextRequest) {
  const auth = requireAppKey(request);
  if (auth) return auth;
  const body = (await request.json()) as {
    transactionId?: string;
    annotation?: TransactionAnnotation;
  };
  if (!body.transactionId || !body.annotation) {
    return NextResponse.json(
      { message: "transactionId and annotation are required." },
      { status: 400 },
    );
  }
  const annotations = await getTransactionAnnotations();
  annotations[body.transactionId] = {
    ...annotations[body.transactionId],
    ...body.annotation,
  };
  await saveTransactionAnnotations(annotations);
  return NextResponse.json({ ok: true, annotation: annotations[body.transactionId] });
}
