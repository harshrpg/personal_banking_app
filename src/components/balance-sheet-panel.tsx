"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FinancePeriod, PeriodRollup } from "@/types/app";

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
  }).format(value);
}

export function BalanceSheetPanel({
  period,
  rows,
  currency,
}: {
  period: FinancePeriod;
  rows: PeriodRollup[];
  currency: string;
}) {
  const latest = rows.at(-1);

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader>
        <CardTitle>
          Balance sheet ({period})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-card/60 p-4">
            <div className="text-sm text-muted-foreground">Opening balance</div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(latest?.openingBalance ?? 0, currency)}
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 p-4">
            <div className="text-sm text-muted-foreground">Closing balance</div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(latest?.closingBalance ?? 0, currency)}
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 p-4">
            <div className="text-sm text-muted-foreground">Delta vs prior period</div>
            <div className="mt-2 text-2xl font-semibold">
              {formatCurrency(latest?.deltaVsPriorPeriod ?? 0, currency)}
            </div>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Opening</TableHead>
              <TableHead className="text-right">Income</TableHead>
              <TableHead className="text-right">Expenses</TableHead>
              <TableHead className="text-right">Transfers</TableHead>
              <TableHead className="text-right">Savings</TableHead>
              <TableHead className="text-right">Investments</TableHead>
              <TableHead className="text-right">Closing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell>{row.label}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.openingBalance, currency)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.income, currency)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.expenses, currency)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.transfers, currency)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.savingsContribution, currency)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.investmentsAdded, currency)}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.closingBalance, currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

