import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PackageCheck, XCircle, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/States'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'

export default function PurchaseDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { actor } = useAuth()
  const purchases = useDataStore((s) => s.purchases)
  const suppliers = useDataStore((s) => s.suppliers)
  const stores = useDataStore((s) => s.stores)
  const users = useDataStore((s) => s.users)
  const receivePurchase = useDataStore((s) => s.receivePurchase)
  const cancelPurchase = useDataStore((s) => s.cancelPurchase)
  const updatePurchase = useDataStore((s) => s.updatePurchase)

  const [receiveOpen, setReceiveOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)

  const purchase = purchases.find((p) => p.id === id)

  if (!purchase) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Purchase not found"
        action={
          <Button asChild>
            <Link to="/purchases">Back to purchases</Link>
          </Button>
        }
      />
    )
  }

  const supplier = suppliers.find((s) => s.id === purchase.supplierId)
  const store = stores.find((s) => s.id === purchase.storeId)
  const createdBy = users.find((u) => u.id === purchase.createdBy)?.name ?? '—'
  const canReceive = purchase.status === 'draft' || purchase.status === 'ordered'

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/purchases')} className="-ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to purchases
      </Button>

      <PageHeader
        title={purchase.reference}
        description={`Created ${formatDateTime(purchase.createdAt)} by ${createdBy}`}
        actions={
          canReceive && (
            <>
              {purchase.status === 'draft' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    updatePurchase(purchase.id, { status: 'ordered' }, actor)
                    toast.success('Purchase marked as ordered.')
                  }}
                >
                  Mark as Ordered
                </Button>
              )}
              <Button variant="outline" onClick={() => setCancelOpen(true)}>
                <XCircle className="h-4 w-4" /> Cancel
              </Button>
              <Button onClick={() => setReceiveOpen(true)}>
                <PackageCheck className="h-4 w-4" /> Mark as Received
              </Button>
            </>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Items</CardTitle>
            <StatusBadge status={purchase.status} />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>
                    <span className="sm:hidden">Qty</span>
                    <span className="hidden sm:inline">Quantity</span>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Cost price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.items.map((i) => (
                  <TableRow key={i.productId}>
                    <TableCell>
                      <p className="font-medium">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{i.sku}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                        @ {formatCurrency(i.costPrice)}
                      </p>
                    </TableCell>
                    <TableCell>{i.quantity}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatCurrency(i.costPrice)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(i.lineTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between border-t p-4 text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(purchase.total)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Detail label="Supplier" value={supplier?.name ?? '—'} />
            <Detail label="Store" value={store?.name ?? '—'} />
            <Detail label="Status" value={<StatusBadge status={purchase.status} />} />
            <Detail label="Expected" value={formatDate(purchase.expectedDate)} />
            <Detail
              label="Received"
              value={purchase.receivedDate ? formatDate(purchase.receivedDate) : 'Pending'}
            />
            <Detail label="Created by" value={createdBy} />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        title="Receive this purchase?"
        description="Marking as received will add all ordered quantities to your inventory."
        confirmLabel="Confirm receive"
        onConfirm={() => {
          receivePurchase(purchase.id, actor)
          toast.success('Purchase received. Inventory updated.')
          setReceiveOpen(false)
        }}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this purchase?"
        description="This purchase order will be marked as cancelled."
        confirmLabel="Cancel purchase"
        destructive
        onConfirm={() => {
          cancelPurchase(purchase.id, actor)
          toast.success('Purchase cancelled.')
          setCancelOpen(false)
        }}
      />
    </div>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
