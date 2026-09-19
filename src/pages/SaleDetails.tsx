import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Receipt as ReceiptIcon } from 'lucide-react'
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
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/States'
import { ReceiptDialog } from '@/components/pos/ReceiptDialog'
import { RefundDialog } from '@/components/sales/RefundDialog'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDateTime } from '@/lib/format'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'POS / Card',
  transfer: 'Bank Transfer',
}

export default function SaleDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, hasPermission } = useAuth()
  const sales = useDataStore((s) => s.sales)
  const users = useDataStore((s) => s.users)
  const customers = useDataStore((s) => s.customers)

  const [refundOpen, setRefundOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)

  const sale = sales.find((s) => s.id === id)

  if (!sale) {
    return (
      <EmptyState
        icon={ReceiptIcon}
        title="Transaction not found"
        action={
          <Button asChild>
            <Link to="/sales">Back to sales</Link>
          </Button>
        }
      />
    )
  }

  // Sellers may only see their own transactions
  const ownSale = sale.sellerId === user?.id
  if (!hasPermission('sales.view') && !ownSale) {
    return (
      <EmptyState
        icon={ReceiptIcon}
        title="Access denied"
        description="You can only view your own transactions."
        action={
          <Button asChild>
            <Link to="/my-sales">Back to my sales</Link>
          </Button>
        }
      />
    )
  }

  const seller = users.find((u) => u.id === sale.sellerId)
  const customer = customers.find((c) => c.id === sale.customerId)
  const canRefund =
    hasPermission('sales.refund') && (sale.status === 'completed' || sale.status === 'partially_refunded')
  const backTo = hasPermission('sales.view') ? '/sales' : '/my-sales'

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(backTo)} className="-ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <PageHeader
        title={sale.reference}
        description={formatDateTime(sale.createdAt)}
        actions={
          <>
            <Button variant="outline" onClick={() => setReceiptOpen(true)}>
              <ReceiptIcon className="h-4 w-4" /> Receipt
            </Button>
            {canRefund && (
              <Button variant="destructive" onClick={() => setRefundOpen(true)}>
                <RotateCcw className="h-4 w-4" /> Refund
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Items</CardTitle>
            <StatusBadge status={sale.status} />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                      {(item.refundedQty ?? 0) > 0 && (
                        <Badge variant="warning" className="mt-1">
                          {item.refundedQty} refunded
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="space-y-1.5 border-t p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-{formatCurrency(sale.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(sale.tax)}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5 text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Detail label="Status" value={<StatusBadge status={sale.status} />} />
              <Detail label="Payment" value={PAYMENT_LABELS[sale.paymentMethod]} />
              <Detail label="Amount paid" value={formatCurrency(sale.amountPaid)} />
              <Detail label="Change" value={formatCurrency(sale.change)} />
              <Detail label="Date" value={formatDateTime(sale.createdAt)} />
              {sale.refundReason && <Detail label="Refund reason" value={sale.refundReason} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">People</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Detail
                label="Customer"
                value={
                  customer ? (
                    <Link to={`/customers/${customer.id}`} className="text-primary hover:underline">
                      {customer.name}
                    </Link>
                  ) : (
                    sale.customerName
                  )
                }
              />
              <Detail label="Seller" value={seller?.name ?? 'Unknown'} />
            </CardContent>
          </Card>
        </div>
      </div>

      {canRefund && <RefundDialog open={refundOpen} onOpenChange={setRefundOpen} sale={sale} />}

      <ReceiptDialog sale={receiptOpen ? sale : null} onOpenChange={setReceiptOpen} />
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
