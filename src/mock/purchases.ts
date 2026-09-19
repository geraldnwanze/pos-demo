import { subDays, addDays } from 'date-fns'
import type { Purchase, PurchaseItem } from '@/types'
import { products } from './products'
import { money } from '@/lib/sales'
import { NOW } from './generate'

function items(indexes: number[], qtys: number[]): PurchaseItem[] {
  return indexes.map((idx, i) => {
    const p = products[idx]
    const quantity = qtys[i]
    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      quantity,
      costPrice: p.costPrice,
      lineTotal: money(p.costPrice * quantity),
    }
  })
}

function total(its: PurchaseItem[]): number {
  return money(its.reduce((s, i) => s + i.lineTotal, 0))
}

const p1 = items([0, 1, 2, 4], [200, 200, 150, 300])
const p2 = items([8, 9, 10], [500, 300, 100])
const p3 = items([15, 16, 17], [80, 60, 40])
const p4 = items([28, 29, 30], [100, 60, 20])
const p5 = items([5, 12, 24], [120, 60, 80])

export const purchases: Purchase[] = [
  {
    id: 'pur-1',
    reference: 'PO-00012',
    supplierId: 'sup-1',
    storeId: 'store-1',
    items: p1,
    total: total(p1),
    status: 'received',
    expectedDate: subDays(NOW, 8).toISOString(),
    receivedDate: subDays(NOW, 7).toISOString(),
    createdBy: 'user-2',
    createdAt: subDays(NOW, 12).toISOString(),
  },
  {
    id: 'pur-2',
    reference: 'PO-00013',
    supplierId: 'sup-2',
    storeId: 'store-1',
    items: p2,
    total: total(p2),
    status: 'received',
    expectedDate: subDays(NOW, 5).toISOString(),
    receivedDate: subDays(NOW, 4).toISOString(),
    createdBy: 'user-2',
    createdAt: subDays(NOW, 9).toISOString(),
  },
  {
    id: 'pur-3',
    reference: 'PO-00014',
    supplierId: 'sup-3',
    storeId: 'store-1',
    items: p3,
    total: total(p3),
    status: 'ordered',
    expectedDate: addDays(NOW, 3).toISOString(),
    receivedDate: null,
    createdBy: 'user-2',
    createdAt: subDays(NOW, 2).toISOString(),
  },
  {
    id: 'pur-4',
    reference: 'PO-00015',
    supplierId: 'sup-6',
    storeId: 'store-1',
    items: p4,
    total: total(p4),
    status: 'draft',
    expectedDate: addDays(NOW, 7).toISOString(),
    receivedDate: null,
    createdBy: 'user-2',
    createdAt: subDays(NOW, 1).toISOString(),
  },
  {
    id: 'pur-5',
    reference: 'PO-00016',
    supplierId: 'sup-1',
    storeId: 'store-2',
    items: p5,
    total: total(p5),
    status: 'cancelled',
    expectedDate: subDays(NOW, 3).toISOString(),
    receivedDate: null,
    createdBy: 'user-7',
    createdAt: subDays(NOW, 6).toISOString(),
  },
]
