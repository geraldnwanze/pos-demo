import { format, formatDistanceToNow, parseISO } from 'date-fns'

/**
 * Currency formatting. Every money value in the app goes through here, so the
 * business currency (Settings → Business) is applied in one place. It's kept in
 * sync by a subscription at the bottom of stores/dataStore.ts.
 */
export interface CurrencyOptions {
  currency?: string
  locale?: string
  /** show decimals (kobo). Defaults to true. */
  decimals?: boolean
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
}

let activeCurrency = 'NGN'

export function setActiveCurrency(currency: string): void {
  activeCurrency = currency
}

export function currencySymbol(currency = activeCurrency): string {
  return CURRENCY_SYMBOLS[currency] ?? currency
}

export function formatCurrency(
  value: number,
  { currency = activeCurrency, locale = 'en-NG', decimals = true }: CurrencyOptions = {},
): string {
  const symbol = currencySymbol(currency)
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(value)
  return `${symbol}${formatted}`
}

/** Compact currency, e.g. ₦24.9M — used for KPI cards. */
export function formatCurrencyCompact(value: number, currency = activeCurrency): string {
  const symbol = currencySymbol(currency)
  const formatted = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
  return `${symbol}${formatted}`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value
}

export function formatDate(value: string | Date, pattern = 'dd MMM yyyy'): string {
  return format(toDate(value), pattern)
}

export function formatDateTime(value: string | Date): string {
  return format(toDate(value), 'dd MMM yyyy, h:mm a')
}

export function formatTime(value: string | Date): string {
  return format(toDate(value), 'h:mm a')
}

export function formatRelative(value: string | Date): string {
  return formatDistanceToNow(toDate(value), { addSuffix: true })
}
