import type { DashboardAccount } from "@/types/app";
import type {
  CategorySpendItem,
  DashboardTopMetrics,
  FinanceAnomaly,
  FinancePeriod,
  FinanceTransaction,
  FinanceTransactionKind,
  MerchantSpendItem,
  PeriodRollup,
} from "@/types/app";

const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  { category: "Housing", keywords: ["rent", "mortgage", "landlord"] },
  { category: "Groceries", keywords: ["aldi", "tesco", "lidl", "supermarket"] },
  { category: "Transport", keywords: ["uber", "lyft", "bus", "train", "diesel", "fuel"] },
  { category: "Dining", keywords: ["restaurant", "dining", "takeaway", "deliveroo"] },
  { category: "Coffee", keywords: ["coffee", "cafe", "starbucks"] },
  { category: "Shopping", keywords: ["amazon", "shop", "store", "retail"] },
  { category: "Subscriptions", keywords: ["netflix", "spotify", "prime", "youtube", "chatgpt"] },
  { category: "Fitness", keywords: ["gym", "fitness", "trainer"] },
  { category: "Bills", keywords: ["electricity", "internet", "water", "utility"] },
  { category: "Insurance", keywords: ["insurance"] },
  { category: "Salary", keywords: ["salary", "payroll", "wage"] },
  { category: "Savings", keywords: ["savings", "emergency fund", "house fund"] },
  { category: "Investments", keywords: ["broker", "investment", "etf", "stocks", "fund"] },
  { category: "Transfers", keywords: ["transfer", "internal transfer"] },
];

const TRANSFER_KEYWORDS = ["transfer", "own account", "internal"];
const SAVINGS_KEYWORDS = ["savings", "emergency fund", "house fund", "tax reserve"];
const INVESTMENT_KEYWORDS = ["broker", "investment", "etf", "stock", "fund"];
const SUBSCRIPTION_KEYWORDS = [
  "netflix",
  "spotify",
  "prime",
  "youtube",
  "chatgpt",
  "cursor",
  "microsoft 365",
  "google one",
];
const SUBSCRIPTION_PREFIXES = ["vdp"];
const LEGAL_ENTITY_SUFFIXES = [
  "ltd",
  "limited",
  "llc",
  "inc",
  "incorporated",
  "plc",
  "co",
  "company",
  "corp",
  "corporation",
];

function normalizeMerchant(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s+]/g, "")
    .trim();
}

function canonicalizeCounterpartyName(name: string) {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "unknown source";
  const parts = cleaned.split(" ").filter(Boolean);
  while (parts.length > 1 && LEGAL_ENTITY_SUFFIXES.includes(parts.at(-1) ?? "")) {
    parts.pop();
  }
  const canonical = parts.join(" ").trim();
  return canonical || cleaned;
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function resolveCounterpartyName(amount: number, item: {
  creditorName?: string;
  debtorName?: string;
  remittanceInformationUnstructured?: string;
}) {
  if (amount >= 0) {
    return (
      item.debtorName ||
      item.creditorName ||
      item.remittanceInformationUnstructured ||
      "Transaction"
    );
  }
  return (
    item.creditorName ||
    item.debtorName ||
    item.remittanceInformationUnstructured ||
    "Transaction"
  );
}

function isSubscriptionMerchant(normalizedMerchant: string) {
  const looksLikeSubscription = SUBSCRIPTION_KEYWORDS.some((keyword) =>
    normalizedMerchant.includes(keyword),
  );
  const matchesPrefix = SUBSCRIPTION_PREFIXES.some((prefix) =>
    normalizedMerchant.startsWith(prefix),
  );
  return looksLikeSubscription || matchesPrefix;
}

function getSubscriptionGroupKey(normalizedMerchant: string) {
  if (SUBSCRIPTION_PREFIXES.some((prefix) => normalizedMerchant.startsWith(prefix))) {
    return normalizedMerchant.split(" ")[0] || normalizedMerchant;
  }
  return normalizedMerchant;
}

function inferKind(name: string, amount: number): FinanceTransactionKind {
  const lower = name.toLowerCase();
  if (amount >= 0) return "income";
  if (TRANSFER_KEYWORDS.some((keyword) => lower.includes(keyword))) return "transfer";
  if (SAVINGS_KEYWORDS.some((keyword) => lower.includes(keyword))) return "savings";
  if (INVESTMENT_KEYWORDS.some((keyword) => lower.includes(keyword))) return "investment";
  return "expense";
}

function categorize(name: string, kind: FinanceTransactionKind) {
  if (kind === "income") return "Salary";
  if (kind === "transfer") return "Transfers";
  if (kind === "savings") return "Savings";
  if (kind === "investment") return "Investments";
  const lower = name.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) return rule.category;
  }
  return "Miscellaneous";
}

