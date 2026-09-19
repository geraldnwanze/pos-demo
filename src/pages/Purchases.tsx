import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, ClipboardList, PackageCheck, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { TableSkeleton, EmptyState } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { formatCurrency, formatDate } from '@/lib/format'
import { money } from '@/lib/sales'
import type { Purchase, PurchaseItem, PurchaseStatus } from '@/types'

export default function Purchases() {
  const loading = useSimulatedLoading()
  const navigate = useNavigate()
  const { actor } = useAuth()
  const purchases = useDataStore((s) => s.purchases)
  const suppliers = useDataStore((s) => s.suppliers)
  const stores = useDataStore((s) => s.stores)
  const products = useDataStore((s) => s.products)
  const addPurchase = useDataStore((s) => s.addPurchase)

  const [formOpen, setFormOpen] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [storeId, setStoreId] = useState(stores[0]?.id ?? '')
  const [status, setStatus] = useState<PurchaseStatus>('ordered')
  const [expectedDate, setExpectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [pickProduct, setPickProduct] = useState('')

  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? '—'

  const resetForm = () => {
    setSupplierId('')
    setStoreId(stores[0]?.id ?? '')
    setStatus('ordered')
    setExpectedDate(new Date().toISOString().slice(0, 10))
    setItems([])
    setPickProduct('')
  }

  const addLine = (productId: string) => {
    const p = products.find((x) => x.id === productId)
    if (!p || items.some((i) => i.productId === productId)) return
    setItems((prev) => [
      ...prev,
      {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        quantity: 1,
        costPrice: p.costPrice,
        lineTotal: p.costPrice,
      },
    ])
    setPickProduct('')
  }

  const updateLine = (productId: string, patch: Partial<PurchaseItem>) =>
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? {
              ...i,
              ...patch,
              lineTotal: money((patch.costPrice ?? i.costPrice) * (patch.quantity ?? i.quantity)),
            }
          : i,
      ),
    )

  const total = money(items.reduce((s, i) => s + i.lineTotal, 0))

  const save = () => {
    if (!supplierId) return toast.error('Select a supplier.')
    if (items.length === 0) return toast.error('Add at least one product.')
    addPurchase(
      {
        supplierId,
        storeId,
        items,
        total,
        status,
        expectedDate: new Date(expectedDate).toISOString(),
        receivedDate: null,
        createdBy: actor.id,
      },
      actor,
    )
    toast.success('Purchase order created successfully.')
    setFormOpen(false)
    resetForm()
  }

  const columns = useMemo<ColumnDef<Purchase>[]>(
    () => [
      {
        accessorKey: 'reference',
        header: 'Purchase',
        cell: ({ row }) => <span className="font-medium text-primary">{row.original.reference}</span>,
      },
      {
        id: 'supplier',
        header: 'Supplier',
        cell: ({ row }) => supplierName(row.original.supplierId),
      },
      {
        id: 'items',
        header: 'Items',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.items.length} line(s)</span>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.original.total)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'expectedDate',
        header: 'Expected',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.expectedDate)}</span>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [suppliers],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        description="Manage purchase orders and receiving."
        actions={
          <Button
            onClick={() => {
              resetForm()
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> New Purchase
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          data={purchases}
          searchKey="reference"
          searchPlaceholder="Search purchases…"
          onRowClick={(p) => navigate(`/purchases/${p.id}`)}
          emptyState={
            <EmptyState
              icon={ClipboardList}
              title="No purchase orders"
              description="Create your first purchase order."
            />
          }
        />
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="flex max-w-2xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b p-4 pr-10 sm:p-6">
            <DialogTitle>New purchase order</DialogTitle>
            <DialogDescription>Order stock from a supplier.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Store</Label>
                  <Select value={storeId} onValueChange={setStoreId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Expected date</Label>
                  <Input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as PurchaseStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Add products</Label>
                <Select value={pickProduct} onValueChange={addLine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Search and add a product…" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter((p) => !items.some((i) => i.productId === p.id))
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} · {p.sku}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {items.length > 0 && (
                <div className="space-y-2 rounded-lg border p-3">
                  {items.map((i) => (
                    <div key={i.productId} className="flex flex-wrap items-center gap-2">
                      <div className="order-1 min-w-0 basis-[calc(100%-2.5rem)] sm:order-none sm:flex-1 sm:basis-0">
                        <p className="truncate text-sm font-medium">{i.name}</p>
                        <p className="text-xs text-muted-foreground">{i.sku}</p>
                      </div>
                      <div className="order-3 flex items-center gap-1 sm:order-none">
                        <Label className="text-xs text-muted-foreground">Qty</Label>
                        <Input
                          type="number"
                          min={1}
                          value={i.quantity}
                          onChange={(e) =>
                            updateLine(i.productId, { quantity: Math.max(1, Number(e.target.value)) })
                          }
                          className="w-16"
                        />
                      </div>
                      <div className="order-4 flex items-center gap-1 sm:order-none">
                        <Label className="text-xs text-muted-foreground">Cost</Label>
                        <Input
                          type="number"
                          value={i.costPrice}
                          onChange={(e) =>
                            updateLine(i.productId, { costPrice: Math.max(0, Number(e.target.value)) })
                          }
                          className="w-24"
                        />
                      </div>
                      <span className="order-5 ml-auto text-right text-sm font-medium sm:order-none sm:ml-0 sm:w-24">
                        {formatCurrency(i.lineTotal, { decimals: false })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="order-2 sm:order-none"
                        onClick={() =>
                          setItems((prev) => prev.filter((x) => x.productId !== i.productId))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 text-sm font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t p-4 sm:p-6">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>
              <PackageCheck className="h-4 w-4" /> Create purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
