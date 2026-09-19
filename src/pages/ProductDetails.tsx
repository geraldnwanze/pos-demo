import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, SlidersHorizontal, TrendingUp, Boxes, Coins, Tag } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ProductImage } from '@/components/shared/ProductImage'
import { StatusBadge, stockStatus } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/States'
import { ProductFormDialog } from '@/components/products/ProductFormDialog'
import { AdjustStockDialog } from '@/components/inventory/AdjustStockDialog'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { StockMovementType } from '@/types'

const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  STOCK_IN: 'Stock In',
  SALE: 'Sale',
  ADJUSTMENT: 'Adjustment',
  RETURN: 'Return',
  PURCHASE: 'Purchase',
}

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('products.manage')
  const canAdjust = hasPermission('inventory.manage')

  const products = useDataStore((s) => s.products)
  const categories = useDataStore((s) => s.categories)
  const suppliers = useDataStore((s) => s.suppliers)
  const movements = useDataStore((s) => s.stockMovements)
  const users = useDataStore((s) => s.users)

  const [editOpen, setEditOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)

  const product = products.find((p) => p.id === id)

  const history = useMemo(
    () => movements.filter((m) => m.productId === id).slice(0, 30),
    [movements, id],
  )

  if (!product) {
    return (
      <EmptyState
        icon={Boxes}
        title="Product not found"
        description="This product may have been deleted."
        action={
          <Button asChild>
            <Link to="/products">Back to products</Link>
          </Button>
        }
      />
    )
  }

  const category = categories.find((c) => c.id === product.categoryId)?.name ?? '—'
  const supplier = suppliers.find((s) => s.id === product.supplierId)?.name ?? '—'
  const revenue = product.unitsSold * product.sellingPrice
  const margin =
    product.sellingPrice > 0
      ? ((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100
      : 0
  const userName = (uid: string) => users.find((u) => u.id === uid)?.name ?? 'System'

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/products')} className="-ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Button>

      <PageHeader
        title={product.name}
        description={`${product.sku} · ${category}`}
        actions={
          <>
            {canAdjust && (
              <Button variant="outline" onClick={() => setAdjustOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" /> Adjust Stock
              </Button>
            )}
            {canManage && (
              <Button onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <ProductImage name={product.name} image={product.image} size="xl" />
            <div>
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p className="text-sm text-muted-foreground">{product.sku}</p>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={product.status} />
              <StatusBadge status={stockStatus(product.stock, product.minStock)} />
            </div>
            <div className="w-full space-y-2 pt-2 text-left text-sm">
              <Row label="Barcode" value={product.barcode || '—'} />
              <Row label="Category" value={category} />
              <Row label="Supplier" value={supplier} />
              <Row label="Cost price" value={formatCurrency(product.costPrice)} />
              <Row label="Selling price" value={formatCurrency(product.sellingPrice)} />
              <Row label="Tax rate" value={`${product.taxRate}%`} />
              <Row label="Min stock" value={String(product.minStock)} />
            </div>
            {product.description && (
              <p className="w-full border-t pt-3 text-left text-sm text-muted-foreground">
                {product.description}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat icon={Boxes} label="Current stock" value={formatNumber(product.stock)} tone="blue" />
            <MiniStat icon={TrendingUp} label="Units sold" value={formatNumber(product.unitsSold)} tone="emerald" />
            <MiniStat
              icon={Coins}
              label="Revenue"
              value={formatCurrency(revenue, { decimals: false })}
              tone="violet"
            />
            <MiniStat icon={Tag} label="Margin" value={`${margin.toFixed(1)}%`} tone="amber" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stock history</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No stock movements recorded yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDateTime(m.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{MOVEMENT_LABELS[m.type]}</Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'font-medium',
                              m.quantity >= 0 ? 'text-success' : 'text-destructive',
                            )}
                          >
                            {m.quantity >= 0 ? '+' : ''}
                            {m.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{m.reference}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {userName(m.userId)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ProductFormDialog open={editOpen} onOpenChange={setEditOpen} product={product} />
      <AdjustStockDialog open={adjustOpen} onOpenChange={setAdjustOpen} product={product} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

const TONES = {
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  violet: 'bg-violet-100 text-violet-700',
  amber: 'bg-amber-100 text-amber-700',
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Boxes
  label: string
  value: string
  tone: keyof typeof TONES
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', TONES[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
