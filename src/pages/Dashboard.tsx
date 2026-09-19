import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Banknote,
  Receipt,
  Package,
  AlertTriangle,
  Users,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { CardsSkeleton, TableSkeleton } from '@/components/shared/States'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge, stockStatus } from '@/components/shared/StatusBadge'
import { ProductImage } from '@/components/shared/ProductImage'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import {
  lowStockProducts,
  monthlyRevenue,
  revenueByDay,
  salesByPaymentMethod,
  saleNet,
  todaySales,
  topSellingProducts,
  isActiveSale,
} from '@/lib/analytics'
import { formatCurrency, formatDateTime, formatNumber } from '@/lib/format'
import { subDays } from 'date-fns'
import { cn } from '@/lib/utils'

const RANGES = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

export default function Dashboard() {
  const loading = useSimulatedLoading()
  const { user } = useAuth()
  const products = useDataStore((s) => s.products)
  const sales = useDataStore((s) => s.sales)
  const customers = useDataStore((s) => s.customers)
  const users = useDataStore((s) => s.users)
  const [range, setRange] = useState(7)
  const now = useMemo(() => new Date(), [])

  const metrics = useMemo(() => {
    const today = todaySales(sales)
    const todayRevenue = today.filter(isActiveSale).reduce((sum, s) => sum + saleNet(s), 0)
    const low = lowStockProducts(products)
    return {
      todayRevenue,
      todayTransactions: today.length,
      totalProducts: products.length,
      lowStock: low.length,
      lowStockList: low.slice(0, 6),
      totalCustomers: customers.length,
      monthly: monthlyRevenue(sales),
      revenueSeries: revenueByDay(sales, range),
      payments: salesByPaymentMethod(
        sales.filter((s) => new Date(s.createdAt) >= subDays(now, range)),
      ),
      topProducts: topSellingProducts(sales, 5),
      recent: sales.slice(0, 6),
    }
  }, [sales, products, customers, range, now])

  const sellerName = (id: string) => users.find((u) => u.id === id)?.name ?? 'Unknown'

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name.split(' ')[0]}`}
        description="Here's what's happening across your business today."
      />

      {loading ? (
        <CardsSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Today's Sales"
            value={formatCurrency(metrics.todayRevenue, { decimals: false })}
            icon={Banknote}
            trend={{ value: 12.4, label: 'vs yesterday' }}
          />
          <StatCard
            title="Transactions"
            value={formatNumber(metrics.todayTransactions)}
            icon={Receipt}
            iconClassName="bg-violet-100 text-violet-700"
            trend={{ value: 8.1, label: 'today' }}
          />
          <StatCard
            title="Total Products"
            value={formatNumber(metrics.totalProducts)}
            icon={Package}
            iconClassName="bg-emerald-100 text-emerald-700"
            hint="Across all branches"
          />
          <StatCard
            title="Low Stock"
            value={formatNumber(metrics.lowStock)}
            icon={AlertTriangle}
            iconClassName="bg-amber-100 text-amber-700"
            hint="Needs attention"
          />
          <StatCard
            title="Customers"
            value={formatNumber(metrics.totalCustomers)}
            icon={Users}
            iconClassName="bg-cyan-100 text-cyan-700"
            trend={{ value: 3.2, label: 'this month' }}
          />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(metrics.monthly, { decimals: false })}
            icon={TrendingUp}
            iconClassName="bg-rose-100 text-rose-700"
            trend={{ value: 5.6, label: 'this month' }}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Revenue overview</CardTitle>
              <CardDescription>Sales revenue over the selected period</CardDescription>
            </div>
            <div className="flex rounded-lg bg-muted p-1">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    range === r.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] animate-pulse rounded-md bg-muted" />
            ) : (
              <RevenueChart data={metrics.revenueSeries} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by payment</CardTitle>
            <CardDescription>Last {range} days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[240px] animate-pulse rounded-md bg-muted" />
            ) : (
              <DonutChart data={metrics.payments} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Top selling products</CardTitle>
              <CardDescription>By revenue</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reports/products">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : (
              metrics.topProducts.map((p, i) => (
                <div
                  key={p.productId}
                  className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(p.units)} units sold</p>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(p.revenue, { decimals: false })}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Low stock alerts</CardTitle>
              <CardDescription>Products below minimum level</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/inventory/alerts">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <div className="space-y-3 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : metrics.lowStockList.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                All products are well stocked. 🎉
              </p>
            ) : (
              metrics.lowStockList.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
                >
                  <ProductImage name={p.name} image={p.image} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {p.stock}
                      <span className="text-xs font-normal text-muted-foreground"> / {p.minStock}</span>
                    </p>
                    <StatusBadge status={stockStatus(p.stock, p.minStock)} withDot={false} className="mt-0.5" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Recent transactions</CardTitle>
            <CardDescription>Latest sales across all branches</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/sales">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Seller</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.recent.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link to={`/sales/${s.id}`} className="font-medium text-primary hover:underline">
                        {s.reference}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate">{s.customerName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">
                            {sellerName(s.sellerId)
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm">{sellerName(s.sellerId)}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(s.total)}</TableCell>
                    <TableCell className="hidden capitalize sm:table-cell">
                      <Badge variant="outline">{s.paymentMethod === 'card' ? 'POS/Card' : s.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground lg:table-cell">
                      {formatDateTime(s.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
