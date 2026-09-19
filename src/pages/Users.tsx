import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, MoreHorizontal, Pencil, Power, Trash2, KeyRound, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { TableSkeleton, EmptyState } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { ROLE_LABELS } from '@/lib/rbac'
import { formatRelative } from '@/lib/format'
import type { User } from '@/types'

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'warning'> = {
  super_admin: 'default',
  admin: 'warning',
  seller: 'secondary',
}

export default function Users() {
  const loading = useSimulatedLoading()
  const { actor, user: current } = useAuth()
  const users = useDataStore((s) => s.users)
  const stores = useDataStore((s) => s.stores)
  const updateUser = useDataStore((s) => s.updateUser)
  const deleteUser = useDataStore((s) => s.deleteUser)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | undefined>()
  const [toggling, setToggling] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)

  const storeName = (id: string | null) => stores.find((s) => s.id === id)?.name ?? 'HQ'

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback style={{ backgroundColor: row.original.avatarColor, color: 'white' }}>
                {initials(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {row.original.name}
                {row.original.id === current?.id && (
                  <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge variant={ROLE_VARIANT[row.original.role]}>{ROLE_LABELS[row.original.role]}</Badge>
        ),
      },
      {
        id: 'store',
        header: 'Store',
        cell: ({ row }) => storeName(row.original.storeId),
      },
      {
        accessorKey: 'lastLogin',
        header: 'Last login',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.lastLogin ? formatRelative(row.original.lastLogin) : 'Never'}
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
        cell: ({ row }) => {
          const isSelf = row.original.id === current?.id
          return (
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
                  <DropdownMenuItem disabled={isSelf} onClick={() => setToggling(row.original)}>
                    <Power className="h-4 w-4" />
                    {row.original.status === 'active' ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={isSelf}
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleting(row.original)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stores, current],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage all system users and their roles."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Add User
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchKey="name"
          searchPlaceholder="Search users…"
          emptyState={<EmptyState icon={UserCog} title="No users" description="Add your first user." />}
        />
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        allowedRoles={['super_admin', 'admin', 'seller']}
      />

      <ConfirmDialog
        open={!!toggling}
        onOpenChange={(o) => !o && setToggling(null)}
        title={toggling?.status === 'active' ? 'Deactivate user?' : 'Activate user?'}
        description={
          toggling
            ? `${toggling.name} will ${toggling.status === 'active' ? 'lose' : 'regain'} access to the system.`
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
            toast.success('User updated successfully.')
            setToggling(null)
          }
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete user?"
        description={
          deleting ? (
            <>
              This permanently removes <strong>{deleting.name}</strong>&apos;s account.
            </>
          ) : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleting) {
            deleteUser(deleting.id, actor)
            toast.success('User deleted.')
            setDeleting(null)
          }
        }}
      />
    </div>
  )
}
