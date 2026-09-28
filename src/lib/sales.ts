import type { DiscountType, Sale, SaleItem } from '@/types'

export interface SaleTotals {
  subtotal: number
  discountAmount: number
  tax: number
  total: number
}

/** Round to 2 decimals to avoid floating point noise on money. */
export function money(n: number): number {
  return Math.round(n * 100) / 100
}

export function lineTotal(unitPrice: number, quantity: number): number {
  return money(unitPrice * quantity)
}

export function computeDiscountAmount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  if (discountValue <= 0) return 0
  const raw = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue
  return money(Math.min(raw, subtotal))
}

/**
 * Compute totals for a sale. Tax is computed per-item on the post-discount
 * portion (discount applied proportionally across the basket).
 */
export function computeSaleTotals(
  items: SaleItem[],
  discountType: DiscountType,
  discountValue: number,
): SaleTotals {
  const subtotal = money(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0))
  const discountAmount = computeDiscountAmount(subtotal, discountType, discountValue)
  const discountRatio = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1

  const tax = money(
    items.reduce((sum, i) => {
      const linePostDiscount = i.unitPrice * i.quantity * discountRatio
      return sum + (linePostDiscount * i.taxRate) / 100
    }, 0),
  )

  const total = money(subtotal - discountAmount + tax)
  return { subtotal, discountAmount, tax, total }
}

type SaleAmounts = Pick<Sale, 'subtotal' | 'discountAmount'>
type LinePrice = Pick<SaleItem, 'unitPrice' | 'taxRate'>

function discountRatio(sale: SaleAmounts): number {
  return sale.subtotal > 0 ? (sale.subtotal - sale.discountAmount) / sale.subtotal : 1
}

/**
 * What the customer actually paid for `qty` units of a line: unit price, less
 * the sale's discount spread proportionally, plus that line's tax. Mirrors
 * `computeSaleTotals`, so refunding every unit returns the sale total.
 */
export function refundBreakdown(
  sale: SaleAmounts,
  item: LinePrice,
  qty: number,
): { net: number; tax: number; total: number } {
  const net = item.unitPrice * qty * discountRatio(sale)
  const tax = (net * item.taxRate) / 100
  return { net: money(net), tax: money(tax), total: money(net + tax) }
}

/** Refund value of every unit refunded so far on a sale. */
export function refundedTotals(sale: Sale): { net: number; tax: number; total: number } {
  if (sale.status === 'refunded') {
    return { net: money(sale.subtotal - sale.discountAmount), tax: sale.tax, total: sale.total }
  }
  const sum = sale.items.reduce(
    (acc, i) => {
      const r = refundBreakdown(sale, i, i.refundedQty ?? 0)
      return { net: acc.net + r.net, tax: acc.tax + r.tax }
    },
    { net: 0, tax: 0 },
  )
  const total = sale.refundedAmount ?? money(sum.net + sum.tax)
  return { net: money(sum.net), tax: money(sum.tax), total }
}
