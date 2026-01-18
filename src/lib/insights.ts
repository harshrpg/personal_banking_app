import type { DashboardTransaction } from "@/components/transactions-table";

const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  { category: "Groceries", keywords: ["tesco", "aldi", "lidl", "super", "market"] },
  { category: "Transport", keywords: ["uber", "lyft", "bolt", "train", "bus"] },
  { category: "Subscriptions", keywords: ["netflix", "spotify", "prime", "subscription"] },
  { category: "Coffee", keywords: ["coffee", "cafe", "starbucks"] },
  { category: "Shopping", keywords: ["amazon", "store", "shop"] },
];

function categorize(name: string) {
  const lower = name.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return rule.category;
    }
  }
  return "Other";
}

export function buildInsights(transactions: DashboardTransaction[]) {
  const spendByCategory = new Map<string, number>();
  const spendByMerchant = new Map<string, number>();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let currentMonthSpend = 0;
  let lastMonthSpend = 0;

  transactions.forEach((tx) => {
    if (tx.amount >= 0) return;
    const amount = Math.abs(tx.amount);
    const category = categorize(tx.name);
    spendByCategory.set(category, (spendByCategory.get(category) ?? 0) + amount);
    spendByMerchant.set(tx.name, (spendByMerchant.get(tx.name) ?? 0) + amount);

    const date = new Date(tx.date);
    if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
      currentMonthSpend += amount;
    }
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    if (date.getFullYear() === lastMonthYear && date.getMonth() === lastMonth) {
      lastMonthSpend += amount;
    }
  });

  const categories = Array.from(spendByCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, value]) => ({ category, value }));

  const merchants = Array.from(spendByMerchant.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([merchant, value]) => ({ merchant, value }));

  return {
    categories,
    merchants,
    currentMonthSpend,
    lastMonthSpend,
  };
}

