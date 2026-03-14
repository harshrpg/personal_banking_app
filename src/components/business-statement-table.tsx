"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { FinanceTransaction } from "@/types/app";

type SortKey = "date" | "name" | "accountName" | "amount" | "kind";

const PAGE_SIZE = 50;

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
  }).format(amount);
}

function sortTransactions(transactions: FinanceTransaction[], key: SortKey, direction: "asc" | "desc") {
  const sorted = [...transactions].sort((a, b) => {
    if (key === "amount") return a.amount - b.amount;
    if (key === "date") return new Date(a.date).getTime() - new Date(b.date).getTime();
    return String(a[key]).localeCompare(String(b[key]));
  });
  return direction === "asc" ? sorted : sorted.reverse();
}

function SortableHead({
  label,
  sortKey,
  activeKey,
  direction,
  onToggle,
  alignRight = false,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: "asc" | "desc";
  onToggle: (key: SortKey) => void;
  alignRight?: boolean;
}) {
  const active = activeKey === sortKey;
  return (
    <TableHead className={alignRight ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onToggle(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground",
          "hover:text-foreground",
          alignRight && "ml-auto",
        )}
      >
        <span>{label}</span>
        {active ? (
          direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )
        ) : null}
      </button>
    </TableHead>
  );
}

export function BusinessStatementTable({ transactions }: { transactions: FinanceTransaction[] }) {
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<"all" | FinanceTransaction["kind"]>("all");
  const [pendingFilter, setPendingFilter] = useState<"all" | "settled" | "pending">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const accountOptions = useMemo(
    () =>
      Array.from(new Map(transactions.map((tx) => [tx.accountId, tx.accountName])).entries()).map(
        ([id, name]) => ({ id, name }),
      ),
    [transactions],
  );

  const filtered = useMemo(
    () =>
      transactions.filter((tx) => {
        const searchValue = search.trim().toLowerCase();
        const matchesSearch =
          !searchValue ||
          tx.name.toLowerCase().includes(searchValue) ||
          tx.category.toLowerCase().includes(searchValue) ||
          tx.accountName.toLowerCase().includes(searchValue);
        const matchesAccount = accountFilter === "all" ? true : tx.accountId === accountFilter;
        const matchesKind = kindFilter === "all" ? true : tx.kind === kindFilter;
        const matchesPending =
          pendingFilter === "all"
            ? true
            : pendingFilter === "pending"
              ? tx.pending
              : !tx.pending;
        const txDate = new Date(tx.date);
        const matchesStart = startDate ? txDate >= new Date(startDate) : true;
        const matchesEnd = endDate ? txDate <= new Date(endDate) : true;
        const amount = Math.abs(tx.amount);
        const matchesMin = minAmount ? amount >= Number(minAmount) : true;
        const matchesMax = maxAmount ? amount <= Number(maxAmount) : true;
        return (
          matchesSearch &&
          matchesAccount &&
          matchesKind &&
          matchesPending &&
          matchesStart &&
          matchesEnd &&
          matchesMin &&
          matchesMax
        );
      }),
    [
      transactions,
      search,
      accountFilter,
      kindFilter,
      pendingFilter,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    ],
  );

  const sorted = useMemo(
    () => sortTransactions(filtered, sortKey, sortDirection),
    [filtered, sortKey, sortDirection],
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totals = useMemo(() => {
    let credits = 0;
    let debits = 0;
    for (const tx of filtered) {
      if (tx.amount >= 0) credits += tx.amount;
      else debits += Math.abs(tx.amount);
    }
    return {
      credits,
      debits,
      net: credits - debits,
    };
  }, [filtered]);

  const currency = filtered[0]?.currency ?? transactions[0]?.currency ?? "EUR";

  function onToggleSort(key: SortKey) {
    setPage(1);
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection(key === "date" ? "desc" : "asc");
  }

  function resetFilters() {
    setSearch("");
    setAccountFilter("all");
    setKindFilter("all");
    setPendingFilter("all");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setSortKey("date");
    setSortDirection("desc");
    setPage(1);
  }

  return (
    <Card className="border-border/60 bg-card/70">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="text-lg">Business bank statement</CardTitle>
            <p className="text-sm text-muted-foreground">
              Full ledger with statement filters, sorting, and page navigation.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset filters
          </Button>
        </div>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search payer, category, account"
              className="pl-9"
            />
          </div>
          <Select
            value={accountFilter}
            onValueChange={(value) => {
              setAccountFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
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
          <Select
            value={kindFilter}
            onValueChange={(value) => {
              setKindFilter(value as typeof kindFilter);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="savings">Savings</SelectItem>
              <SelectItem value="investment">Investment</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={pendingFilter}
            onValueChange={(value) => {
              setPendingFilter(value as typeof pendingFilter);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 md:grid-cols-4 xl:grid-cols-6">
          <Input
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPage(1);
            }}
            type="date"
            placeholder="From date"
          />
          <Input
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPage(1);
            }}
            type="date"
            placeholder="To date"
          />
          <Input
            value={minAmount}
            onChange={(event) => {
              setMinAmount(event.target.value);
              setPage(1);
            }}
            type="number"
            min={0}
            placeholder="Min absolute amount"
          />
          <Input
            value={maxAmount}
            onChange={(event) => {
              setMaxAmount(event.target.value);
              setPage(1);
            }}
            type="number"
            min={0}
            placeholder="Max absolute amount"
          />
          <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">Credits</p>
            <p className="font-semibold text-emerald-600">{formatCurrency(totals.credits, currency)}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">Debits</p>
            <p className="font-semibold text-rose-600">{formatCurrency(totals.debits, currency)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            Showing {paged.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}
            {" - "}
            {Math.min(safePage * PAGE_SIZE, sorted.length)} of {sorted.length} transactions
          </p>
          <p>
            Filtered net:{" "}
            <span className={cn("font-semibold", totals.net >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {formatCurrency(totals.net, currency)}
            </span>
          </p>
        </div>

        {paged.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
            No transactions match the selected filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead
                  label="Date"
                  sortKey="date"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onToggle={onToggleSort}
                />
                <SortableHead
                  label="Counterparty"
                  sortKey="name"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onToggle={onToggleSort}
                />
                <SortableHead
                  label="Account"
                  sortKey="accountName"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onToggle={onToggleSort}
                />
                <SortableHead
                  label="Type"
                  sortKey="kind"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onToggle={onToggleSort}
                />
                <SortableHead
                  label="Amount"
                  sortKey="amount"
                  activeKey={sortKey}
                  direction={sortDirection}
                  onToggle={onToggleSort}
                  alignRight
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{tx.name}</p>
                    <p className="text-xs text-muted-foreground">{tx.category}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tx.accountName}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{tx.kind}</Badge>
                      {tx.pending ? <Badge variant="secondary">Pending</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold",
                      tx.amount >= 0 ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {formatCurrency(tx.amount, tx.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={safePage <= 1}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {safePage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={safePage >= totalPages}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
