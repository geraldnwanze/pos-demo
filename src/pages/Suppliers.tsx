import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Pencil, Trash2, Truck } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { TableSkeleton, EmptyState } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import type { Supplier } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  contactPerson: z.string().min(2, 'Contact person is required'),
  phone: z.string().min(7, 'Enter a valid phone'),
  email: z.string().email('Enter a valid email').or(z.literal('')),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})
type FormValues = z.infer<typeof schema>

export default function Suppliers() {
  const loading = useSimulatedLoading()
  const { actor } = useAuth()
  const suppliers = useDataStore((s) => s.suppliers)
  const products = useDataStore((s) => s.products)
  const addSupplier = useDataStore((s) => s.addSupplier)
  const updateSupplier = useDataStore((s) => s.updateSupplier)
  const deleteSupplier = useDataStore((s) => s.deleteSupplier)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | undefined>()
  const [deleting, setDeleting] = useState<Supplier | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', contactPerson: '', phone: '', email: '', address: '', status: 'active' },
  })

  useEffect(() => {
    if (formOpen) {
      reset({
        name: editing?.name ?? '',
        contactPerson: editing?.contactPerson ?? '',
        phone: editing?.phone ?? '',
        email: editing?.email ?? '',
        address: editing?.address ?? '',
        status: editing?.status ?? 'active',
      })
    }
  }, [formOpen, editing, reset])

  const productCount = (id: string) => products.filter((p) => p.supplierId === id).length

  const onSubmit = (values: FormValues) => {
    const payload = { ...values, address: values.address ?? '' }
    if (editing) {
      updateSupplier(editing.id, payload, actor)
      toast.success('Supplier updated successfully.')
    } else {
      addSupplier(payload, actor)
      toast.success('Supplier added successfully.')
    }
    setFormOpen(false)
  }

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Supplier',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.contactPerson}</p>
          </div>
        ),
      },
      { accessorKey: 'phone', header: 'Phone' },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.email || '—'}</span>,
      },
      {
        id: 'products',
        header: 'Products',
        cell: ({ row }) => productCount(row.original.id),
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
    [products],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage the vendors that supply your products."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Add Supplier
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : (
        <DataTable
          columns={columns}
          data={suppliers}
          searchKey="name"
          searchPlaceholder="Search suppliers…"
          emptyState={<EmptyState icon={Truck} title="No suppliers yet" description="Add your first supplier." />}
        />
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit supplier' : 'Add supplier'}</DialogTitle>
            <DialogDescription>Vendor contact and account details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Company name</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Contact person</Label>
                <Input {...register('contactPerson')} />
                {errors.contactPerson && (
                  <p className="text-xs text-destructive">{errors.contactPerson.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Textarea {...register('address')} />
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
              <Button type="submit">{editing ? 'Save changes' : 'Add supplier'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete supplier?"
        description={deleting ? <>Delete <strong>{deleting.name}</strong>?</> : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleting) {
            deleteSupplier(deleting.id, actor)
            toast.success('Supplier deleted.')
            setDeleting(null)
          }
        }}
      />
    </div>
  )
}
