import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, History, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProductImage } from '@/components/shared/ProductImage'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { AdjustStockDialog } from '@/components/inventory/AdjustStockDialog'
import { useDataStore } from '@/stores/dataStore'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Product, StockMovement, StockMovementType } from '@/types'

const LABELS: Record<StockMovementType, string> = {
  STOCK_IN: 'Stock In',
  SALE: 'Stock Out / Sale',
  ADJUSTMENT: 'Adjustment',
  RETURN: 'Return',
  PURCHASE: 'Purchase',
}

export default function InventoryAdjustments() {
  const loading = useSimulatedLoading()
  const navigate = useNavigate()
  const products = useDataStore((s) => s.products)
  const movements = useDataStore((s) => s.stockMovements)
  const users = useDataStore((s) => s.users)

  const [typeFilter, setTypeFilter] = useState('all')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selected, setSelected] = useState<Product | undefined>()
  const [adjustOpen, setAdjustOpen] = useState(false)

  const filtered = useMemo(
    () =>
      movements
        .filter((m) => (typeFilter === 'all' ? true : m.type === typeFilter))
        .slice(0, 100),
    [movements, typeFilter],
  )

  const columns = useMemo<ColumnDef<StockMovement>[]>(
    () => [
      {
        id: 'product',
        header: 'Product',
        cell: ({ row }) => {
          const p = products.find((x) => x.id === row.original.productId)
          return p ? (
            <div className="flex items-center gap-2">
              <ProductImage name={p.name} image={p.image} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.sku}</p>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">Unknown</span>
          )
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <Badge variant="outline">{LABELS[row.original.type]}</Badge>,
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => (
          <span
            className={cn(
              'font-medium',
              row.original.quantity >= 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {row.original.quantity >= 0 ? '+' : ''}
            {row.original.quantity}
          </span>
        ),
      },
      {
        accessorKey: 'reference',
        header: 'Reference',
        cell: ({ row }) => <span className="text-sm">{row.original.reference}</span>,
      },
      {
        id: 'user',
        header: 'User',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {users.find((u) => u.id === row.original.userId)?.name ?? 'System'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [products, users],
  )

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')} className="-ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to inventory
      </Button>
      <PageHeader
        title="Stock adjustments"
        description="A full history of inventory movements."
        actions={
          <Button onClick={() => setPickerOpen(true)}>
            <Plus className="h-4 w-4" /> New Adjustment
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchKey="reference"
          searchPlaceholder="Search by reference…"
          toolbar={
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Movement type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All movements</SelectItem>
                <SelectItem value="STOCK_IN">Stock In</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                <SelectItem value="SALE">Sales</SelectItem>
                <SelectItem value="PURCHASE">Purchases</SelectItem>
                <SelectItem value="RETURN">Returns</SelectItem>
              </SelectContent>
            </Select>
          }
          emptyState={
            <EmptyState
              icon={History}
              title="No movements found"
              description="Try a different movement type."
            />
          }
        />
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a product</DialogTitle>
            <DialogDescription>Choose the product you want to adjust.</DialogDescription>
          </DialogHeader>
          <Select
            onValueChange={(id) => {
              setSelected(products.find((p) => p.id === id))
              setPickerOpen(false)
              setAdjustOpen(true)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Search and select product…" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} · {p.sku}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>

      <AdjustStockDialog open={adjustOpen} onOpenChange={setAdjustOpen} product={selected} />
    </div>
  )
}
