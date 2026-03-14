export type Subscription = {
  name: string;
  billingDate: string;
  price: number;
  occurrences?: number;
  currency?: string;
};

export type FixedVariableItem = {
  name: string;
  frequency: "Monthly" | "Weekly" | "Detected";
  price: number;
  currency?: string;
};

export const subscriptions: Subscription[] = [
  { name: "Netflix", billingDate: "Monthly", price: 10.99 },
  { name: "LinkedIn", billingDate: "Monthly", price: 43.99 },
  { name: "The Warehouse Gym", billingDate: "Monthly", price: 54 },
  { name: "ChatGPT", billingDate: "Monthly", price: 22.99 },
  { name: "Cursor", billingDate: "Monthly", price: 24.99 },
  { name: "Apple", billingDate: "Monthly", price: 1.99 },
  { name: "Google One", billingDate: "Monthly", price: 1.99 },
  { name: "Youtube", billingDate: "Monthly", price: 12 },
  { name: "Microsoft 365", billingDate: "Monthly", price: 1.99 },
  { name: "Deliveroo", billingDate: "Monthly", price: 8 },
];

export const fixedVariables: FixedVariableItem[] = [
  { name: "Trainer", frequency: "Monthly", price: 149 },
  { name: "House rent", frequency: "Monthly", price: 2300 },
  { name: "Electricity", frequency: "Weekly", price: 50 },
  { name: "Diesel", frequency: "Weekly", price: 50 },
  { name: "Groceries", frequency: "Weekly", price: 200 },
  { name: "Social activities", frequency: "Weekly", price: 100 },
];

export const monthlyIncome = {
  salary: 5000,
  business: 500,
};

export function calculateSubscriptionsTotal() {
  return subscriptions.reduce((sum, item) => sum + item.price, 0);
}

export function calculateFixedVariablesMonthlyTotal() {
  return fixedVariables.reduce((sum, item) => {
    const monthlyAmount =
      item.frequency === "Weekly" ? item.price * (52 / 12) : item.price;
    return sum + monthlyAmount;
  }, 0);
}

export function calculateMonthlyCostsTotal() {
  return calculateSubscriptionsTotal() + calculateFixedVariablesMonthlyTotal();
}

export function fromDetectedSubscriptions(
  items: { merchant: string; monthlyEstimate: number; occurrences: number; currency: string }[],
): Subscription[] {
  if (items.length === 0) return subscriptions;
  return items.map((item) => ({
    name: item.merchant,
    billingDate: "Detected recurring",
    price: Number(item.monthlyEstimate.toFixed(2)),
    occurrences: item.occurrences,
    currency: item.currency,
  }));
}

export function fromDetectedFixedExpenses(
  items: {
    category: string;
    merchant: string;
    monthlyEstimate: number;
    occurrences: number;
    currency: string;
  }[],
): FixedVariableItem[] {
  if (items.length === 0) return fixedVariables;
  return items.map((item) => ({
    name: `${item.category} · ${item.merchant}`,
    frequency: "Detected",
    price: Number(item.monthlyEstimate.toFixed(2)),
    currency: item.currency,
  }));
}

