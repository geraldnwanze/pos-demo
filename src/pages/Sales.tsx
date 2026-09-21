import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Receipt, Banknote, TrendingDown, Hash } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatCard } from '@/components/shared/StatCard'
import { TableSkeleton, CardsSkeleton, EmptyState } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useDataStore } from '@/stores/dataStore'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format'
import { isActiveSale, saleNet } from '@/lib/analytics'
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'
import type { Sale } from '@/types'

export default function Sales() {
  const loading = useSimulatedLoading()
  const navigate = useNavigate()
  const sales = useDataStore((s) => s.sales)
  const users = useDataStore((s) => s.users)

  const sellers = users.filter((u) => u.role === 'seller' || u.role === 'admin')
  const [sellerFilter, setSellerFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const sellerName = (id: string) => users.find((u) => u.id === id)?.name ?? 'Unknown'

  const filtered = useMemo(
    () =>
      sales.filter((s) => {
        if (sellerFilter !== 'all' && s.sellerId !== sellerFilter) return false
        if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false
        if (statusFilter !== 'all' && s.status !== statusFilter) return false
        if (from && to) {
          const d = parseISO(s.createdAt)
          if (!isWithinInterval(d, { start: startOfDay(parseISO(from)), end: endOfDay(parseISO(to)) }))
            return false
        }
        return true
      }),
    [sales, sellerFilter, paymentFilter, statusFilter, from, to],
  )

  const summary = useMemo(() => {
    const active = filtered.filter(isActiveSale)
    const revenue = active.reduce((sum, s) => sum + saleNet(s), 0)
    const refunds = filtered.filter((s) => s.status === 'refunded' || s.status === 'partially_refunded').length
    return {
      count: filtered.length,
      revenue,
      avg: active.length ? revenue / active.length : 0,
      refunds,
    }
  }, [filtered])

  const columns = useMemo<ColumnDef<Sale>[]>(
    () => [
      {
        accessorKey: 'reference',
        header: 'Transaction',
        cell: ({ row }) => <span className="font-medium text-primary">{row.original.reference}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Customer',
        cell: ({ row }) => <span className="block max-w-[140px] truncate">{row.original.customerName}</span>,
      },
      {
        accessorKey: 'sellerId',
        header: 'Seller',
        cell: ({ row }) => <span className="text-sm">{sellerName(row.original.sellerId)}</span>,
      },
      {
        id: 'items',
        header: 'Items',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.items.reduce((s, i) => s + i.quantity, 0)}
          </span>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.original.total)}</span>,
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Payment',
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.paymentMethod === 'card' ? 'POS/Card' : row.original.paymentMethod}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Sales" description="All sales transactions across your business." />

      {loading ? (
        <CardsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Transactions" value={formatNumber(summary.count)} icon={Hash} />
          <StatCard
            title="Net revenue"
            value={formatCurrency(summary.revenue, { decimals: false })}
            icon={Banknote}
            iconClassName="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            title="Avg. transaction"
            value={formatCurrency(summary.avg, { decimals: false })}
            icon={Receipt}
            iconClassName="bg-violet-100 text-violet-700"
          />
          <StatCard
            title="Refunds"
            value={formatNumber(summary.refunds)}
            icon={TrendingDown}
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
          searchKey="reference"
          searchPlaceholder="Search by reference or customer…"
          onRowClick={(s) => navigate(`/sales/${s.id}`)}
          emptyState={
            <EmptyState icon={Receipt} title="No transactions found" description="Adjust the filters to see results." />
          }
          toolbar={
            <>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-36"
                aria-label="From date"
              />
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-36"
                aria-label="To date"
              />
              <Select value={sellerFilter} onValueChange={setSellerFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Seller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sellers</SelectItem>
                  {sellers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payments</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">POS / Card</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                  <SelectItem value="partially_refunded">Partial refund</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
        />
      )}
    </div>
  )
}
