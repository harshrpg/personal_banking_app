"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DashboardTransaction {
  id: string;
  date: string;
  name: string;
  amount: number;
  currency: string;
  accountId: string;
  accountName: string;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
  }).format(amount);
}

export function TransactionsTable({
  transactions,
}: {
  transactions: DashboardTransaction[];
}) {
  const [search, setSearch] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const accountOptions = useMemo(() => {
    return Array.from(new Set(transactions.map((tx) => tx.accountId))).map(
      (accountId) => {
        const name =
          transactions.find((tx) => tx.accountId === accountId)?.accountName ??
          accountId;
        return { id: accountId, name };
      },
    );
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch = tx.name.toLowerCase().includes(search.toLowerCase());
      const amount = tx.amount;
      const matchesMin = minAmount ? amount >= Number(minAmount) : true;
      const matchesMax = maxAmount ? amount <= Number(maxAmount) : true;
      const matchesAccount =
        accountFilter === "all" ? true : tx.accountId === accountFilter;
      const matchesStart = startDate
        ? new Date(tx.date) >= new Date(startDate)
        : true;
      const matchesEnd = endDate ? new Date(tx.date) <= new Date(endDate) : true;
      return (
        matchesSearch &&
        matchesMin &&
        matchesMax &&
        matchesAccount &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [transactions, search, minAmount, maxAmount, accountFilter, startDate, endDate]);

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-lg">Transactions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Filter by search or amount range.
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:justify-end">
          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search merchant"
              className="pl-9"
            />
          </div>
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="md:max-w-[180px]">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accountOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            placeholder="From"
            type="date"
            className="md:max-w-[160px]"
          />
          <Input
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            placeholder="To"
            type="date"
            className="md:max-w-[160px]"
          />
          <Input
            value={minAmount}
            onChange={(event) => setMinAmount(event.target.value)}
            placeholder="Min"
            type="number"
            className="md:max-w-[140px]"
          />
          <Input
            value={maxAmount}
            onChange={(event) => setMaxAmount(event.target.value)}
            placeholder="Max"
            type="number"
            className="md:max-w-[140px]"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No transactions match your filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{tx.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tx.accountName}</Badge>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold",
                      tx.amount < 0 ? "text-red-500" : "text-emerald-600",
                    )}
                  >
                    {formatCurrency(tx.amount, tx.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

