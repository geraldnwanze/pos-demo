import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, SlidersHorizontal, Eye, ClipboardList, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
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
  const products = useDataStore((s) => s.products)
  const [adjusting, setAdjusting] = useState<Product | undefined>()
  const [adjustOpen, setAdjustOpen] = useState(false)

  const low = useMemo(() => lowStockProducts(products), [products])

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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Minimum</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {low.map((p) => {
                  const diff = p.stock - p.minStock
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductImage name={p.name} image={p.image} />
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{p.stock}</TableCell>
                      <TableCell className="text-muted-foreground">{p.minStock}</TableCell>
                      <TableCell>
                        <span className="font-medium text-destructive">{diff}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={stockStatus(p.stock, p.minStock)} />
                      </TableCell>
                      <TableCell className="text-right">
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
                                  setAdjusting(p)
                                  setAdjustOpen(true)
                                }}
                              >
                                <SlidersHorizontal className="h-4 w-4" /> Adjust stock
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => navigate(`/products/${p.id}`)}>
                              <Eye className="h-4 w-4" /> View product
                            </DropdownMenuItem>
                            {hasPermission('purchases.manage') && (
                              <DropdownMenuItem onClick={() => navigate('/purchases')}>
                                <ClipboardList className="h-4 w-4" /> Create purchase
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AdjustStockDialog open={adjustOpen} onOpenChange={setAdjustOpen} product={adjusting} />
    </div>
  )
}
