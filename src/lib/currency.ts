/**
 * Currency utility for formatting and parsing amounts in INR
 * Uses Intl.NumberFormat for locale-aware formatting (Indian comma placement)
 */

export const CURRENCY_CODE = 'INR';
export const CURRENCY_SYMBOL = '₹';
export const CURRENCY_LOCALE = 'en-IN';

/**
 * Format amount with Intl.NumberFormat
 * Works in both server and client contexts
 * @param amount - The amount to format
 * @param options - Optional Intl.NumberFormatOptions
 * @returns Formatted currency string (e.g., "₹1,23,456.00")
 */
export function formatCurrency(
  amount: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Parse a formatted currency string to a number
 * Strips currency symbol and commas, extracts numeric value
 * @param value - Formatted currency string (e.g., "₹1,23,456.00")
 * @returns Parsed number value
 */
export function parseAmount(value: string): number {
  return parseFloat(value.replace(/[^0-9.-]/g, ''));
}

/**
 * Format an amount for display with symbol and number
 * Convenience function combining formatCurrency output
 * @param amount - The amount to format
 * @returns Formatted currency string with symbol
 */
export function formatAmount(amount: number): string {
  return formatCurrency(amount);
}

/**
 * Format a quote or invoice total amount
 * Ensures consistent presentation of larger amounts
 * @param amount - The total amount
 * @returns Formatted currency string
 */
export function formatQuoteAmount(amount: number): string {
  return formatCurrency(amount);
}
