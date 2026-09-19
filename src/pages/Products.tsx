import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { TableSkeleton, EmptyState } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductImage } from '@/components/shared/ProductImage'
import { StatusBadge, stockStatus } from '@/components/shared/StatusBadge'
import { ProductFormDialog } from '@/components/products/ProductFormDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { formatCurrency } from '@/lib/format'
import type { Product } from '@/types'

export default function Products() {
  const loading = useSimulatedLoading()
  const navigate = useNavigate()
  const { hasPermission, actor } = useAuth()
  const canManage = hasPermission('products.manage')
  const products = useDataStore((s) => s.products)
  const categories = useDataStore((s) => s.categories)
  const deleteProduct = useDataStore((s) => s.deleteProduct)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | undefined>()
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—'

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (categoryFilter === 'all' || p.categoryId === categoryFilter) &&
          (statusFilter === 'all' || p.status === statusFilter),
      ),
    [products, categoryFilter, statusFilter],
  )

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
        accessorKey: 'categoryId',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{categoryName(row.original.categoryId)}</span>
        ),
      },
      {
        accessorKey: 'costPrice',
        header: 'Cost',
        cell: ({ row }) => formatCurrency(row.original.costPrice, { decimals: false }),
      },
      {
        accessorKey: 'sellingPrice',
        header: 'Price',
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(row.original.sellingPrice, { decimals: false })}
          </span>
        ),
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.stock}</span>
            <StatusBadge
              status={stockStatus(row.original.stock, row.original.minStock)}
              withDot={false}
            />
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/products/${row.original.id}`)}>
                  <Eye className="h-4 w-4" /> View details
                </DropdownMenuItem>
                {canManage && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(row.original)
                        setFormOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleting(row.original)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage, categories],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog across all branches."
        actions={
          canManage && (
            <Button
              onClick={() => {
                setEditing(undefined)
                setFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          )
        }
      />

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchKey="name"
          searchPlaceholder="Search products…"
          onRowClick={(p) => navigate(`/products/${p.id}`)}
          toolbar={
            <>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          emptyState={
            <EmptyState
              icon={Package}
              title="No products found"
              description="Try adjusting your filters or add a new product."
            />
          }
        />
      )}

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete product?"
        description={
          deleting ? (
            <>
              This will permanently remove <strong>{deleting.name}</strong> from your catalog. This
              action cannot be undone.
            </>
          ) : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleting) {
            deleteProduct(deleting.id, actor)
            toast.success('Product deleted.')
            setDeleting(null)
          }
        }}
      />
    </div>
  )
}
