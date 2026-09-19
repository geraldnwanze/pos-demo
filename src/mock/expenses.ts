import { subDays } from 'date-fns'
import type { Expense, ExpenseCategory, PaymentMethod } from '@/types'
import { NOW } from './generate'

interface Seed {
  title: string
  category: ExpenseCategory
  amount: number
  method: PaymentMethod
  daysAgo: number
  store: string
  by: string
  notes: string
}

const seeds: Seed[] = [
  { title: 'Shop rent - September', category: 'Rent', amount: 850000, method: 'transfer', daysAgo: 18, store: 'store-1', by: 'user-2', notes: 'Quarterly rent instalment' },
  { title: 'PHCN electricity bill', category: 'Utilities', amount: 145000, method: 'transfer', daysAgo: 12, store: 'store-1', by: 'user-2', notes: 'August consumption' },
  { title: 'Staff salaries', category: 'Salaries', amount: 1250000, method: 'transfer', daysAgo: 4, store: 'store-1', by: 'user-2', notes: 'Monthly payroll' },
  { title: 'Generator diesel', category: 'Utilities', amount: 96000, method: 'cash', daysAgo: 3, store: 'store-1', by: 'user-3', notes: '120 litres' },
  { title: 'Delivery van fuel', category: 'Transport', amount: 42000, method: 'cash', daysAgo: 2, store: 'store-1', by: 'user-3', notes: 'Restock runs' },
  { title: 'Instagram ads', category: 'Marketing', amount: 60000, method: 'card', daysAgo: 6, store: 'store-1', by: 'user-2', notes: 'Weekend promo' },
  { title: 'Freezer repair', category: 'Maintenance', amount: 35000, method: 'cash', daysAgo: 8, store: 'store-2', by: 'user-7', notes: 'Thermostat replacement' },
  { title: 'Cleaning supplies', category: 'Other', amount: 18500, method: 'cash', daysAgo: 1, store: 'store-1', by: 'user-3', notes: '' },
  { title: 'Internet subscription', category: 'Utilities', amount: 40000, method: 'transfer', daysAgo: 10, store: 'store-1', by: 'user-2', notes: 'Monthly broadband' },
  { title: 'POS terminal fees', category: 'Other', amount: 25000, method: 'transfer', daysAgo: 5, store: 'store-1', by: 'user-2', notes: 'Bank charges' },
  { title: 'Security guard stipend', category: 'Salaries', amount: 80000, method: 'cash', daysAgo: 4, store: 'store-2', by: 'user-7', notes: '' },
  { title: 'Signage printing', category: 'Marketing', amount: 55000, method: 'card', daysAgo: 15, store: 'store-3', by: 'user-2', notes: 'New banner' },
]

export const expenses: Expense[] = seeds.map((s, i) => ({
  id: `exp-${i + 1}`,
  reference: `EXP-${String(2001 + i)}`,
  title: s.title,
  category: s.category,
  amount: s.amount,
  paymentMethod: s.method,
  storeId: s.store,
  date: subDays(NOW, s.daysAgo).toISOString(),
  addedBy: s.by,
  notes: s.notes,
  createdAt: subDays(NOW, s.daysAgo).toISOString(),
}))
