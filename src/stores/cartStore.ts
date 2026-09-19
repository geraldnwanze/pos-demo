import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DiscountType, PaymentMethod } from '@/types'
import { genId } from '@/lib/id'

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

/** A single held order/ticket. Multiple can be open at once. */
export interface CartEntry {
  id: string
  lines: CartLine[]
  customerId: string | null
  discountType: DiscountType
  discountValue: number
  paymentMethod: PaymentMethod
}

interface CartState {
  carts: CartEntry[]
  activeId: string

  // active-cart mutations
  addItem: (line: Omit<CartLine, 'quantity'>, allowNegative: boolean) => 'added' | 'incremented' | 'out_of_stock'
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number, allowNegative: boolean) => void
  increment: (productId: string, allowNegative: boolean) => void
  decrement: (productId: string) => void
  clearActive: () => void
  setCustomer: (id: string | null) => void
  setDiscount: (type: DiscountType, value: number) => void
  setPaymentMethod: (method: PaymentMethod) => void

  // multi-cart management
  newCart: () => void
  switchCart: (id: string) => void
  closeCart: (id: string) => void
  finishActive: () => void
}

function emptyCart(): CartEntry {
  return {
    id: genId('cart'),
    lines: [],
    customerId: null,
    discountType: 'percentage',
    discountValue: 0,
    paymentMethod: 'cash',
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => {
      const updateActive = (fn: (c: CartEntry) => CartEntry) =>
        set((s) => ({
          carts: s.carts.map((c) => (c.id === s.activeId ? fn(c) : c)),
        }))

      const first = emptyCart()

      return {
        carts: [first],
        activeId: first.id,

        addItem: (line, allowNegative) => {
          const active = get().carts.find((c) => c.id === get().activeId) ?? get().carts[0]
          const existing = active.lines.find((l) => l.productId === line.productId)
          if (existing) {
            if (!allowNegative && existing.quantity >= line.stock) return 'out_of_stock'
            updateActive((c) => ({
              ...c,
              lines: c.lines.map((l) =>
                l.productId === line.productId ? { ...l, quantity: l.quantity + 1 } : l,
              ),
            }))
            return 'incremented'
          }
          if (!allowNegative && line.stock <= 0) return 'out_of_stock'
          updateActive((c) => ({ ...c, lines: [...c.lines, { ...line, quantity: 1 }] }))
          return 'added'
        },

        removeItem: (productId) =>
          updateActive((c) => ({ ...c, lines: c.lines.filter((l) => l.productId !== productId) })),

        setQuantity: (productId, quantity, allowNegative) =>
          updateActive((c) => ({
            ...c,
            lines: c.lines
              .map((l) => {
                if (l.productId !== productId) return l
                let q = Math.max(0, Math.floor(quantity))
                if (!allowNegative) q = Math.min(q, l.stock)
                return { ...l, quantity: q }
              })
              .filter((l) => l.quantity > 0),
          })),

        increment: (productId, allowNegative) =>
          updateActive((c) => ({
            ...c,
            lines: c.lines.map((l) => {
              if (l.productId !== productId) return l
              if (!allowNegative && l.quantity >= l.stock) return l
              return { ...l, quantity: l.quantity + 1 }
            }),
          })),

        decrement: (productId) =>
          updateActive((c) => ({
            ...c,
            lines: c.lines
              .map((l) => (l.productId === productId ? { ...l, quantity: l.quantity - 1 } : l))
              .filter((l) => l.quantity > 0),
          })),

        clearActive: () =>
          updateActive(() => ({ ...emptyCart(), id: get().activeId })),

        setCustomer: (id) => updateActive((c) => ({ ...c, customerId: id })),
        setDiscount: (type, value) =>
          updateActive((c) => ({ ...c, discountType: type, discountValue: Math.max(0, value) })),
        setPaymentMethod: (method) => updateActive((c) => ({ ...c, paymentMethod: method })),

        newCart: () => {
          const cart = emptyCart()
          set((s) => ({ carts: [...s.carts, cart], activeId: cart.id }))
        },

        switchCart: (id) => set({ activeId: id }),

        closeCart: (id) =>
          set((s) => {
            const remaining = s.carts.filter((c) => c.id !== id)
            const carts = remaining.length ? remaining : [emptyCart()]
            const activeId = s.activeId === id ? carts[carts.length - 1].id : s.activeId
            return { carts, activeId }
          }),

        finishActive: () =>
          set((s) => {
            // If this is the only cart, reset it in place; otherwise remove it.
            if (s.carts.length === 1) {
              const fresh = emptyCart()
              return { carts: [fresh], activeId: fresh.id }
            }
            const remaining = s.carts.filter((c) => c.id !== s.activeId)
            return { carts: remaining, activeId: remaining[remaining.length - 1].id }
          }),
      }
    },
    {
      name: 'retailpro-cart',
      version: 2,
      migrate: () => {
        const fresh = emptyCart()
        return { carts: [fresh], activeId: fresh.id } as Partial<CartState>
      },
      onRehydrateStorage: () => (state) => {
        // Ensure there is always at least one cart and a valid active id.
        if (!state) return
        if (!state.carts || state.carts.length === 0) {
          const fresh = emptyCart()
          state.carts = [fresh]
          state.activeId = fresh.id
        } else if (!state.carts.some((c) => c.id === state.activeId)) {
          state.activeId = state.carts[0].id
        }
      },
    },
  ),
)

/** The currently active cart entry (reactive). */
export function useActiveCart(): CartEntry {
  return useCartStore((s) => s.carts.find((c) => c.id === s.activeId) ?? s.carts[0])
}

export function cartItemCount(cart: CartEntry): number {
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0)
}