function getPeriodStart(date: Date, period: FinancePeriod) {
  const d = new Date(date);
  if (period === "daily") {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "weekly") {
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "monthly") {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  return new Date(d.getFullYear(), 0, 1);
}

function periodLabel(date: Date, period: FinancePeriod) {
  if (period === "daily") return date.toISOString().slice(0, 10);
  if (period === "weekly") {
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    return `${date.toISOString().slice(0, 10)} - ${end.toISOString().slice(0, 10)}`;
  }
  if (period === "monthly") {
    return date.toLocaleDateString("en-IE", { month: "short", year: "numeric" });
  }
  return `${date.getFullYear()}`;
}

function getLastThursdayOfMonth(year: number, month: number) {
  const date = new Date(year, month + 1, 0);
  date.setHours(23, 59, 59, 999);
  while (date.getDay() !== 4) {
    date.setDate(date.getDate() - 1);
  }
  return date;
}

function toStartOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getThursdayCycleEnd(date: Date) {
  const candidate = getLastThursdayOfMonth(date.getFullYear(), date.getMonth());
  if (date <= candidate) return candidate;
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return getLastThursdayOfMonth(nextMonth.getFullYear(), nextMonth.getMonth());
}

function getThursdayCycleWindowFromEnd(cycleEnd: Date) {
  const previousMonth = new Date(cycleEnd.getFullYear(), cycleEnd.getMonth() - 1, 1);
  const previousEnd = getLastThursdayOfMonth(
    previousMonth.getFullYear(),
    previousMonth.getMonth(),
  );
  return {
    start: toStartOfDay(previousEnd),
    end: cycleEnd,
  };
}

export function getCurrentThursdayMonthWindow(referenceDate = new Date()) {
  const currentCycleEnd = getThursdayCycleEnd(referenceDate);
  const { start, end } = getThursdayCycleWindowFromEnd(currentCycleEnd);
  const effectiveEnd = referenceDate < end ? referenceDate : end;
  return {
    start,
    end,
    effectiveEnd,
    label: `${toIsoDate(start)} to ${toIsoDate(end)}`,
  };
}

export function buildThursdayMonthlyTrend(transactions: FinanceTransaction[], months = 6) {
  const map = new Map<string, { income: number; expense: number; start: Date; end: Date }>();
  for (const tx of transactions) {
    if (tx.pending) continue;
    const date = new Date(tx.date);
    const cycleEnd = getThursdayCycleEnd(date);
    const { start, end } = getThursdayCycleWindowFromEnd(cycleEnd);
    const key = toIsoDate(end);
    const current = map.get(key) ?? { income: 0, expense: 0, start, end };
    if (tx.kind === "income") current.income += tx.amount;
    if (tx.kind === "expense") current.expense += Math.abs(tx.amount);
    map.set(key, current);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-months)
    .map(([, value]) => ({
      month: `${toIsoDate(value.start)} - ${toIsoDate(value.end)}`,
      income: value.income,
      expense: value.expense,
      net: value.income - value.expense,
    }));
}

export function normalizeTransactions(accounts: DashboardAccount[]): FinanceTransaction[] {
  const tx: FinanceTransaction[] = [];
  for (const account of accounts) {
    const booked = account.transactions?.booked ?? [];
    const pending = account.transactions?.pending ?? [];
    for (const [index, item] of [...booked, ...pending].entries()) {
      const amount = Number(item.transactionAmount.amount);
      const name = resolveCounterpartyName(amount, item);
      const kind = inferKind(name, amount);
      tx.push({
        id: item.transactionId ?? `${account.accountId}-${index}`,
        accountId: account.accountId,
        accountName: account.alias || account.name,
        date: item.bookingDate || item.valueDate || new Date().toISOString(),
        name,
        amount,
        currency: item.transactionAmount.currency || account.currency || "EUR",
        pending: !booked.includes(item),
        category: categorize(name, kind),
        kind,
        normalizedMerchant: normalizeMerchant(name),
      });
    }
  }

  return tx.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function buildDashboardTopMetrics(
  accounts: DashboardAccount[],
  transactions: FinanceTransaction[],
): DashboardTopMetrics {
  const totalBalance = accounts.reduce(
    (sum, account) => sum + (account.balances?.amount ?? 0),
    0,
  );
  const availableCash = accounts.reduce((sum, account) => {
    const value = account.balances?.amount ?? 0;
    return value > 0 ? sum + value : sum;
  }, 0);

  const { start, effectiveEnd } = getCurrentThursdayMonthWindow(new Date());
  const monthTransactions = transactions.filter(
    (item) => {
      if (item.pending) return false;
      const date = new Date(item.date);
      return date >= start && date <= effectiveEnd;
    },
  );

  let monthlyIncome = 0;
  let monthlyExpenses = 0;
  let savingsContribution = 0;
  for (const item of monthTransactions) {
    if (item.kind === "income") monthlyIncome += item.amount;
    if (item.kind === "expense") monthlyExpenses += Math.abs(item.amount);
    if (item.kind === "savings") savingsContribution += Math.abs(item.amount);
  }

  const netInflowOutflow = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (savingsContribution / monthlyIncome) * 100 : 0;
  const burnRate = monthlyExpenses;
  const cashRunwayMonths = burnRate > 0 ? availableCash / burnRate : null;
  const runwayThresholdMonths = 3;
  const isCashEnough =
    cashRunwayMonths === null ? null : cashRunwayMonths >= runwayThresholdMonths;
  const profitabilityStatus =
    netInflowOutflow > 0
      ? "making"
      : netInflowOutflow < 0
        ? "losing"
        : "break-even";
  const monthlyIncomeTrend = buildMonthlyTrend(transactions, 6);
  const currentIncome = monthlyIncomeTrend.at(-1)?.income ?? 0;
  const previousIncome = monthlyIncomeTrend.at(-2)?.income ?? 0;
  const revenueGrowthMoM = monthlyIncomeTrend.length >= 2
    ? percentChange(currentIncome, previousIncome)
    : null;
  const growthWindowSize = Math.min(3, Math.floor(monthlyIncomeTrend.length / 2));
  const revenueGrowth3m = growthWindowSize > 0
    ? (() => {
        const previousWindow = monthlyIncomeTrend.slice(
          -(growthWindowSize * 2),
          -growthWindowSize,
        );
        const currentWindow = monthlyIncomeTrend.slice(-growthWindowSize);
        if (previousWindow.length !== growthWindowSize || currentWindow.length !== growthWindowSize) {
          return null;
        }
        const previousAverage =
          previousWindow.reduce((sum, item) => sum + item.income, 0) / growthWindowSize;
        const currentAverage =
          currentWindow.reduce((sum, item) => sum + item.income, 0) / growthWindowSize;
        return percentChange(currentAverage, previousAverage);
      })()
    : null;
  const cycleDays = Math.max(
    1,
    Math.floor((effectiveEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );
  const burnPerDay = monthlyExpenses / cycleDays;
  const burnPerWeek = burnPerDay * 7;

  return {
    totalBalance,
    availableCash,
    netInflowOutflow,
    savingsRate,
    burnRate,
    cashRunwayMonths,
    monthlyIncome,
    monthlyExpenses,
    isCashEnough,
    runwayThresholdMonths,
    profitabilityStatus,
    revenueGrowthMoM,
    revenueGrowth3m,
    burnPerDay,
    burnPerWeek,
  };
}

export function buildPeriodRollups(
  period: FinancePeriod,
  transactions: FinanceTransaction[],
  currentBalance: number,
): PeriodRollup[] {
  const bucket = new Map<number, FinanceTransaction[]>();
  for (const tx of transactions) {
    if (tx.pending) continue;
    const start = getPeriodStart(new Date(tx.date), period).getTime();
    const list = bucket.get(start) ?? [];
    list.push(tx);
    bucket.set(start, list);
  }

  const starts = Array.from(bucket.keys()).sort((a, b) => a - b);
  const rollups: PeriodRollup[] = [];
  let rollingClosing = currentBalance;
  for (let idx = starts.length - 1; idx >= 0; idx -= 1) {
    const start = starts[idx];
    const items = bucket.get(start) ?? [];
    let income = 0;
    let expenses = 0;
    let transfers = 0;
    let investmentsAdded = 0;
    let savingsContribution = 0;
    for (const item of items) {
      if (item.kind === "income") income += item.amount;
      if (item.kind === "expense") expenses += Math.abs(item.amount);
      if (item.kind === "transfer") transfers += Math.abs(item.amount);
      if (item.kind === "investment") investmentsAdded += Math.abs(item.amount);
      if (item.kind === "savings") savingsContribution += Math.abs(item.amount);
    }
    const net =
      income - expenses - transfers - investmentsAdded - savingsContribution;
    const closingBalance = rollingClosing;
    const openingBalance = closingBalance - net;
    rollups.unshift({
      period,
      label: periodLabel(new Date(start), period),
      openingBalance,
      income,
      expenses,
      transfers,
      investmentsAdded,
      savingsContribution,
      closingBalance,
      deltaVsPriorPeriod: 0,
    });
    rollingClosing = openingBalance;
  }

  for (let i = 0; i < rollups.length; i += 1) {
    const prior = i > 0 ? rollups[i - 1] : undefined;
    rollups[i].deltaVsPriorPeriod = prior
      ? rollups[i].closingBalance - prior.closingBalance
      : 0;
  }

  return rollups;
}

export function buildSpendByCategory(
  transactions: FinanceTransaction[],
  limit = 6,
): CategorySpendItem[] {
  const spendByCategory = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.kind !== "expense") continue;
    const amount = Math.abs(tx.amount);
    spendByCategory.set(tx.category, (spendByCategory.get(tx.category) ?? 0) + amount);
  }
  return Array.from(spendByCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category, value]) => ({ category, value }));
}

