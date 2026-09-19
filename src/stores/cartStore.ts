import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DiscountType, PaymentMethod } from '@/types'

export interface CartLine {
  productId: string
  name: string
  sku: string
  unitPrice: number
  taxRate: number
  quantity: number
  stock: number
  image: string
}

interface CartState {
  lines: CartLine[]
  customerId: string | null
  discountType: DiscountType
  discountValue: number
  paymentMethod: PaymentMethod

  addItem: (line: Omit<CartLine, 'quantity'>, allowNegative: boolean) => 'added' | 'incremented' | 'out_of_stock'
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number, allowNegative: boolean) => void
  increment: (productId: string, allowNegative: boolean) => void
  decrement: (productId: string) => void
  clear: () => void
  setCustomer: (id: string | null) => void
  setDiscount: (type: DiscountType, value: number) => void
  setPaymentMethod: (method: PaymentMethod) => void
  totalItems: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      customerId: null,
      discountType: 'percentage',
      discountValue: 0,
      paymentMethod: 'cash',

      addItem: (line, allowNegative) => {
        const existing = get().lines.find((l) => l.productId === line.productId)
        if (existing) {
          if (!allowNegative && existing.quantity >= line.stock) return 'out_of_stock'
          set((s) => ({
            lines: s.lines.map((l) =>
              l.productId === line.productId ? { ...l, quantity: l.quantity + 1 } : l,
            ),
          }))
          return 'incremented'
        }
        if (!allowNegative && line.stock <= 0) return 'out_of_stock'
        set((s) => ({ lines: [...s.lines, { ...line, quantity: 1 }] }))
        return 'added'
      },

      removeItem: (productId) =>
        set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),

      setQuantity: (productId, quantity, allowNegative) =>
        set((s) => ({
          lines: s.lines
            .map((l) => {
              if (l.productId !== productId) return l
              let q = Math.max(0, Math.floor(quantity))
              if (!allowNegative) q = Math.min(q, l.stock)
              return { ...l, quantity: q }
            })
            .filter((l) => l.quantity > 0),
        })),

      increment: (productId, allowNegative) =>
        set((s) => ({
          lines: s.lines.map((l) => {
            if (l.productId !== productId) return l
            if (!allowNegative && l.quantity >= l.stock) return l
            return { ...l, quantity: l.quantity + 1 }
          }),
        })),

      decrement: (productId) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.productId === productId ? { ...l, quantity: l.quantity - 1 } : l))
            .filter((l) => l.quantity > 0),
        })),

      clear: () => set({ lines: [], customerId: null, discountType: 'percentage', discountValue: 0, paymentMethod: 'cash' }),

      setCustomer: (id) => set({ customerId: id }),
      setDiscount: (type, value) => set({ discountType: type, discountValue: Math.max(0, value) }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      totalItems: () => get().lines.reduce((s, l) => s + l.quantity, 0),
    }),
    { name: 'retailpro-cart' },
  ),
)
