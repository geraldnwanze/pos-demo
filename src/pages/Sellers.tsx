import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, MoreHorizontal, Pencil, Power, KeyRound, Users } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { TableSkeleton, EmptyState } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { UserFormDialog } from '@/components/users/UserFormDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { formatCurrency } from '@/lib/format'
import { isActiveSale, monthlyRevenue, saleNet, todaySales } from '@/lib/analytics'
import type { User } from '@/types'

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function Sellers() {
  const loading = useSimulatedLoading()
  const { actor } = useAuth()
  const users = useDataStore((s) => s.users)
  const stores = useDataStore((s) => s.stores)
  const sales = useDataStore((s) => s.sales)
  const updateUser = useDataStore((s) => s.updateUser)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | undefined>()
  const [toggling, setToggling] = useState<User | null>(null)

  const sellers = useMemo(() => users.filter((u) => u.role === 'seller'), [users])
  const storeName = (id: string | null) => stores.find((s) => s.id === id)?.name ?? 'HQ'

  const salesStats = useMemo(() => {
    const map = new Map<string, { today: number; month: number }>()
    for (const seller of sellers) {
      const own = sales.filter((s) => s.sellerId === seller.id)
      const today = todaySales(own).filter(isActiveSale).reduce((sum, s) => sum + saleNet(s), 0)
      map.set(seller.id, { today, month: monthlyRevenue(own) })
    }
    return map
  }, [sellers, sales])

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Seller',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback style={{ backgroundColor: row.original.avatarColor, color: 'white' }}>
                {initials(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: 'phone', header: 'Phone' },
      {
        id: 'store',
        header: 'Store',
        cell: ({ row }) => storeName(row.original.storeId),
      },
      {
        id: 'today',
        header: 'Sales today',
        cell: ({ row }) => formatCurrency(salesStats.get(row.original.id)?.today ?? 0, { decimals: false }),
      },
      {
        id: 'month',
        header: 'This month',
        cell: ({ row }) => (
          <span className="font-medium">
            {formatCurrency(salesStats.get(row.original.id)?.month ?? 0, { decimals: false })}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setEditing(row.original)
                    setFormOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.success('Password reset link sent.')}>
                  <KeyRound className="h-4 w-4" /> Reset password
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setToggling(row.original)}>
                  <Power className="h-4 w-4" />
                  {row.original.status === 'active' ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [salesStats, stores],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sellers"
        description="Manage your cashiers and their performance."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Add Seller
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          data={sellers}
          searchKey="name"
          searchPlaceholder="Search sellers…"
          emptyState={<EmptyState icon={Users} title="No sellers yet" description="Add your first seller." />}
        />
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        allowedRoles={['seller']}
        title={editing ? 'Edit seller' : 'Add seller'}
      />

      <ConfirmDialog
        open={!!toggling}
        onOpenChange={(o) => !o && setToggling(null)}
        title={toggling?.status === 'active' ? 'Deactivate seller?' : 'Activate seller?'}
        description={
          toggling
            ? `${toggling.name} will ${toggling.status === 'active' ? 'no longer be able to' : 'be able to'} log in.`
            : undefined
        }
        confirmLabel={toggling?.status === 'active' ? 'Deactivate' : 'Activate'}
        destructive={toggling?.status === 'active'}
        onConfirm={() => {
          if (toggling) {
            updateUser(
              toggling.id,
              { status: toggling.status === 'active' ? 'inactive' : 'active' },
              actor,
            )
            toast.success('Seller updated successfully.')
            setToggling(null)
          }
        }}
      />
    </div>
  )
}