export function buildSpendByMerchant(
  transactions: FinanceTransaction[],
  limit = 6,
): MerchantSpendItem[] {
  const spendByMerchant = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.kind !== "expense") continue;
    const amount = Math.abs(tx.amount);
    spendByMerchant.set(
      tx.normalizedMerchant,
      (spendByMerchant.get(tx.normalizedMerchant) ?? 0) + amount,
    );
  }
  return Array.from(spendByMerchant.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([merchant, value]) => ({ merchant, value }));
}

export function buildMonthlyTrend(transactions: FinanceTransaction[], months = 6) {
  const map = new Map<string, { income: number; expense: number }>();
  for (const tx of transactions) {
    if (tx.pending) continue;
    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const current = map.get(key) ?? { income: 0, expense: 0 };
    if (tx.kind === "income") current.income += tx.amount;
    if (tx.kind === "expense") current.expense += Math.abs(tx.amount);
    map.set(key, current);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-months)
    .map(([month, value]) => ({
      month,
      income: value.income,
      expense: value.expense,
      net: value.income - value.expense,
    }));
}

export function buildYearlyTrend(transactions: FinanceTransaction[], years = 5) {
  const map = new Map<string, { income: number; expense: number }>();
  for (const tx of transactions) {
    if (tx.pending) continue;
    const year = String(new Date(tx.date).getFullYear());
    const current = map.get(year) ?? { income: 0, expense: 0 };
    if (tx.kind === "income") current.income += tx.amount;
    if (tx.kind === "expense") current.expense += Math.abs(tx.amount);
    map.set(year, current);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-years)
    .map(([year, value]) => ({
      period: year,
      income: value.income,
      expense: value.expense,
      net: value.income - value.expense,
    }));
}

