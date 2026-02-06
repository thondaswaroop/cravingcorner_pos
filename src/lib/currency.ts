// Currency configuration for India
export const CURRENCY_SYMBOL = "₹";
export const CURRENCY_CODE = "INR";
export const LOCALE = "en-IN";

// Format number as Indian Rupee
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format without symbol
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Parse currency string to number
export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]+/g, "")) || 0;
}
