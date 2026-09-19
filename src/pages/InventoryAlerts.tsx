import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import {
  ArrowLeft,
  SlidersHorizontal,
  Eye,
  ClipboardList,
  CheckCircle2,
  MoreHorizontal,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProductImage } from '@/components/shared/ProductImage'
import { StatusBadge, stockStatus } from '@/components/shared/StatusBadge'
import { EmptyState, TableSkeleton } from '@/components/shared/States'
import { AdjustStockDialog } from '@/components/inventory/AdjustStockDialog'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { lowStockProducts } from '@/lib/analytics'
import type { Product } from '@/types'

export default function InventoryAlerts() {
  const loading = useSimulatedLoading()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canManage = hasPermission('inventory.manage')
  const canPurchase = hasPermission('purchases.manage')
  const products = useDataStore((s) => s.products)
  const [adjusting, setAdjusting] = useState<Product | undefined>()
  const [adjustOpen, setAdjustOpen] = useState(false)

  const low = useMemo(() => lowStockProducts(products), [products])

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <ProductImage name={row.original.name} image={row.original.image} />
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.sku}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'stock',
        header: 'Current',
        cell: ({ row }) => <span className="font-medium">{row.original.stock}</span>,
      },
      {
        accessorKey: 'minStock',
        header: 'Minimum',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.minStock}</span>,
      },
      {
        id: 'difference',
        header: 'Difference',
        cell: ({ row }) => (
          <span className="font-medium text-destructive">
            {row.original.stock - row.original.minStock}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge status={stockStatus(row.original.stock, row.original.minStock)} />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canManage && (
                  <DropdownMenuItem
                    onClick={() => {
                      setAdjusting(row.original)
                      setAdjustOpen(true)
                    }}
                  >
                    <SlidersHorizontal className="h-4 w-4" /> Adjust stock
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate(`/products/${row.original.id}`)}>
                  <Eye className="h-4 w-4" /> View product
                </DropdownMenuItem>
                {canPurchase && (
                  <DropdownMenuItem onClick={() => navigate('/purchases')}>
                    <ClipboardList className="h-4 w-4" /> Create purchase
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canManage, canPurchase, navigate],
  )

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/inventory')} className="-ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to inventory
      </Button>
      <PageHeader
        title="Low stock alerts"
        description="Products at or below their minimum stock level."
      />

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : low.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Everything is well stocked"
          description="No products are currently below their minimum stock level."
          action={
            <Button asChild>
              <Link to="/inventory">Back to inventory</Link>
            </Button>
          }
        />
      ) : (
        <DataTable columns={columns} data={low} />
      )}

      <AdjustStockDialog open={adjustOpen} onOpenChange={setAdjustOpen} product={adjusting} />
    </div>
  )
}
