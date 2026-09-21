import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { AlertTriangle, SlidersHorizontal, History, Boxes, Coins } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatCard } from '@/components/shared/StatCard'
import { TableSkeleton, CardsSkeleton } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductImage } from '@/components/shared/ProductImage'
import { StatusBadge, stockStatus } from '@/components/shared/StatusBadge'
import { AdjustStockDialog } from '@/components/inventory/AdjustStockDialog'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { formatRelative, formatNumber, formatCurrency } from '@/lib/format'
import { inventoryValue, lowStockProducts } from '@/lib/analytics'
import type { Product } from '@/types'

export default function Inventory() {
  const loading = useSimulatedLoading()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('inventory.manage')
  const products = useDataStore((s) => s.products)
  const movements = useDataStore((s) => s.stockMovements)

  const [statusFilter, setStatusFilter] = useState('all')
  const [adjusting, setAdjusting] = useState<Product | undefined>()
  const [adjustOpen, setAdjustOpen] = useState(false)

  const lastUpdatedMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of movements) {
      if (!map.has(m.productId)) map.set(m.productId, m.createdAt)
    }
    return map
  }, [movements])

  const value = useMemo(() => inventoryValue(products), [products])
  const low = useMemo(() => lowStockProducts(products), [products])
  const outOfStock = products.filter((p) => p.stock <= 0).length

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        statusFilter === 'all' ? true : stockStatus(p.stock, p.minStock) === statusFilter,
      ),
    [products, statusFilter],
  )

  const openAdjust = (p: Product) => {
    setAdjusting(p)
    setAdjustOpen(true)
  }

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => (
          <Link to={`/products/${row.original.id}`} className="flex items-center gap-3">
            <ProductImage name={row.original.name} image={row.original.image} />
            <div className="min-w-0">
              <p className="truncate font-medium hover:text-primary">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.sku}</p>
            </div>
          </Link>
        ),
      },
      {
        accessorKey: 'stock',
        header: 'On hand',
        cell: ({ row }) => <span className="font-medium">{row.original.stock}</span>,
      },
      {
        accessorKey: 'reserved',
        header: 'Reserved',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.reserved}</span>,
      },
      {
        id: 'available',
        header: 'Available',
        cell: ({ row }) => (
          <span className="font-medium">
            {Math.max(0, row.original.stock - row.original.reserved)}
          </span>
        ),
      },
      {
        accessorKey: 'minStock',
        header: 'Min',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.minStock}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge status={stockStatus(row.original.stock, row.original.minStock)} />
        ),
      },
      {
        id: 'updated',
        header: 'Last updated',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {lastUpdatedMap.has(row.original.id)
              ? formatRelative(lastUpdatedMap.get(row.original.id)!)
              : '—'}
          </span>
        ),
      },
      ...(canManage
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }: { row: { original: Product } }) => (
                <div className="text-right">
                  <Button variant="outline" size="sm" onClick={() => openAdjust(row.original)}>
                    <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust
                  </Button>
                </div>
              ),
            } as ColumnDef<Product>,
          ]
        : []),
    ],
    [canManage, lastUpdatedMap],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Track stock levels across your catalog."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/inventory/alerts">
                <AlertTriangle className="h-4 w-4" /> Low Stock ({low.length})
              </Link>
            </Button>
            {canManage && (
              <Button variant="outline" asChild>
                <Link to="/inventory/adjustments">
                  <History className="h-4 w-4" /> Adjustments
                </Link>
              </Button>
            )}
          </>
        }
      />

      {loading ? (
        <CardsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total products" value={formatNumber(products.length)} icon={Boxes} />
          <StatCard
            title="Inventory value (cost)"
            value={formatCurrency(value.cost, { decimals: false })}
            icon={Coins}
            iconClassName="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            title="Low stock"
            value={formatNumber(low.length)}
            icon={AlertTriangle}
            iconClassName="bg-amber-100 text-amber-700"
          />
          <StatCard
            title="Out of stock"
            value={formatNumber(outOfStock)}
            icon={AlertTriangle}
            iconClassName="bg-rose-100 text-rose-700"
          />
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchKey="name"
          searchPlaceholder="Search inventory…"
          toolbar={
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Stock status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stock</SelectItem>
                <SelectItem value="in_stock">In stock</SelectItem>
                <SelectItem value="low_stock">Low stock</SelectItem>
                <SelectItem value="out_of_stock">Out of stock</SelectItem>
              </SelectContent>
            </Select>
          }
        />
      )}

      <AdjustStockDialog open={adjustOpen} onOpenChange={setAdjustOpen} product={adjusting} />
    </div>
  )
}
