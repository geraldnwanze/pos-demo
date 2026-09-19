import type { DiscountType, SaleItem } from '@/types'

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
