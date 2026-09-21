import { useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  UserPlus,
  Banknote,
  CreditCard,
  Landmark,
  PackageX,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductImage } from '@/components/shared/ProductImage'
import { EmptyState } from '@/components/shared/States'
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog'
import { ReceiptDialog } from '@/components/pos/ReceiptDialog'
import { useDataStore } from '@/stores/dataStore'
import { useCartStore, useActiveCart, cartItemCount } from '@/stores/cartStore'
import { useAuth } from '@/hooks/useAuth'
import { computeSaleTotals, money } from '@/lib/sales'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { DiscountType, PaymentMethod, Sale, SaleItem } from '@/types'

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'POS / Card', icon: CreditCard },
  { value: 'transfer', label: 'Transfer', icon: Landmark },
]

export default function Pos() {
  const { user } = useAuth()
  const products = useDataStore((s) => s.products)
  const categories = useDataStore((s) => s.categories)
  const customers = useDataStore((s) => s.customers)
  const posSettings = useDataStore((s) => s.posSettings)
  const createSale = useDataStore((s) => s.createSale)

  const cart = useActiveCart()
  const carts = useCartStore((s) => s.carts)
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const increment = useCartStore((s) => s.increment)
  const decrement = useCartStore((s) => s.decrement)
  const setCustomer = useCartStore((s) => s.setCustomer)
  const setDiscount = useCartStore((s) => s.setDiscount)
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod)
  const clearActive = useCartStore((s) => s.clearActive)
  const newCart = useCartStore((s) => s.newCart)
  const switchCart = useCartStore((s) => s.switchCart)
  const closeCart = useCartStore((s) => s.closeCart)
  const finishActive = useCartStore((s) => s.finishActive)

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [addCustomerOpen, setAddCustomerOpen] = useState(false)
  const [amountPaid, setAmountPaid] = useState('')
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products
      .filter((p) => p.status === 'active')
      .filter((p) => (activeCategory === 'all' ? true : p.categoryId === activeCategory))
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q),
      )
  }, [products, search, activeCategory])

  // Cart lines re-hydrated with live stock
  const lines = cart.lines
  const saleItems: SaleItem[] = lines.map((l) => ({
    productId: l.productId,
    name: l.name,
    sku: l.sku,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRate: l.taxRate,
    lineTotal: money(l.unitPrice * l.quantity),
  }))

  const totals = computeSaleTotals(saleItems, cart.discountType, cart.discountValue)
  const discountExceeds =
    cart.discountType === 'fixed' && cart.discountValue > totals.subtotal
  const selectedCustomer = customers.find((c) => c.id === cart.customerId) ?? null

  const handleAddProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    const result = addItem(
      {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitPrice: product.sellingPrice,
        taxRate: product.taxRate,
        stock: product.stock,
        image: product.image,
      },
      posSettings.allowNegativeInventory,
    )
    if (result === 'out_of_stock') {
      toast.error(`${product.name} is out of stock.`)
    }
  }

  const handleCompleteSale = () => {
    if (lines.length === 0) {
      toast.error('Cart is empty. Add products to continue.')
      return
    }
    if (posSettings.requireCustomer && !cart.customerId) {
      toast.error('Please select a customer to complete this sale.')
      return
    }
    if (discountExceeds) {
      toast.error('Discount cannot exceed the subtotal.')
      return
    }

    const paid =
      cart.paymentMethod === 'cash' && amountPaid
        ? Math.max(Number(amountPaid), totals.total)
        : totals.total
    if (cart.paymentMethod === 'cash' && amountPaid && Number(amountPaid) < totals.total) {
      toast.error('Amount paid is less than the total due.')
      return
    }

    const sale = createSale({
      sellerId: user!.id,
      storeId: user!.storeId ?? 'store-1',
      customerId: cart.customerId,
      customerName: selectedCustomer?.name ?? 'Walk-in Customer',
      items: saleItems,
      subtotal: totals.subtotal,
      discountType: cart.discountType,
      discountValue: cart.discountValue,
      discountAmount: totals.discountAmount,
      tax: totals.tax,
      total: totals.total,
      paymentMethod: cart.paymentMethod,
      amountPaid: paid,
      change: money(paid - totals.total),
    })

    toast.success('Sale completed successfully.')
    setCompletedSale(sale)
    finishActive()
    setAmountPaid('')
  }

  const cartInner = (
    <>
      {/* Order tabs — hold multiple sales at once */}
      <div className="flex items-center gap-1 border-b p-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {carts.map((c, i) => {
            const label = customers.find((cu) => cu.id === c.customerId)?.name ?? `Order ${i + 1}`
            const count = cartItemCount(c)
            const active = c.id === cart.id
            return (
              <div
                key={c.id}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  active ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent',
                )}
              >
                <button className="max-w-[110px] truncate" onClick={() => switchCart(c.id)}>
                  {label}
                  {count > 0 && (
                    <span
                      className={cn(
                        'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]',
                        active ? 'bg-primary text-primary-foreground' : 'bg-muted',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
                {carts.length > 1 && (
                  <button
                    onClick={() => closeCart(c.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Close order"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          className="shrink-0"
          onClick={newCart}
          title="Start a new order"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-semibold">Current Sale</span>
          {cartItemCount(cart) > 0 && <Badge>{cartItemCount(cart)}</Badge>}
        </div>
        {lines.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearActive}>
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {/* Customer selector */}
      <div className="flex items-center gap-2 border-b p-4">
        <Select
          value={cart.customerId ?? 'walk-in'}
          onValueChange={(v) => setCustomer(v === 'walk-in' ? null : v)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="walk-in">Walk-in Customer</SelectItem>
            {customers
              .filter((c) => c.status === 'active')
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => setAddCustomerOpen(true)}>
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Cart lines */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {lines.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <p className="text-sm font-medium">Cart is empty</p>
            <p className="text-xs text-muted-foreground">
              Tap products to add them to the sale.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {lines.map((l) => (
              <div key={l.productId} className="flex items-center gap-3 p-3">
                <ProductImage name={l.name} image={l.image} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(l.unitPrice, { decimals: false })} each
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon-sm" onClick={() => decrement(l.productId)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-7 text-center text-sm font-medium">{l.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => increment(l.productId, posSettings.allowNegativeInventory)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="w-20 text-right">
                  <p className="text-sm font-semibold">
                    {formatCurrency(l.unitPrice * l.quantity, { decimals: false })}
                  </p>
                  <button
                    onClick={() => removeItem(l.productId)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals & checkout */}
      {lines.length > 0 && (
        <div className="space-y-3 border-t p-4">
          {posSettings.enableDiscounts && (
            <div className="flex items-center gap-2">
              <Select
                value={cart.discountType}
                onValueChange={(v) => setDiscount(v as DiscountType, cart.discountValue)}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">% Off</SelectItem>
                  <SelectItem value="fixed">₦ Off</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={0}
                value={cart.discountValue || ''}
                onChange={(e) => setDiscount(cart.discountType, Number(e.target.value))}
                placeholder="Discount"
                className="flex-1"
              />
            </div>
          )}
          {discountExceeds && (
            <p className="text-xs text-destructive">Discount cannot exceed the subtotal.</p>
          )}

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatCurrency(totals.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5 text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>

          {/* Payment methods */}
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPaymentMethod(opt.value)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-md border py-2 text-xs font-medium transition-colors',
                  cart.paymentMethod === opt.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'hover:bg-accent',
                )}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
          </div>

          {cart.paymentMethod === 'cash' && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="Cash received"
                className="flex-1"
              />
              {amountPaid && Number(amountPaid) >= totals.total && (
                <span className="whitespace-nowrap text-sm text-muted-foreground">
                  Change: {formatCurrency(Number(amountPaid) - totals.total)}
                </span>
              )}
            </div>
          )}

          <Button size="lg" className="w-full" onClick={handleCompleteSale}>
            Complete Sale · {formatCurrency(totals.total)}
          </Button>
        </div>
      )}
    </>
  )

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
      {/* Product area */}
      <div className="flex min-w-0 flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, SKU or barcode…"
            className="h-11 pl-10"
          />
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryChip
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
            label="All"
          />
          {categories
            .filter((c) => c.status === 'active')
            .map((c) => (
              <CategoryChip
                key={c.id}
                active={activeCategory === c.id}
                onClick={() => setActiveCategory(c.id)}
                label={c.name}
              />
            ))}
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={PackageX}
            title="No products found"
            description="Try a different search term or category."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredProducts.map((p) => {
              const out = p.stock <= 0 && !posSettings.allowNegativeInventory
              return (
                <button
                  key={p.id}
                  onClick={() => handleAddProduct(p.id)}
                  disabled={out}
                  className={cn(
                    'group flex flex-col rounded-lg border bg-card p-3 text-left transition-all hover:border-primary hover:shadow-md',
                    out && 'cursor-not-allowed opacity-60 hover:border-border hover:shadow-none',
                  )}
                >
                  <div className="mb-2 flex items-center justify-center rounded-md bg-muted/50 py-3">
                    <ProductImage name={p.name} image={p.image} size="lg" />
                  </div>
                  <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-tight">
                    {p.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.sku}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-1">
                    <span className="whitespace-nowrap text-sm font-bold text-primary">
                      {formatCurrency(p.sellingPrice, { decimals: false })}
                    </span>
                    <Badge variant={out ? 'destructive' : p.stock <= p.minStock ? 'warning' : 'secondary'}>
                      {out ? 'Out' : `${p.stock} left`}
                    </Badge>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart panel — first on mobile, right column on desktop */}
      <Card className="order-first flex max-h-[80vh] min-w-0 flex-col lg:sticky lg:top-20 lg:order-none lg:h-[calc(100vh-7rem)] lg:max-h-none">
        {cartInner}
      </Card>

      <CustomerFormDialog
        open={addCustomerOpen}
        onOpenChange={setAddCustomerOpen}
        onSuccess={(c) => setCustomer(c.id)}
      />

      <ReceiptDialog
        sale={completedSale}
        variant="success"
        onOpenChange={(open) => !open && setCompletedSale(null)}
      />
    </div>
  )
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent',
      )}
    >
      {label}
    </button>
  )
}
