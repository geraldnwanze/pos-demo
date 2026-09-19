import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppNotification,
  AuditLog,
  BusinessSettings,
  Category,
  Customer,
  Expense,
  PosSettings,
  Product,
  Purchase,
  Sale,
  StockMovement,
  StockMovementType,
  Store,
  Supplier,
  User,
} from '@/types'
import { seed } from '@/mock'
import { genId, nextRef } from '@/lib/id'
import { money } from '@/lib/sales'

const DATA_VERSION = 3

export interface CreateSaleInput {
  sellerId: string
  storeId: string
  customerId: string | null
  customerName: string
  items: Sale['items']
  subtotal: number
  discountType: Sale['discountType']
  discountValue: number
  discountAmount: number
  tax: number
  total: number
  paymentMethod: Sale['paymentMethod']
  amountPaid: number
  change: number
}

export interface AdjustStockInput {
  productId: string
  type: Extract<StockMovementType, 'STOCK_IN' | 'SALE' | 'ADJUSTMENT'>
  quantity: number // signed
  reason: string
  note?: string
  userId: string
  userName: string
}

export interface RefundInput {
  saleId: string
  items: { productId: string; quantity: number }[]
  reason: string
  userId: string
  userName: string
}

interface DataState {
  stores: Store[]
  users: User[]
  categories: Category[]
  suppliers: Supplier[]
  products: Product[]
  customers: Customer[]
  sales: Sale[]
  stockMovements: StockMovement[]
  purchases: Purchase[]
  expenses: Expense[]
  auditLogs: AuditLog[]
  notifications: AppNotification[]
  businessSettings: BusinessSettings
  posSettings: PosSettings

  // internal
  logAudit: (log: Omit<AuditLog, 'id' | 'ipAddress' | 'createdAt'>) => void
  pushNotification: (n: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void

  // products
  addProduct: (p: Omit<Product, 'id' | 'reserved' | 'unitsSold' | 'createdAt'>, actor: Actor) => Product
  updateProduct: (id: string, patch: Partial<Product>, actor: Actor) => void
  deleteProduct: (id: string, actor: Actor) => void

  // categories
  addCategory: (c: Omit<Category, 'id' | 'createdAt'>, actor: Actor) => void
  updateCategory: (id: string, patch: Partial<Category>, actor: Actor) => void
  deleteCategory: (id: string, actor: Actor) => void

  // customers
  addCustomer: (
    c: Omit<Customer, 'id' | 'totalSpent' | 'transactionCount' | 'lastPurchase' | 'createdAt'>,
    actor: Actor,
  ) => Customer
  updateCustomer: (id: string, patch: Partial<Customer>, actor: Actor) => void
  deleteCustomer: (id: string, actor: Actor) => void

  // suppliers
  addSupplier: (s: Omit<Supplier, 'id' | 'createdAt'>, actor: Actor) => void
  updateSupplier: (id: string, patch: Partial<Supplier>, actor: Actor) => void
  deleteSupplier: (id: string, actor: Actor) => void

  // stores
  addStore: (s: Omit<Store, 'id' | 'createdAt'>, actor: Actor) => void
  updateStore: (id: string, patch: Partial<Store>, actor: Actor) => void
  deleteStore: (id: string, actor: Actor) => void

  // users
  addUser: (u: Omit<User, 'id' | 'createdAt' | 'lastLogin' | 'avatarColor'>, actor: Actor) => void
  updateUser: (id: string, patch: Partial<User>, actor: Actor) => void
  deleteUser: (id: string, actor: Actor) => void

  // inventory
  adjustStock: (input: AdjustStockInput) => void

  // sales
  createSale: (input: CreateSaleInput) => Sale
  refundSale: (input: RefundInput) => void

  // purchases
  addPurchase: (p: Omit<Purchase, 'id' | 'reference' | 'createdAt'>, actor: Actor) => Purchase
  updatePurchase: (id: string, patch: Partial<Purchase>, actor: Actor) => void
  receivePurchase: (id: string, actor: Actor) => void
  cancelPurchase: (id: string, actor: Actor) => void

  // expenses
  addExpense: (e: Omit<Expense, 'id' | 'reference' | 'createdAt'>, actor: Actor) => void
  updateExpense: (id: string, patch: Partial<Expense>, actor: Actor) => void
  deleteExpense: (id: string, actor: Actor) => void

  // notifications
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // settings
  updateBusinessSettings: (patch: Partial<BusinessSettings>, actor: Actor) => void
  updatePosSettings: (patch: Partial<PosSettings>, actor: Actor) => void

  // demo
  resetDemo: () => void
  recordLogin: (userId: string) => void
}

export interface Actor {
  id: string
  name: string
}

function freshState() {
  return {
    stores: seed.stores(),
    users: seed.users(),
    categories: seed.categories(),
    suppliers: seed.suppliers(),
    products: seed.products(),
    customers: seed.customers(),
    sales: seed.sales(),
    stockMovements: seed.stockMovements(),
    purchases: seed.purchases(),
    expenses: seed.expenses(),
    auditLogs: seed.auditLogs(),
    notifications: seed.notifications(),
    businessSettings: seed.businessSettings(),
    posSettings: seed.posSettings(),
  }
}

const IPS = ['102.89.34.10', '197.210.55.212', '105.112.9.87']

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      ...freshState(),

