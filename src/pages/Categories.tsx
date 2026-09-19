import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Pencil, Trash2, Tags } from 'lucide-react'
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
import { formatDate } from '@/lib/format'
import type { Category } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})
type FormValues = z.infer<typeof schema>

export default function Categories() {
  const loading = useSimulatedLoading()
  const { actor } = useAuth()
  const categories = useDataStore((s) => s.categories)
  const products = useDataStore((s) => s.products)
  const addCategory = useDataStore((s) => s.addCategory)
  const updateCategory = useDataStore((s) => s.updateCategory)
  const deleteCategory = useDataStore((s) => s.deleteCategory)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | undefined>()
  const [deleting, setDeleting] = useState<Category | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', status: 'active' },
  })

  useEffect(() => {
    if (formOpen) {
      reset({
        name: editing?.name ?? '',
        description: editing?.description ?? '',
        status: editing?.status ?? 'active',
      })
    }
  }, [formOpen, editing, reset])

  const productCount = (catId: string) => products.filter((p) => p.categoryId === catId).length

  const onSubmit = (values: FormValues) => {
    if (editing) {
      updateCategory(editing.id, { ...values, description: values.description ?? '' }, actor)
      toast.success('Category updated successfully.')
    } else {
      addCategory({ ...values, description: values.description ?? '' }, actor)
      toast.success('Category created successfully.')
    }
    setFormOpen(false)
  }

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Category',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{row.original.description}</p>
          </div>
        ),
      },
      {
        id: 'count',
        header: 'Products',
        cell: ({ row }) => (
          <span className="font-medium">{productCount(row.original.id)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
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
        title="Categories"
        description="Organize your products into categories."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          searchKey="name"
          searchPlaceholder="Search categories…"
          emptyState={
            <EmptyState icon={Tags} title="No categories yet" description="Create your first category." />
          }
        />
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit category' : 'Add category'}</DialogTitle>
            <DialogDescription>Categories group related products together.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="e.g. Beverages" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="optional" {...register('description')} />
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
              <Button type="submit">{editing ? 'Save changes' : 'Create category'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete category?"
        description={
          deleting ? (
            <>
              Delete <strong>{deleting.name}</strong>?{' '}
              {productCount(deleting.id) > 0 &&
                `${productCount(deleting.id)} product(s) are assigned to it.`}
            </>
          ) : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleting) {
            deleteCategory(deleting.id, actor)
            toast.success('Category deleted.')
            setDeleting(null)
          }
        }}
      />
    </div>
  )
}
