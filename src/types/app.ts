import type { GcCountryCode, GcTransaction } from "./gocardless";

export type WorkspaceMode = "personal" | "business";

export interface AppSettings {
  defaultCountry: GcCountryCode;
  maxHistoricalDays: number;
  accessValidForDays: number;
  maxAccounts: number;
  recurringRuleSensitivity?: "low" | "medium" | "high";
  merchantAliasMode?: "strict" | "balanced" | "loose";
  budgetAlertThreshold?: number;
  notificationsEnabled?: boolean;
  privacyMode?: "standard" | "minimal";
  aiTone?: "strict" | "coach" | "neutral";
}

export interface RequisitionRecord {
  id: string;
  institutionId: string;
  reference: string;
  createdAt: string;
  status: string;
  accounts: string[];
}

export interface AccountRecord {
  accountId: string;
  institutionId: string;
  name: string;
  alias?: string;
  currency?: string;
  lastSync?: string;
  selected: boolean;
}

export interface AccountBalanceSnapshot {
  accountId: string;
  amount: number;
  currency: string;
  balanceType: string;
  updatedAt: string;
}

export interface AccountTransactionsSnapshot {
  accountId: string;
  booked: GcTransaction[];
  pending: GcTransaction[];
  updatedAt: string;
}

export interface DashboardAccount extends AccountRecord {
  balances?: AccountBalanceSnapshot | null;
  transactions?: AccountTransactionsSnapshot | null;
}

export interface DashboardSyncStatus {
  limit: number;
  used: number;
  remaining: number;
  windowSeconds: number;
  nextAvailableAt?: string;
  lastSyncAt?: string;
}

export interface DashboardResponse {
  settings: AppSettings;
  accounts: DashboardAccount[];
  sync: DashboardSyncStatus;
}

export type FinancePeriod = "daily" | "weekly" | "monthly" | "yearly";

export type FinanceTransactionKind =
  | "income"
  | "expense"
  | "transfer"
  | "savings"
  | "investment";

export interface FinanceTransaction {
  id: string;
  accountId: string;
  accountName: string;
  date: string;
  name: string;
  amount: number;
  currency: string;
  pending: boolean;
  category: string;
  kind: FinanceTransactionKind;
  normalizedMerchant: string;
}

export interface PeriodRollup {
  period: FinancePeriod;
  label: string;
  openingBalance: number;
  income: number;
  expenses: number;
  transfers: number;
  investmentsAdded: number;
  savingsContribution: number;
  closingBalance: number;
  deltaVsPriorPeriod: number;
}

export interface DashboardTopMetrics {
  totalBalance: number;
  availableCash: number;
  netInflowOutflow: number;
  savingsRate: number;
  burnRate: number;
  cashRunwayMonths: number | null;
  monthlyIncome: number;
  monthlyExpenses: number;
  isCashEnough: boolean | null;
  runwayThresholdMonths: number;
  profitabilityStatus: "making" | "losing" | "break-even";
  revenueGrowthMoM: number | null;
  revenueGrowth3m: number | null;
  burnPerDay: number;
  burnPerWeek: number;
}

export interface CategorySpendItem {
  category: string;
  value: number;
}

export interface MerchantSpendItem {
  merchant: string;
  value: number;
}

export interface FinanceAnomaly {
  transactionId: string;
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  reason: string;
}

export interface CategorizationRule {
  id: string;
  match: string;
  category: string;
  essential: boolean;
  fixed: boolean;
  updatedAt: string;
}

export interface TransactionAnnotation {
  category?: string;
  notes?: string;
  tags?: string[];
  splitCount?: number;
}

export interface BudgetItem {
  category: string;
  monthlyBudget: number;
  rolloverEnabled: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

export interface InvestmentHolding {
  id: string;
  symbol: string;
  account: string;
  units: number;
  costBasis: number;
  currentValue: number;
  dividendsYtd: number;
}

export interface ApiHealthStatus {
  tokenStatus: "ready" | "missing" | "refreshing" | "error";
  message?: string;
  updatedAt?: string;
  lastApiCall?: {
    path: string;
    ok: boolean;
    status: number;
    at: string;
  };
}

