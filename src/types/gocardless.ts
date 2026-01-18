export type GcCountryCode = "ie" | "gb";

export interface GcTokenResponse {
  access: string;
  access_expires: number;
  refresh: string;
  refresh_expires: number;
}

export interface GcInstitution {
  id: string;
  name: string;
  bic?: string;
  countries: string[];
  logo?: string;
  transaction_total_days?: number;
}

export interface GcAgreementResponse {
  id: string;
  created: string;
  max_historical_days: number;
  access_valid_for_days: number;
  access_scope: string[];
  institution_id: string;
}

export interface GcRequisitionResponse {
  id: string;
  created: string;
  status: string;
  institution_id: string;
  reference: string;
  agreement: string;
  link: string;
  accounts: string[];
}

export interface GcAccountDetailsResponse {
  account: {
    resourceId: string;
    iban?: string;
    currency?: string;
    ownerName?: string;
    name?: string;
    cashAccountType?: string;
    product?: string;
    status?: string;
  };
}

export interface GcAccountBalancesResponse {
  balances: Array<{
    balanceAmount: {
      amount: string;
      currency: string;
    };
    balanceType: string;
    lastChangeDateTime?: string;
  }>;
}

export interface GcAccountTransactionsResponse {
  transactions: {
    booked: GcTransaction[];
    pending?: GcTransaction[];
  };
}

export interface GcTransaction {
  transactionId?: string;
  bookingDate?: string;
  valueDate?: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
  creditorName?: string;
  debtorName?: string;
  remittanceInformationUnstructured?: string;
  bankTransactionCode?: string;
}

