import type { GcCountryCode, GcTransaction } from "./gocardless";

export interface AppSettings {
  defaultCountry: GcCountryCode;
  maxHistoricalDays: number;
  accessValidForDays: number;
  maxAccounts: number;
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

