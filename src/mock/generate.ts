import { addMinutes, setHours, setMinutes, subDays } from 'date-fns'
import type {
  DiscountType,
  PaymentMethod,
  Sale,
  SaleItem,
  StockMovement,
  StockMovementType,
} from '@/types'
import { computeSaleTotals, lineTotal, money } from '@/lib/sales'
import { pick, pickWeighted, rand, randInt } from './rng'
import { products } from './products'
import { customers } from './customers'
import { users } from './users'

/** Reference "now" for the demo dataset. */
export const NOW = new Date('2026-09-19T10:30:00.000Z')

const sellers = users.filter((u) => u.role === 'seller' || u.role === 'admin')
const activeProducts = products.filter((p) => p.status === 'active')

const paymentWeights: [PaymentMethod, number][] = [
  ['cash', 5],
  ['card', 3],
  ['transfer', 2],
]

function buildSaleItems(): SaleItem[] {
  const count = randInt(1, 5)
  const chosen = new Set<string>()
  const items: SaleItem[] = []
  for (let i = 0; i < count; i++) {
    const product = pick(activeProducts)
    if (chosen.has(product.id)) continue
    chosen.add(product.id)
    const quantity = randInt(1, 6)
    items.push({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity,
      unitPrice: product.sellingPrice,
      taxRate: product.taxRate,
      lineTotal: lineTotal(product.sellingPrice, quantity),
    })
  }
  return items
}

function generateSales(): Sale[] {
  const sales: Sale[] = []
  // Spread sales across the last 90 days, weighted toward recent days.
  const totalDays = 90
  for (let day = 0; day < totalDays; day++) {
    const date = subDays(NOW, day)
    // more sales on recent days
    const base = day < 7 ? 10 : day < 30 ? 6 : 3
    const daily = randInt(Math.max(1, base - 2), base + 3)
    for (let s = 0; s < daily; s++) {
      const seller = pick(sellers)
      const withCustomer = rand() > 0.35
      const customer = withCustomer ? pick(customers) : null
      const items = buildSaleItems()
      if (items.length === 0) continue

      const hasDiscount = rand() > 0.7
      const discountType: DiscountType = rand() > 0.5 ? 'percentage' : 'fixed'
      const discountValue = hasDiscount
        ? discountType === 'percentage'
          ? randInt(2, 10)
          : randInt(1, 5) * 100
        : 0

      const totals = computeSaleTotals(items, discountType, discountValue)
      const payment = pickWeighted(paymentWeights)
      const amountPaid =
        payment === 'cash' ? money(Math.ceil(totals.total / 500) * 500) : totals.total

      const createdAt = addMinutes(
        setMinutes(setHours(date, randInt(8, 20)), randInt(0, 59)),
        0,
      )

      // ~4% of older sales were refunded
      const refunded = day > 2 && rand() > 0.96

      sales.push({
        id: `sale-${sales.length + 1}`,
        reference: `TXN-${String(100000 + sales.length + 1)}`,
        storeId: seller.storeId ?? 'store-1',
        sellerId: seller.id,
        customerId: customer?.id ?? null,
        customerName: customer?.name ?? 'Walk-in Customer',
        items,
        subtotal: totals.subtotal,
        discountType,
        discountValue,
        discountAmount: totals.discountAmount,
        tax: totals.tax,
        total: totals.total,
        paymentMethod: payment,
        amountPaid,
        change: money(amountPaid - totals.total),
        status: refunded ? 'refunded' : 'completed',
        refundReason: refunded ? 'Customer returned items' : undefined,
        createdAt: createdAt.toISOString(),
      })
    }
  }
  return sales.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export const sales: Sale[] = generateSales()

/** Build recent stock movements: some restocks plus the last N sales. */
function generateStockMovements(): StockMovement[] {
  const movements: StockMovement[] = []
  let id = 1

  // Historical stock-in for each product (initial receiving)
  for (const product of products) {
    movements.push({
      id: `mov-${id++}`,
      productId: product.id,
      type: 'STOCK_IN',
      quantity: product.stock + product.unitsSold,
      reference: 'Opening stock',
      userId: 'user-2',
      note: 'Initial inventory load',
      createdAt: subDays(NOW, 88).toISOString(),
    })
  }

  // Movements from the most recent 60 sales
  const recentSales = sales.slice(0, 60)
  for (const sale of recentSales) {
    if (sale.status === 'refunded') continue
    for (const item of sale.items) {
      movements.push({
        id: `mov-${id++}`,
        productId: item.productId,
        type: 'SALE' as StockMovementType,
        quantity: -item.quantity,
        reference: sale.reference,
        userId: sale.sellerId,
        createdAt: sale.createdAt,
      })
    }
  }

  // A few manual adjustments
  const adjProducts = [products[1], products[5], products[12], products[24]]
  adjProducts.forEach((p, i) => {
    movements.push({
      id: `mov-${id++}`,
      productId: p.id,
      type: 'ADJUSTMENT',
      quantity: i % 2 === 0 ? 10 : -4,
      reference: 'Stock count',
      userId: 'user-2',
      note: i % 2 === 0 ? 'Found extra stock during count' : 'Damaged units removed',
      createdAt: subDays(NOW, i + 1).toISOString(),
    })
  })

  return movements.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export const stockMovements: StockMovement[] = generateStockMovements()
