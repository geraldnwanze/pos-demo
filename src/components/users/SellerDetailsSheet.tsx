import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { startOfMonth } from 'date-fns'
import { Mail, Phone, Store as StoreIcon, Clock, Pencil } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useDataStore } from '@/stores/dataStore'
import { formatCurrency, formatDateTime, formatNumber, formatRelative } from '@/lib/format'
import { isActiveSale, saleNet, salesInRange, todaySales } from '@/lib/analytics'
import type { User } from '@/types'

interface SellerDetailsSheetProps {
  seller: User | null
  onOpenChange: (open: boolean) => void
  onEdit: (seller: User) => void
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export function SellerDetailsSheet({ seller, onOpenChange, onEdit }: SellerDetailsSheetProps) {
  const sales = useDataStore((s) => s.sales)
  const stores = useDataStore((s) => s.stores)

  const stats = useMemo(() => {
    if (!seller) return null
    const own = sales.filter((s) => s.sellerId === seller.id)
    const now = new Date()
    const month = salesInRange(own, startOfMonth(now), now).filter(isActiveSale)
    const monthRevenue = month.reduce((sum, s) => sum + saleNet(s), 0)
    return {
      today: todaySales(own, now)
        .filter(isActiveSale)
        .reduce((sum, s) => sum + saleNet(s), 0),
      monthRevenue,
      monthCount: month.length,
      avg: month.length ? monthRevenue / month.length : 0,
      refunds: own.filter((s) => s.status === 'refunded' || s.status === 'partially_refunded').length,
      recent: own.slice(0, 6),
    }
  }, [seller, sales])

  const storeName = stores.find((s) => s.id === seller?.storeId)?.name ?? 'HQ'

  return (
    <Sheet open={!!seller} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {seller && stats && (
          <>
            <SheetHeader className="shrink-0 border-b p-5 pr-12">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback style={{ backgroundColor: seller.avatarColor, color: 'white' }}>
                    {initials(seller.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <SheetTitle className="truncate">{seller.name}</SheetTitle>
                  <SheetDescription asChild>
                    <div className="flex items-center gap-2">
                      Seller · <StatusBadge status={seller.status} />
                    </div>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
              <dl className="space-y-2 text-sm">
                <Row icon={Mail} label="Email" value={seller.email} />
                <Row icon={Phone} label="Phone" value={seller.phone} />
                <Row icon={StoreIcon} label="Store" value={storeName} />
                <Row
                  icon={Clock}
                  label="Last login"
                  value={seller.lastLogin ? formatRelative(seller.lastLogin) : 'Never'}
                />
              </dl>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Performance</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Sales today" value={formatCurrency(stats.today, { decimals: false })} />
                  <Metric label="This month" value={formatCurrency(stats.monthRevenue, { decimals: false })} />
                  <Metric label="Transactions (month)" value={formatNumber(stats.monthCount)} />
                  <Metric label="Avg. sale (month)" value={formatCurrency(stats.avg, { decimals: false })} />
                  <Metric label="Refunded transactions" value={formatNumber(stats.refunds)} />
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Recent transactions</h3>
                {stats.recent.length === 0 ? (
                  <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No sales yet.
                  </p>
                ) : (
                  <ul className="divide-y rounded-md border">
                    {stats.recent.map((s) => (
                      <li key={s.id}>
                        <Link
                          to={`/sales/${s.id}`}
                          className="flex items-center justify-between gap-3 p-3 text-sm hover:bg-muted/50"
                        >
                          <span className="min-w-0">
                            <span className="block font-medium text-primary">{s.reference}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {s.customerName} · {formatDateTime(s.createdAt)}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block whitespace-nowrap font-medium">
                              {formatCurrency(s.total)}
                            </span>
                            <StatusBadge status={s.status} withDot={false} />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t p-4">
              <Button className="w-full" onClick={() => onEdit(seller)}>
                <Pencil className="h-4 w-4" /> Edit seller
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex shrink-0 items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </dt>
      <dd className="min-w-0 text-right font-medium">{value}</dd>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 whitespace-nowrap text-base font-semibold">{value}</p>
    </div>
  )
}
