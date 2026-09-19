import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Receipt, Banknote, Hash, ShoppingCart } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatCard } from '@/components/shared/StatCard'
import { TableSkeleton, CardsSkeleton, EmptyState } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format'
import { isActiveSale, saleNet, todaySales } from '@/lib/analytics'
import type { Sale } from '@/types'
import { Link } from 'react-router-dom'

export default function MySales() {
  const loading = useSimulatedLoading()
  const navigate = useNavigate()
  const { user } = useAuth()
  const sales = useDataStore((s) => s.sales)

  const mySales = useMemo(
    () => sales.filter((s) => s.sellerId === user?.id),
    [sales, user],
  )

  const summary = useMemo(() => {
    const active = mySales.filter(isActiveSale)
    const today = todaySales(mySales)
    return {
      total: mySales.length,
      todayCount: today.length,
      todayRevenue: today.filter(isActiveSale).reduce((s, x) => s + saleNet(x), 0),
      revenue: active.reduce((s, x) => s + saleNet(x), 0),
    }
  }, [mySales])

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
      },
      {
        id: 'items',
        header: 'Items',
        cell: ({ row }) => row.original.items.reduce((s, i) => s + i.quantity, 0),
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
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Sales"
        description="Transactions you've processed."
        actions={
          <Button asChild>
            <Link to="/pos">
              <ShoppingCart className="h-4 w-4" /> New Sale
            </Link>
          </Button>
        }
      />

      {loading ? (
        <CardsSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's sales"
            value={formatCurrency(summary.todayRevenue, { decimals: false })}
            icon={Banknote}
            iconClassName="bg-emerald-100 text-emerald-700"
          />
          <StatCard title="Today's transactions" value={formatNumber(summary.todayCount)} icon={Hash} />
          <StatCard
            title="Total transactions"
            value={formatNumber(summary.total)}
            icon={Receipt}
            iconClassName="bg-violet-100 text-violet-700"
          />
          <StatCard
            title="Total revenue"
            value={formatCurrency(summary.revenue, { decimals: false })}
            icon={Banknote}
            iconClassName="bg-cyan-100 text-cyan-700"
          />
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          data={mySales}
          searchKey="reference"
          searchPlaceholder="Search your transactions…"
          onRowClick={(s) => navigate(`/sales/${s.id}`)}
          emptyState={
            <EmptyState
              icon={Receipt}
              title="No sales yet"
              description="Complete a sale from the POS to see it here."
              action={
                <Button asChild>
                  <Link to="/pos">Go to POS</Link>
                </Button>
              }
            />
          }
        />
      )}
    </div>
  )
}
