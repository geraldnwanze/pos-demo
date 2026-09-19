import {
  eachDayOfInterval,
  endOfDay,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns'
import type { Expense, PaymentMethod, Product, Sale } from '@/types'
import { money } from './sales'

export function isActiveSale(s: Sale): boolean {
  return s.status === 'completed' || s.status === 'partially_refunded'
}

/** Net revenue of a sale, accounting for partial refunds. */
export function saleNet(s: Sale): number {
  if (s.status === 'refunded' || s.status === 'cancelled') return 0
  if (s.status === 'partially_refunded') {
    const refundedValue = s.items.reduce(
      (sum, i) => sum + (i.refundedQty ?? 0) * i.unitPrice,
      0,
    )
    return money(Math.max(0, s.total - refundedValue))
  }
  return s.total
}

export function salesInRange(sales: Sale[], from: Date, to: Date): Sale[] {
  return sales.filter((s) =>
    isWithinInterval(parseISO(s.createdAt), { start: startOfDay(from), end: endOfDay(to) }),
  )
}

export function todaySales(sales: Sale[], now = new Date()): Sale[] {
  return salesInRange(sales, now, now)
}

export interface RevenuePoint {
  date: string
  label: string
  revenue: number
  transactions: number
}

export function revenueByDay(sales: Sale[], days: number, now = new Date()): RevenuePoint[] {
  const start = subDays(startOfDay(now), days - 1)
  const interval = eachDayOfInterval({ start, end: endOfDay(now) })
  return interval.map((day) => {
    const daySales = sales.filter(
      (s) =>
        isWithinInterval(parseISO(s.createdAt), { start: startOfDay(day), end: endOfDay(day) }) &&
        isActiveSale(s),
    )
    return {
      date: format(day, 'yyyy-MM-dd'),
      label: format(day, days > 31 ? 'd MMM' : 'EEE d'),
      revenue: money(daySales.reduce((sum, s) => sum + saleNet(s), 0)),
      transactions: daySales.length,
    }
  })
}

export function salesByPaymentMethod(sales: Sale[]): { method: PaymentMethod; label: string; value: number }[] {
  const labels: Record<PaymentMethod, string> = {
    cash: 'Cash',
    card: 'POS / Card',
    transfer: 'Bank Transfer',
  }
  const totals: Record<PaymentMethod, number> = { cash: 0, card: 0, transfer: 0 }
  sales.filter(isActiveSale).forEach((s) => {
    totals[s.paymentMethod] += saleNet(s)
  })
  return (Object.keys(totals) as PaymentMethod[]).map((method) => ({
    method,
    label: labels[method],
    value: money(totals[method]),
  }))
}

export interface TopProduct {
  productId: string
  name: string
  sku: string
  units: number
  revenue: number
}

export function topSellingProducts(sales: Sale[], limit = 5): TopProduct[] {
  const map = new Map<string, TopProduct>()
  sales.filter(isActiveSale).forEach((s) => {
    s.items.forEach((item) => {
      const soldQty = item.quantity - (item.refundedQty ?? 0)
      if (soldQty <= 0) return
      const existing = map.get(item.productId)
      const revenue = money(soldQty * item.unitPrice)
      if (existing) {
        existing.units += soldQty
        existing.revenue = money(existing.revenue + revenue)
      } else {
        map.set(item.productId, {
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          units: soldQty,
          revenue,
        })
      }
    })
  })
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

export function lowStockProducts(products: Product[]): Product[] {
  return products
    .filter((p) => p.status === 'active' && p.stock <= p.minStock)
    .sort((a, b) => a.stock - a.minStock - (b.stock - b.minStock))
}

export function inventoryValue(products: Product[]): { cost: number; retail: number } {
  return products.reduce(
    (acc, p) => ({
      cost: money(acc.cost + p.stock * p.costPrice),
      retail: money(acc.retail + p.stock * p.sellingPrice),
    }),
    { cost: 0, retail: 0 },
  )
}

export function expensesInRange(expenses: Expense[], from: Date, to: Date): Expense[] {
  return expenses.filter((e) =>
    isWithinInterval(parseISO(e.date), { start: startOfDay(from), end: endOfDay(to) }),
  )
}

export function monthlyRevenue(sales: Sale[], now = new Date()): number {
  const start = startOfMonth(now)
  return money(
    salesInRange(sales, start, now)
      .filter(isActiveSale)
      .reduce((sum, s) => sum + saleNet(s), 0),
  )
}
