// Utility functions for parsing and formatting amounts
export const toNum = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  // Remove commas/spaces/RM prefix
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export const toFixed2 = (v: unknown) =>
  toNum(v).toFixed(2);

export const formatMoney = (amount: unknown): string => {
  const num = toNum(amount);
  return num.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};