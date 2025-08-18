// Currency utilities for global currency formatting
import { useQuery } from "@tanstack/react-query";

export interface CurrencyOption {
  code: string;
  name: string;
  symbol?: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'RM', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
];

// Get currency symbol by code
export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

// Format amount with currency
export function formatCurrency(amount: number | string, currencyCode: string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const symbol = getCurrencySymbol(currencyCode);
  
  // Handle different decimal places for different currencies
  let decimals = 2;
  if (['JPY', 'KRW', 'VND', 'IDR'].includes(currencyCode)) {
    decimals = 0; // These currencies typically don't use decimals
  }
  
  return `${symbol} ${numAmount.toFixed(decimals)}`;
}

// Get formatted currency for input display (just the symbol)
export function getCurrencyPrefix(currencyCode: string): string {
  return getCurrencySymbol(currencyCode);
}

// Hook to get current system currency from payment settings

export function useSystemCurrency(): {
  currency: string;
  symbol: string;
  formatAmount: (amount: number | string) => string;
  prefix: string;
  isLoading: boolean;
} {
  // Fetch payment settings to get current currency
  const { data: paymentSettings, isLoading } = useQuery({
    queryKey: ['/api/payment-settings'],
    retry: false,
  });
  
  const currency = paymentSettings?.currency || 'RM'; // Default to RM if not set
  const symbol = getCurrencySymbol(currency);
  
  return {
    currency,
    symbol,
    formatAmount: (amount: number | string) => formatCurrency(amount, currency),
    prefix: getCurrencyPrefix(currency),
    isLoading,
  };
}