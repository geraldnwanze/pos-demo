import { subHours, subDays } from 'date-fns'
import type { AuditLog } from '@/types'
import { NOW } from './generate'

const ips = ['102.89.34.10', '197.210.55.212', '105.112.9.87', '41.203.78.4']

interface Seed {
  userId: string
  userName: string
  action: string
  entity: string
  description: string
  hoursAgo?: number
  daysAgo?: number
}

const seeds: Seed[] = [
  { userId: 'user-3', userName: 'Tunde Bakare', action: 'SALE_COMPLETED', entity: 'Sale', description: 'completed transaction TXN-100283', hoursAgo: 1 },
  { userId: 'user-2', userName: 'Amara Nwosu', action: 'INVENTORY_ADJUSTED', entity: 'Inventory', description: 'adjusted inventory for SKU BEV-0002 (+10)', hoursAgo: 3 },
  { userId: 'user-1', userName: 'Chidi Okafor', action: 'USER_CREATED', entity: 'User', description: 'created admin account for Segun Adeyemi', hoursAgo: 5 },
  { userId: 'user-2', userName: 'Amara Nwosu', action: 'PRODUCT_CREATED', entity: 'Product', description: 'created product Coca Cola 50cl', daysAgo: 1 },
  { userId: 'user-4', userName: 'Ngozi Eze', action: 'SALE_COMPLETED', entity: 'Sale', description: 'completed transaction TXN-100251', daysAgo: 1 },
  { userId: 'user-2', userName: 'Amara Nwosu', action: 'PURCHASE_RECEIVED', entity: 'Purchase', description: 'marked purchase PO-00013 as received', daysAgo: 4 },
  { userId: 'user-1', userName: 'Chidi Okafor', action: 'SETTINGS_UPDATED', entity: 'Settings', description: 'updated business tax configuration', daysAgo: 5 },
  { userId: 'user-2', userName: 'Amara Nwosu', action: 'REFUND_ISSUED', entity: 'Sale', description: 'refunded transaction TXN-100199', daysAgo: 6 },
  { userId: 'user-7', userName: 'Segun Adeyemi', action: 'EXPENSE_ADDED', entity: 'Expense', description: 'added expense Freezer repair (₦35,000)', daysAgo: 8 },
  { userId: 'user-1', userName: 'Chidi Okafor', action: 'STORE_CREATED', entity: 'Store', description: 'created store Asaba Branch', daysAgo: 12 },
  { userId: 'user-2', userName: 'Amara Nwosu', action: 'PRODUCT_UPDATED', entity: 'Product', description: 'updated selling price for Milo Tin 500g', daysAgo: 2 },
  { userId: 'user-1', userName: 'Chidi Okafor', action: 'ROLE_CHANGED', entity: 'User', description: 'changed role of Segun Adeyemi to Admin', daysAgo: 10 },
]

export const auditLogs: AuditLog[] = seeds.map((s, i) => ({
  id: `log-${i + 1}`,
  userId: s.userId,
  userName: s.userName,
  action: s.action,
  entity: s.entity,
  description: s.description,
  ipAddress: ips[i % ips.length],
  createdAt: (s.hoursAgo != null ? subHours(NOW, s.hoursAgo) : subDays(NOW, s.daysAgo ?? 1)).toISOString(),
}))
