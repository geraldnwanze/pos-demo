import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Pencil, Trash2, Store as StoreIcon } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { TableSkeleton, EmptyState } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import type { Store } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(2, 'Code is required'),
  address: z.string().min(2, 'Address is required'),
  phone: z.string().min(7, 'Enter a valid phone'),
  managerId: z.string(),
  status: z.enum(['active', 'inactive']),
})
type FormValues = z.infer<typeof schema>

export default function Stores() {
  const loading = useSimulatedLoading()
  const { actor } = useAuth()
  const stores = useDataStore((s) => s.stores)
  const users = useDataStore((s) => s.users)
  const addStore = useDataStore((s) => s.addStore)
  const updateStore = useDataStore((s) => s.updateStore)
  const deleteStore = useDataStore((s) => s.deleteStore)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Store | undefined>()
  const [deleting, setDeleting] = useState<Store | null>(null)

  const managers = users.filter((u) => u.role === 'admin' || u.role === 'super_admin')
  const staffCount = (storeId: string) => users.filter((u) => u.storeId === storeId).length
  const managerName = (id: string | null) => users.find((u) => u.id === id)?.name ?? '—'

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', code: '', address: '', phone: '', managerId: 'none', status: 'active' },
  })

  useEffect(() => {
    if (formOpen) {
      reset({
        name: editing?.name ?? '',
        code: editing?.code ?? '',
        address: editing?.address ?? '',
        phone: editing?.phone ?? '',
        managerId: editing?.managerId ?? 'none',
        status: editing?.status ?? 'active',
      })
    }
  }, [formOpen, editing, reset])

  const onSubmit = (values: FormValues) => {
    const payload = { ...values, managerId: values.managerId === 'none' ? null : values.managerId }
    if (editing) {
      updateStore(editing.id, payload, actor)
      toast.success('Store updated successfully.')
    } else {
      addStore(payload, actor)
      toast.success('Store created successfully.')
    }
    setFormOpen(false)
  }

  const columns = useMemo<ColumnDef<Store>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Store',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <StoreIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <Badge variant="outline" className="mt-0.5">
                {row.original.code}
              </Badge>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'address',
        header: 'Address',
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-[220px] text-sm text-muted-foreground">
            {row.original.address}
          </span>
        ),
      },
      { accessorKey: 'phone', header: 'Phone' },
      {
        id: 'manager',
        header: 'Manager',
        cell: ({ row }) => managerName(row.original.managerId),
      },
      {
        id: 'staff',
        header: 'Staff',
        cell: ({ row }) => staffCount(row.original.id),
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
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleting(row.original)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stores"
        description="Manage your branches and locations."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Add Store
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton rows={4} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          data={stores}
          searchKey="name"
          searchPlaceholder="Search stores…"
          emptyState={<EmptyState icon={StoreIcon} title="No stores yet" description="Add your first branch." />}
        />
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit store' : 'Add store'}</DialogTitle>
            <DialogDescription>Branch details and manager assignment.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Store name</Label>
                <Input {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input {...register('code')} />
                {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea {...register('address')} />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Manager</Label>
                <Select value={watch('managerId')} onValueChange={(v) => setValue('managerId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <Label>Active</Label>
              <Switch
                checked={watch('status') === 'active'}
                onCheckedChange={(c) => setValue('status', c ? 'active' : 'inactive')}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? 'Save changes' : 'Create store'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete store?"
        description={deleting ? <>Delete <strong>{deleting.name}</strong>?</> : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleting) {
            deleteStore(deleting.id, actor)
            toast.success('Store deleted.')
            setDeleting(null)
          }
        }}
      />
    </div>
  )
}
