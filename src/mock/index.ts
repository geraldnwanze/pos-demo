import { stores } from './stores'
import { users } from './users'
import { categories } from './categories'
import { suppliers } from './suppliers'
import { products } from './products'
import { customers } from './customers'
import { sales, stockMovements, NOW } from './generate'
import { purchases } from './purchases'
import { expenses } from './expenses'
import { auditLogs } from './auditLogs'
import { notifications } from './notifications'
import { businessSettings, posSettings } from './settings'

/** Deep clone so mutable stores never mutate the source seed arrays. */
function clone<T>(value: T): T {
  return structuredClone(value)
}

export const db = {
  now: NOW,
  stores,
  users,
  categories,
  suppliers,
  products,
  customers,
  sales,
  stockMovements,
  purchases,
  expenses,
  auditLogs,
  notifications,
  businessSettings,
  posSettings,
}

export const seed = {
  stores: () => clone(stores),
  users: () => clone(users),
  categories: () => clone(categories),
  suppliers: () => clone(suppliers),
  products: () => clone(products),
  customers: () => clone(customers),
  sales: () => clone(sales),
  stockMovements: () => clone(stockMovements),
  purchases: () => clone(purchases),
  expenses: () => clone(expenses),
  auditLogs: () => clone(auditLogs),
  notifications: () => clone(notifications),
  businessSettings: () => clone(businessSettings),
  posSettings: () => clone(posSettings),
}

export { NOW }
