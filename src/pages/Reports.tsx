import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Banknote,
  Percent,
  Receipt,
  TrendingUp,
  Boxes,
  AlertTriangle,
  PackageX,
  Coins,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RevenueChart } from '@/components/charts/RevenueChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { BarChartSimple } from '@/components/charts/BarChartSimple'
import { useDataStore } from '@/stores/dataStore'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import {
  inventoryValue,
  isActiveSale,
  lowStockProducts,
  revenueByDay,
  saleNet,
  salesByPaymentMethod,
  topSellingProducts,
} from '@/lib/analytics'
import { isWithinInterval, parseISO, startOfDay, endOfDay, subDays } from 'date-fns'

const TABS = ['sales', 'inventory', 'products', 'sellers', 'expenses'] as const
type Tab = (typeof TABS)[number]

export default function Reports() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const active: Tab = (TABS as readonly string[]).includes(tab ?? '') ? (tab as Tab) : 'sales'

  const sales = useDataStore((s) => s.sales)
  const products = useDataStore((s) => s.products)
  const users = useDataStore((s) => s.users)
  const stores = useDataStore((s) => s.stores)
  const expenses = useDataStore((s) => s.expenses)
  const movements = useDataStore((s) => s.stockMovements)

  const [from, setFrom] = useState(subDays(new Date(), 29).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [storeFilter, setStoreFilter] = useState('all')

  const rangedSales = useMemo(
    () =>
      sales.filter((s) => {
        if (storeFilter !== 'all' && s.storeId !== storeFilter) return false
        return isWithinInterval(parseISO(s.createdAt), {
          start: startOfDay(parseISO(from)),
          end: endOfDay(parseISO(to)),
        })
      }),
    [sales, from, to, storeFilter],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Analyze your business performance." />

      <Tabs value={active} onValueChange={(v) => navigate(`/reports/${v}`)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="sellers">Sellers</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        {/* Shared filters for sales-based tabs */}
        {(active === 'sales' || active === 'sellers' || active === 'products') && (
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Store</Label>
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stores</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <TabsContent value="sales">
          <SalesReport sales={rangedSales} from={from} to={to} />
        </TabsContent>
        <TabsContent value="inventory">
          <InventoryReport products={products} movementsCount={movements.length} />
        </TabsContent>
        <TabsContent value="products">
          <ProductPerformance sales={rangedSales} products={products} />
        </TabsContent>
        <TabsContent value="sellers">
          <SellerPerformance sales={rangedSales} users={users} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpenseReport expenses={expenses} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

import type { Expense, Product, Sale, User } from '@/types'
import { differenceInCalendarDays } from 'date-fns'

function SalesReport({ sales, from, to }: { sales: Sale[]; from: string; to: string }) {
  const active = sales.filter(isActiveSale)
  const gross = active.reduce((s, x) => s + x.subtotal, 0)
  const discounts = active.reduce((s, x) => s + x.discountAmount, 0)
  const tax = active.reduce((s, x) => s + x.tax, 0)
  const net = gross - discounts
  const collected = active.reduce((s, x) => s + saleNet(x), 0)
  const days = Math.max(1, differenceInCalendarDays(parseISO(to), parseISO(from)) + 1)
  const series = useMemo(() => revenueByDay(sales, days, parseISO(to)), [sales, days, to])
  const payments = salesByPaymentMethod(sales)

  return (
    <div className="mt-4 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard title="Gross sales" value={formatCurrency(gross, { decimals: false })} icon={Banknote} />
        <StatCard title="Discounts" value={formatCurrency(discounts, { decimals: false })} icon={Percent} iconClassName="bg-amber-100 text-amber-700" />
        <StatCard title="Tax" value={formatCurrency(tax, { decimals: false })} icon={Receipt} iconClassName="bg-violet-100 text-violet-700" />
        <StatCard title="Net sales" value={formatCurrency(net, { decimals: false })} icon={TrendingUp} iconClassName="bg-emerald-100 text-emerald-700" />
        <StatCard title="Transactions" value={formatNumber(active.length)} icon={Receipt} iconClassName="bg-blue-100 text-blue-700" />
        <StatCard title="Avg. transaction" value={formatCurrency(active.length ? collected / active.length : 0, { decimals: false })} icon={Coins} iconClassName="bg-cyan-100 text-cyan-700" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
            <CardDescription>Net revenue over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={series} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By payment method</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={payments} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InventoryReport({ products, movementsCount }: { products: Product[]; movementsCount: number }) {
  const value = inventoryValue(products)
  const low = lowStockProducts(products).length
  const out = products.filter((p) => p.stock <= 0).length
  const topByValue = [...products]
    .map((p) => ({ label: p.name.length > 14 ? p.name.slice(0, 12) + '…' : p.name, value: p.stock * p.costPrice }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  return (
    <div className="mt-4 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Inventory value (cost)" value={formatCurrency(value.cost, { decimals: false })} icon={Coins} iconClassName="bg-emerald-100 text-emerald-700" />
        <StatCard title="Retail value" value={formatCurrency(value.retail, { decimals: false })} icon={Banknote} />
        <StatCard title="Low stock" value={formatNumber(low)} icon={AlertTriangle} iconClassName="bg-amber-100 text-amber-700" />
        <StatCard title="Out of stock" value={formatNumber(out)} icon={PackageX} iconClassName="bg-rose-100 text-rose-700" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top products by stock value</CardTitle>
            <CardDescription>Cost value of on-hand stock</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChartSimple data={topByValue} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Total products" value={formatNumber(products.length)} icon={Boxes} />
            <Row label="Total units on hand" value={formatNumber(products.reduce((s, p) => s + p.stock, 0))} icon={Boxes} />
            <Row label="Inventory movements" value={formatNumber(movementsCount)} icon={TrendingUp} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProductPerformance({ sales, products }: { sales: Sale[]; products: Product[] }) {
  const top = topSellingProducts(sales, 100)
  const rows = top.map((t) => {
    const product = products.find((p) => p.id === t.productId)
    const cost = product ? product.costPrice * t.units : 0
    const profit = t.revenue - cost
    const margin = t.revenue > 0 ? (profit / t.revenue) * 100 : 0
    return { ...t, profit, margin }
  })

  return (
    <div className="mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Product performance</CardTitle>
          <CardDescription>Units sold, revenue and profit for the selected period</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No sales in the selected period.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden sm:table-cell">Units sold</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead className="hidden sm:table-cell">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.productId}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">{formatNumber(r.units)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatCurrency(r.revenue, { decimals: false })}</TableCell>
                    <TableCell className="whitespace-nowrap text-success">
                      {formatCurrency(r.profit, { decimals: false })}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">{formatPercent(r.margin)}</TableCell>
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

function SellerPerformance({ sales, users }: { sales: Sale[]; users: User[] }) {
  const sellers = users.filter((u) => u.role === 'seller' || u.role === 'admin')
  const rows = sellers
    .map((seller) => {
      const own = sales.filter((s) => s.sellerId === seller.id)
      const active = own.filter(isActiveSale)
      const revenue = active.reduce((s, x) => s + saleNet(x), 0)
      const refunds = own.filter((s) => s.status === 'refunded' || s.status === 'partially_refunded').length
      return {
        id: seller.id,
        name: seller.name,
        transactions: active.length,
        revenue,
        avg: active.length ? revenue / active.length : 0,
        refunds,
      }
    })
    .filter((r) => r.transactions > 0 || r.refunds > 0)
    .sort((a, b) => b.revenue - a.revenue)

  const chart = rows.slice(0, 8).map((r) => ({
    label: r.name.split(' ')[0],
    value: r.revenue,
  }))

  return (
    <div className="mt-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenue by seller</CardTitle>
        </CardHeader>
        <CardContent>
          {chart.length ? (
            <BarChartSimple data={chart} color="hsl(var(--primary))" />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No data.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Seller performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seller</TableHead>
                <TableHead>
                  <span className="sm:hidden">Txns</span>
                  <span className="hidden sm:inline">Transactions</span>
                </TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead className="hidden sm:table-cell">Avg. sale</TableHead>
                <TableHead className="hidden sm:table-cell">Refunds</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatNumber(r.transactions)}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatCurrency(r.revenue, { decimals: false })}</TableCell>
                  <TableCell className="hidden whitespace-nowrap sm:table-cell">{formatCurrency(r.avg, { decimals: false })}</TableCell>
                  <TableCell className="hidden sm:table-cell">{r.refunds}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ExpenseReport({ expenses }: { expenses: Expense[] }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount))
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }))
  }, [expenses])

  return (
    <div className="mt-4 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total expenses" value={formatCurrency(total, { decimals: false })} icon={Coins} iconClassName="bg-rose-100 text-rose-700" />
        <StatCard title="Categories" value={String(byCategory.length)} icon={Receipt} />
        <StatCard title="Records" value={String(expenses.length)} icon={Boxes} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expenses by category</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={byCategory} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Category breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartSimple data={byCategory} color="hsl(var(--destructive))" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'
function Row({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" /> {label}
      </span>
      <span className="shrink-0 whitespace-nowrap font-semibold">{value}</span>
    </div>
  )
}