      logAudit: (log) =>
        set((s) => ({
          auditLogs: [
            {
              ...log,
              id: genId('log'),
              ipAddress: IPS[Math.floor(Math.random() * IPS.length)],
              createdAt: new Date().toISOString(),
            },
            ...s.auditLogs,
          ],
        })),

      pushNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: genId('notif'), read: false, createdAt: new Date().toISOString() },
            ...s.notifications,
          ],
        })),

      addProduct: (p, actor) => {
        const product: Product = {
          ...p,
          id: genId('prod'),
          reserved: 0,
          unitsSold: 0,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ products: [product, ...s.products] }))
        if (product.stock > 0) {
          set((s) => ({
            stockMovements: [
              {
                id: genId('mov'),
                productId: product.id,
                type: 'STOCK_IN',
                quantity: product.stock,
                reference: 'Opening stock',
                userId: actor.id,
                note: 'Initial stock on product creation',
                createdAt: new Date().toISOString(),
              },
              ...s.stockMovements,
            ],
          }))
        }
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'PRODUCT_CREATED',
          entity: 'Product',
          description: `created product ${product.name}`,
        })
        return product
      },

      updateProduct: (id, patch, actor) => {
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }))
        const name = get().products.find((p) => p.id === id)?.name ?? id
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'PRODUCT_UPDATED',
          entity: 'Product',
          description: `updated product ${name}`,
        })
      },

      deleteProduct: (id, actor) => {
        const name = get().products.find((p) => p.id === id)?.name ?? id
        set((s) => ({ products: s.products.filter((p) => p.id !== id) }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'PRODUCT_DELETED',
          entity: 'Product',
          description: `deleted product ${name}`,
        })
      },

      addCategory: (c, actor) => {
        set((s) => ({
          categories: [
            { ...c, id: genId('cat'), createdAt: new Date().toISOString() },
            ...s.categories,
          ],
        }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'CATEGORY_CREATED',
          entity: 'Category',
          description: `created category ${c.name}`,
        })
      },

      updateCategory: (id, patch, actor) => {
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'CATEGORY_UPDATED',
          entity: 'Category',
          description: `updated category ${patch.name ?? id}`,
        })
      },

      deleteCategory: (id, actor) => {
        const name = get().categories.find((c) => c.id === id)?.name ?? id
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'CATEGORY_DELETED',
          entity: 'Category',
          description: `deleted category ${name}`,
        })
      },

      addCustomer: (c, actor) => {
        const customer: Customer = {
          ...c,
          id: genId('cust'),
          totalSpent: 0,
          transactionCount: 0,
          lastPurchase: null,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ customers: [customer, ...s.customers] }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'CUSTOMER_CREATED',
          entity: 'Customer',
          description: `added customer ${customer.name}`,
        })
        return customer
      },

      updateCustomer: (id, patch, actor) => {
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'CUSTOMER_UPDATED',
          entity: 'Customer',
          description: `updated customer ${patch.name ?? id}`,
        })
      },

      deleteCustomer: (id, actor) => {
        const name = get().customers.find((c) => c.id === id)?.name ?? id
        set((s) => ({ customers: s.customers.filter((c) => c.id !== id) }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'CUSTOMER_DELETED',
          entity: 'Customer',
          description: `deleted customer ${name}`,
        })
      },

      addSupplier: (sup, actor) => {
        set((s) => ({
          suppliers: [
            { ...sup, id: genId('sup'), createdAt: new Date().toISOString() },
            ...s.suppliers,
          ],
        }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'SUPPLIER_CREATED',
          entity: 'Supplier',
          description: `added supplier ${sup.name}`,
        })
      },

      updateSupplier: (id, patch, actor) => {
        set((s) => ({
          suppliers: s.suppliers.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'SUPPLIER_UPDATED',
          entity: 'Supplier',
          description: `updated supplier ${patch.name ?? id}`,
        })
      },

      deleteSupplier: (id, actor) => {
        const name = get().suppliers.find((x) => x.id === id)?.name ?? id
        set((s) => ({ suppliers: s.suppliers.filter((x) => x.id !== id) }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'SUPPLIER_DELETED',
          entity: 'Supplier',
          description: `deleted supplier ${name}`,
        })
      },

      addStore: (st, actor) => {
        set((s) => ({
          stores: [{ ...st, id: genId('store'), createdAt: new Date().toISOString() }, ...s.stores],
        }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'STORE_CREATED',
          entity: 'Store',
          description: `created store ${st.name}`,
        })
      },

      updateStore: (id, patch, actor) => {
        set((s) => ({ stores: s.stores.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'STORE_UPDATED',
          entity: 'Store',
          description: `updated store ${patch.name ?? id}`,
        })
      },

      deleteStore: (id, actor) => {
        const name = get().stores.find((x) => x.id === id)?.name ?? id
        set((s) => ({ stores: s.stores.filter((x) => x.id !== id) }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'STORE_DELETED',
          entity: 'Store',
          description: `deleted store ${name}`,
        })
      },

      addUser: (u, actor) => {
        const colors = ['#2563eb', '#7c3aed', '#059669', '#db2777', '#ea580c', '#0891b2']
        set((s) => ({
          users: [
            {
              ...u,
              id: genId('user'),
              avatarColor: colors[s.users.length % colors.length],
              lastLogin: null,
              createdAt: new Date().toISOString(),
            },
            ...s.users,
          ],
        }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'USER_CREATED',
          entity: 'User',
          description: `created ${u.role.replace('_', ' ')} account for ${u.name}`,
        })
      },

      updateUser: (id, patch, actor) => {
        const prev = get().users.find((u) => u.id === id)
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }))
        if (patch.role && prev && patch.role !== prev.role) {
          get().logAudit({
            userId: actor.id,
            userName: actor.name,
            action: 'ROLE_CHANGED',
            entity: 'User',
            description: `changed role of ${prev.name} to ${patch.role.replace('_', ' ')}`,
          })
        } else {
          get().logAudit({
            userId: actor.id,
            userName: actor.name,
            action: 'USER_UPDATED',
            entity: 'User',
            description: `updated user ${prev?.name ?? id}`,
          })
        }
      },

      deleteUser: (id, actor) => {
        const name = get().users.find((u) => u.id === id)?.name ?? id
        set((s) => ({ users: s.users.filter((u) => u.id !== id) }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'USER_DELETED',
          entity: 'User',
          description: `deleted user ${name}`,
        })
      },

      adjustStock: (input) => {
        const product = get().products.find((p) => p.id === input.productId)
        if (!product) return
        set((s) => ({
          products: s.products.map((p) =>
            p.id === input.productId ? { ...p, stock: Math.max(0, p.stock + input.quantity) } : p,
          ),
          stockMovements: [
            {
              id: genId('mov'),
              productId: input.productId,
              type: input.type,
              quantity: input.quantity,
              reference: input.reason,
              userId: input.userId,
              note: input.note,
              createdAt: new Date().toISOString(),
            },
            ...s.stockMovements,
          ],
        }))
        get().logAudit({
          userId: input.userId,
          userName: input.userName,
          action: 'INVENTORY_ADJUSTED',
          entity: 'Inventory',
          description: `adjusted inventory for ${product.sku} (${input.quantity > 0 ? '+' : ''}${input.quantity})`,
        })
        const updated = get().products.find((p) => p.id === input.productId)
        if (updated && updated.stock <= updated.minStock) {
          get().pushNotification({
            type: 'stock',
            title: updated.stock === 0 ? 'Out of stock' : 'Low stock alert',
            message: `${updated.name} is ${updated.stock === 0 ? 'out of stock' : `low on stock (${updated.stock} / ${updated.minStock})`}.`,
          })
        }
      },

      createSale: (input) => {
        const seller = get().users.find((u) => u.id === input.sellerId)
        const sale: Sale = {
          ...input,
          id: genId('sale'),
          reference: nextRef('TXN', 6),
          status: 'completed',
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ sales: [sale, ...s.sales] }))

        // Deduct stock + record movements + track units sold
        const newMovements: StockMovement[] = sale.items.map((item) => ({
          id: genId('mov'),
          productId: item.productId,
          type: 'SALE',
          quantity: -item.quantity,
          reference: sale.reference,
          userId: sale.sellerId,
          createdAt: sale.createdAt,
        }))
        set((s) => ({
          products: s.products.map((p) => {
            const item = sale.items.find((i) => i.productId === p.id)
            if (!item) return p
            return {
              ...p,
              stock: Math.max(0, p.stock - item.quantity),
              unitsSold: p.unitsSold + item.quantity,
            }
          }),
          stockMovements: [...newMovements, ...s.stockMovements],
        }))

        // Update customer aggregates
        if (sale.customerId) {
          set((s) => ({
            customers: s.customers.map((c) =>
              c.id === sale.customerId
                ? {
                    ...c,
                    totalSpent: money(c.totalSpent + sale.total),
                    transactionCount: c.transactionCount + 1,
                    lastPurchase: sale.createdAt,
                  }
                : c,
            ),
          }))
        }

        get().logAudit({
          userId: sale.sellerId,
          userName: seller?.name ?? 'Seller',
          action: 'SALE_COMPLETED',
          entity: 'Sale',
          description: `completed transaction ${sale.reference}`,
        })
        get().pushNotification({
          type: 'sale',
          title: 'New sale completed',
          message: `${seller?.name ?? 'A seller'} completed a sale of ₦${sale.total.toLocaleString()}.`,
        })

        // Low-stock notifications for affected products
        for (const item of sale.items) {
          const p = get().products.find((x) => x.id === item.productId)
          if (p && p.stock <= p.minStock) {
            get().pushNotification({
              type: 'stock',
              title: p.stock === 0 ? 'Out of stock' : 'Low stock alert',
              message: `${p.name} is ${p.stock === 0 ? 'out of stock' : `below minimum (${p.stock} / ${p.minStock})`}.`,
            })
          }
        }

        return sale
      },

      refundSale: (input) => {
        const sale = get().sales.find((s) => s.id === input.saleId)
        if (!sale) return

        // Restore stock + movements
        const newMovements: StockMovement[] = input.items
          .filter((i) => i.quantity > 0)
          .map((i) => ({
            id: genId('mov'),
            productId: i.productId,
            type: 'RETURN',
            quantity: i.quantity,
            reference: `Refund ${sale.reference}`,
            userId: input.userId,
            note: input.reason,
            createdAt: new Date().toISOString(),
          }))

        set((s) => ({
          products: s.products.map((p) => {
            const ref = input.items.find((i) => i.productId === p.id)
            if (!ref) return p
            return {
              ...p,
              stock: p.stock + ref.quantity,
              unitsSold: Math.max(0, p.unitsSold - ref.quantity),
            }
          }),
          stockMovements: [...newMovements, ...s.stockMovements],
        }))

        // Determine full vs partial refund
        const updatedItems = sale.items.map((item) => {
          const ref = input.items.find((i) => i.productId === item.productId)
          const refundedQty = (item.refundedQty ?? 0) + (ref?.quantity ?? 0)
          return { ...item, refundedQty }
        })
        const fullyRefunded = updatedItems.every((i) => (i.refundedQty ?? 0) >= i.quantity)

        set((s) => ({
          sales: s.sales.map((x) =>
            x.id === sale.id
              ? {
                  ...x,
                  items: updatedItems,
                  status: fullyRefunded ? 'refunded' : 'partially_refunded',
                  refundReason: input.reason,
                }
              : x,
          ),
        }))

        get().logAudit({
          userId: input.userId,
          userName: input.userName,
          action: 'REFUND_ISSUED',
          entity: 'Sale',
          description: `${fullyRefunded ? 'refunded' : 'partially refunded'} transaction ${sale.reference}`,
        })
        get().pushNotification({
          type: 'sale',
          title: 'Refund processed',
          message: `Refund issued for ${sale.reference}.`,
        })
      },

      addPurchase: (p, actor) => {
        const purchase: Purchase = {
          ...p,
          id: genId('pur'),
          reference: nextRef('PO', 5),
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ purchases: [purchase, ...s.purchases] }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'PURCHASE_CREATED',
          entity: 'Purchase',
          description: `created purchase ${purchase.reference}`,
        })
        return purchase
      },

      updatePurchase: (id, patch, actor) => {
        set((s) => ({ purchases: s.purchases.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'PURCHASE_UPDATED',
          entity: 'Purchase',
          description: `updated purchase ${get().purchases.find((x) => x.id === id)?.reference ?? id}`,
        })
      },

      receivePurchase: (id, actor) => {
        const purchase = get().purchases.find((p) => p.id === id)
        if (!purchase || purchase.status === 'received') return
        const now = new Date().toISOString()

        const newMovements: StockMovement[] = purchase.items.map((item) => ({
          id: genId('mov'),
          productId: item.productId,
          type: 'PURCHASE',
          quantity: item.quantity,
          reference: purchase.reference,
          userId: actor.id,
          createdAt: now,
        }))

        set((s) => ({
          purchases: s.purchases.map((p) =>
            p.id === id ? { ...p, status: 'received', receivedDate: now } : p,
          ),
          products: s.products.map((p) => {
            const item = purchase.items.find((i) => i.productId === p.id)
            return item ? { ...p, stock: p.stock + item.quantity } : p
          }),
          stockMovements: [...newMovements, ...s.stockMovements],
        }))

        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'PURCHASE_RECEIVED',
          entity: 'Purchase',
          description: `marked purchase ${purchase.reference} as received`,
        })
        get().pushNotification({
          type: 'purchase',
          title: 'Purchase received',
          message: `Purchase order ${purchase.reference} has been received into inventory.`,
        })
      },

      cancelPurchase: (id, actor) => {
        const ref = get().purchases.find((p) => p.id === id)?.reference ?? id
        set((s) => ({
          purchases: s.purchases.map((p) => (p.id === id ? { ...p, status: 'cancelled' } : p)),
        }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'PURCHASE_CANCELLED',
          entity: 'Purchase',
          description: `cancelled purchase ${ref}`,
        })
      },

      addExpense: (e, actor) => {
        set((s) => ({
          expenses: [
            { ...e, id: genId('exp'), reference: nextRef('EXP', 4), createdAt: new Date().toISOString() },
            ...s.expenses,
          ],
        }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'EXPENSE_ADDED',
          entity: 'Expense',
          description: `added expense ${e.title} (₦${e.amount.toLocaleString()})`,
        })
      },

      updateExpense: (id, patch, actor) => {
        set((s) => ({ expenses: s.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)) }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'EXPENSE_UPDATED',
          entity: 'Expense',
          description: `updated expense ${patch.title ?? id}`,
        })
      },

      deleteExpense: (id, actor) => {
        const title = get().expenses.find((x) => x.id === id)?.title ?? id
        set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'EXPENSE_DELETED',
          entity: 'Expense',
          description: `deleted expense ${title}`,
        })
      },

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      updateBusinessSettings: (patch, actor) => {
        set((s) => ({ businessSettings: { ...s.businessSettings, ...patch } }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'SETTINGS_UPDATED',
          entity: 'Settings',
          description: 'updated business settings',
        })
      },

      updatePosSettings: (patch, actor) => {
        set((s) => ({ posSettings: { ...s.posSettings, ...patch } }))
        get().logAudit({
          userId: actor.id,
          userName: actor.name,
          action: 'SETTINGS_UPDATED',
          entity: 'Settings',
          description: 'updated POS settings',
        })
      },

      recordLogin: (userId) =>
        set((s) => ({
          users: s.users.map((u) =>
            u.id === userId ? { ...u, lastLogin: new Date().toISOString() } : u,
          ),
        })),

      resetDemo: () => set({ ...freshState() }),
    }),
    {
      name: 'retailpro-data',
      version: DATA_VERSION,
      migrate: () => ({ ...freshState() }) as DataState,
    },
  ),
)
