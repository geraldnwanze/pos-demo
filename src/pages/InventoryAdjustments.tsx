import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
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
import { TableSkeleton } from '@/components/shared/States'
import { AdjustStockDialog } from '@/components/inventory/AdjustStockDialog'
import { useDataStore } from '@/stores/dataStore'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Product, StockMovementType } from '@/types'

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

  const productName = (id: string) => products.find((p) => p.id === id)
  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? 'System'

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

      <div className="flex justify-end">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
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
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const p = productName(m.productId)
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(m.createdAt)}
                      </TableCell>
                      <TableCell>
                        {p ? (
                          <div className="flex items-center gap-2">
                            <ProductImage name={p.name} image={p.image} size="sm" />
                            <div>
                              <p className="text-sm font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.sku}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{LABELS[m.type]}</Badge>
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
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
