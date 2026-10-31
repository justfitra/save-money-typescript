import type { ChartSlice, Transaction } from "../types";

/** Sum of one numeric field over a list. */
export const sumBy = <T extends object>(items: T[], field: keyof T): number =>
  items.reduce((total, item) => total + (item[field] as unknown as number), 0);

/** Expense totals per category, biggest first: [[category, amount], ...]. */
export const sumExpensesByCategory = (
  transactions: Transaction[],
  excludedCategory?: string,
): ChartSlice[] => {
  const totals: Record<string, number> = {};
  transactions.forEach(({ category, expense }) => {
    if (expense && category !== excludedCategory)
      totals[category] = (totals[category] || 0) + expense;
  });
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
};
