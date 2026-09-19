import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, Contact } from 'lucide-react'
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
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { formatCurrency, formatRelative } from '@/lib/format'
import type { Customer } from '@/types'

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function Customers() {
  const loading = useSimulatedLoading()
  const navigate = useNavigate()
  const { hasPermission, actor } = useAuth()
  const canManage = hasPermission('customers.manage')
  const customers = useDataStore((s) => s.customers)
  const deleteCustomer = useDataStore((s) => s.deleteCustomer)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | undefined>()
  const [deleting, setDeleting] = useState<Customer | null>(null)

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Customer',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{initials(row.original.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.email || '—'}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: 'phone', header: 'Phone' },
      {
        accessorKey: 'totalSpent',
        header: 'Total spent',
        cell: ({ row }) => (
          <span className="font-medium">{formatCurrency(row.original.totalSpent, { decimals: false })}</span>
        ),
      },
      {
        accessorKey: 'transactionCount',
        header: 'Orders',
        cell: ({ row }) => row.original.transactionCount,
      },
      {
        accessorKey: 'lastPurchase',
        header: 'Last purchase',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.lastPurchase ? formatRelative(row.original.lastPurchase) : 'Never'}
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
                <Button variant="ghost" size="icon-sm" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/customers/${row.original.id}`)}>
                  <Eye className="h-4 w-4" /> View details
                </DropdownMenuItem>
                {canManage && (
                  <>
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing(row.original)
                        setFormOpen(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleting(row.original)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManage],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customer relationships."
        actions={
          canManage && (
            <Button
              onClick={() => {
                setEditing(undefined)
                setFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> Add Customer
            </Button>
          )
        }
      />

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          searchKey="name"
          searchPlaceholder="Search customers…"
          onRowClick={(c) => navigate(`/customers/${c.id}`)}
          emptyState={
            <EmptyState icon={Contact} title="No customers yet" description="Add your first customer." />
          }
        />
      )}

      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete customer?"
        description={
          deleting ? (
            <>
              This will remove <strong>{deleting.name}</strong> and their profile. This cannot be
              undone.
            </>
          ) : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleting) {
            deleteCustomer(deleting.id, actor)
            toast.success('Customer deleted.')
            setDeleting(null)
          }
        }}
      />
    </div>
  )
}