export function buildIncomeBySource(
  transactions: FinanceTransaction[],
  limit = 6,
): MerchantSpendItem[] {
  const incomeBySource = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.kind !== "income") continue;
    const source = canonicalizeCounterpartyName(tx.name);
    incomeBySource.set(source, (incomeBySource.get(source) ?? 0) + tx.amount);
  }
  return Array.from(incomeBySource.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([merchant, value]) => ({ merchant, value }));
}

export function detectAnomalies(
  transactions: FinanceTransaction[],
  limit = 5,
): FinanceAnomaly[] {
  const expenses = transactions.filter((item) => item.kind === "expense");
  const avg =
    expenses.length > 0
      ? expenses.reduce((sum, item) => sum + Math.abs(item.amount), 0) / expenses.length
      : 0;
  return expenses
    .filter((item) => Math.abs(item.amount) > avg * 2 && avg > 0)
    .slice(0, limit)
    .map((item) => ({
      transactionId: item.id,
      merchant: item.name,
      amount: Math.abs(item.amount),
      currency: item.currency,
      date: item.date,
      reason: "Amount is more than 2x average expense.",
    }));
}

export function detectSubscriptions(transactions: FinanceTransaction[]) {
  const recurring = new Map<string, { count: number; amount: number; currency: string }>();
  for (const tx of transactions) {
    if (tx.kind !== "expense") continue;
    const lower = tx.normalizedMerchant;
    if (!isSubscriptionMerchant(lower)) continue;
    const current = recurring.get(lower) ?? {
      count: 0,
      amount: 0,
      currency: tx.currency,
    };
    current.count += 1;
    current.amount += Math.abs(tx.amount);
    recurring.set(lower, current);
  }
  return Array.from(recurring.entries()).map(([merchant, value]) => ({
    merchant,
    monthlyEstimate: value.count > 0 ? value.amount / value.count : 0,
    occurrences: value.count,
    currency: value.currency,
  }));
}

