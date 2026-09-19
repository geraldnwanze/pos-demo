/** Domain types for the POS & Inventory system. */

export type Role = 'super_admin' | 'admin' | 'seller'

export type Status = 'active' | 'inactive'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  storeId: string | null
  status: Status
  avatarColor: string
  createdAt: string
  lastLogin: string | null
}

export interface Store {
  id: string
  name: string
  code: string
  address: string
  phone: string
  managerId: string | null
  status: Status
  createdAt: string
}

export interface Category {
  id: string
  name: string
  description: string
  status: Status
  createdAt: string
}

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  status: Status
  createdAt: string
}

export interface Product {
  id: string
  name: string
  sku: string
  barcode: string
  categoryId: string
  description: string
  costPrice: number
  sellingPrice: number
  taxRate: number
  minStock: number
  stock: number
  reserved: number
  supplierId: string | null
  image: string
  status: Status
  unitsSold: number
  createdAt: string
}

export type StockMovementType = 'STOCK_IN' | 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'PURCHASE'

export interface StockMovement {
  id: string
  productId: string
  type: StockMovementType
  quantity: number // signed: positive in, negative out
  reference: string
  userId: string
  note?: string
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  address: string
  status: Status
  totalSpent: number
  transactionCount: number
  lastPurchase: string | null
  createdAt: string
}

export type PaymentMethod = 'cash' | 'card' | 'transfer'

export type SaleStatus = 'completed' | 'refunded' | 'partially_refunded' | 'cancelled'

export interface SaleItem {
  productId: string
  name: string
  sku: string
  quantity: number
  unitPrice: number
  taxRate: number
  lineTotal: number
  refundedQty?: number
}

export type DiscountType = 'percentage' | 'fixed'

export interface Sale {
  id: string
  reference: string
  storeId: string
  sellerId: string
  customerId: string | null
  customerName: string
  items: SaleItem[]
  subtotal: number
  discountType: DiscountType
  discountValue: number
  discountAmount: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  amountPaid: number
  change: number
  status: SaleStatus
  refundReason?: string
  createdAt: string
}

export type PurchaseStatus = 'draft' | 'ordered' | 'received' | 'cancelled'

export interface PurchaseItem {
  productId: string
  name: string
  sku: string
  quantity: number
  costPrice: number
  lineTotal: number
}

export interface Purchase {
  id: string
  reference: string
  supplierId: string
  storeId: string
  items: PurchaseItem[]
  total: number
  status: PurchaseStatus
  expectedDate: string
  receivedDate: string | null
  createdBy: string
  createdAt: string
}

export type ExpenseCategory =
  | 'Rent'
  | 'Utilities'
  | 'Salaries'
  | 'Transport'
  | 'Marketing'
  | 'Maintenance'
  | 'Other'

export interface Expense {
  id: string
  reference: string
  title: string
  category: ExpenseCategory
  amount: number
  paymentMethod: PaymentMethod
  storeId: string
  date: string
  addedBy: string
  notes: string
  createdAt: string
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  entity: string
  description: string
  ipAddress: string
  createdAt: string
}

export interface AppNotification {
  id: string
  type: 'stock' | 'sale' | 'inventory' | 'purchase' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: string
}

export interface BusinessSettings {
  name: string
  phone: string
  email: string
  address: string
  taxNumber: string
  currency: string
  logo: string
}

export interface PosSettings {
  defaultTaxRate: number
  receiptFooter: string
  enableDiscounts: boolean
  requireCustomer: boolean
  allowNegativeInventory: boolean
}
