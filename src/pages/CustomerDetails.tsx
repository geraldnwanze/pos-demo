import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Coins, ShoppingBag, Receipt } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function CustomerDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const customers = useDataStore((s) => s.customers)
  const sales = useDataStore((s) => s.sales)
  const [editOpen, setEditOpen] = useState(false)

  const customer = customers.find((c) => c.id === id)
  const history = useMemo(
    () => sales.filter((s) => s.customerId === id).slice(0, 20),
    [sales, id],
  )

  if (!customer) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Customer not found"
        action={
          <Button asChild>
            <Link to="/customers">Back to customers</Link>
          </Button>
        }
      />
    )
  }

  const avg = customer.transactionCount > 0 ? customer.totalSpent / customer.transactionCount : 0
  const initials = customer.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/customers')} className="-ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to customers
      </Button>

      <PageHeader
        title={customer.name}
        description="Customer profile and purchase history"
        actions={
          hasPermission('customers.manage') && (
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <Avatar className="h-20 w-20 text-xl">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{customer.name}</h2>
              <StatusBadge status={customer.status} className="mt-1" />
            </div>
            <div className="w-full space-y-2 pt-2 text-left text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> {customer.phone}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" /> {customer.email || '—'}
              </p>
              <p className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {customer.address || '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <MiniStat icon={Coins} label="Total spent" value={formatCurrency(customer.totalSpent, { decimals: false })} tone="emerald" />
            <MiniStat icon={ShoppingBag} label="Transactions" value={String(customer.transactionCount)} tone="blue" />
            <MiniStat icon={Receipt} label="Avg. order" value={formatCurrency(avg, { decimals: false })} tone="violet" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Purchase history</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No purchases recorded yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/sales/${s.id}`)}
                      >
                        <TableCell className="font-medium text-primary">{s.reference}</TableCell>
                        <TableCell>{s.items.reduce((a, i) => a + i.quantity, 0)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(s.total)}</TableCell>
                        <TableCell>
                          <StatusBadge status={s.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
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
      </div>

      <CustomerFormDialog open={editOpen} onOpenChange={setEditOpen} customer={customer} />
    </div>
  )
}

const TONES = {
  emerald: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  violet: 'bg-violet-100 text-violet-700',
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Coins
  label: string
  value: string
  tone: keyof typeof TONES
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', TONES[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