export function buildMonthlySubscriptionLeaks(transactions: FinanceTransaction[], months = 12) {
  const grouped = new Map<string, { month: string; group: string; total: number; count: number; currency: string }>();
  for (const tx of transactions) {
    if (tx.kind !== "expense") continue;
    if (!isSubscriptionMerchant(tx.normalizedMerchant)) continue;
    const date = new Date(tx.date);
    if (Number.isNaN(date.getTime())) continue;
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const group = getSubscriptionGroupKey(tx.normalizedMerchant);
    const key = `${month}:${group}`;
    const current = grouped.get(key) ?? {
      month,
      group,
      total: 0,
      count: 0,
      currency: tx.currency,
    };
    current.total += Math.abs(tx.amount);
    current.count += 1;
    grouped.set(key, current);
  }
  const allRows = Array.from(grouped.values());
  const recentMonths = Array.from(new Set(allRows.map((item) => item.month)))
    .sort((a, b) => (a < b ? 1 : -1))
    .slice(0, Math.max(1, months));
  const recentMonthSet = new Set(recentMonths);
  return allRows
    .filter((item) => recentMonthSet.has(item.month))
    .sort((a, b) => (a.month === b.month ? b.total - a.total : (a.month < b.month ? 1 : -1)));
}

export function detectFixedExpenses(transactions: FinanceTransaction[]) {
  const grouped = new Map<string, { total: number; count: number; currency: string }>();
  for (const tx of transactions) {
    if (tx.kind !== "expense") continue;
    const key = `${tx.category}:${tx.normalizedMerchant}`;
    const current = grouped.get(key) ?? { total: 0, count: 0, currency: tx.currency };
    current.total += Math.abs(tx.amount);
    current.count += 1;
    grouped.set(key, current);
  }
  return Array.from(grouped.entries())
    .filter(([, value]) => value.count >= 2)
    .map(([key, value]) => {
      const [category, merchant] = key.split(":");
      return {
        category,
        merchant,
        monthlyEstimate: value.total / value.count,
        occurrences: value.count,
        currency: value.currency,
      };
    })
    .sort((a, b) => b.monthlyEstimate - a.monthlyEstimate)
    .slice(0, 10);
}
