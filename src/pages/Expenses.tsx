import { useEffect, useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, MoreHorizontal, Pencil, Trash2, Wallet, Receipt, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatCard } from '@/components/shared/StatCard'
import { TableSkeleton, CardsSkeleton, EmptyState } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { formatCurrency, formatDate } from '@/lib/format'
import { expensesInRange } from '@/lib/analytics'
import { startOfMonth } from 'date-fns'
import type { Expense, ExpenseCategory, PaymentMethod } from '@/types'

const CATEGORIES: ExpenseCategory[] = [
  'Rent',
  'Utilities',
  'Salaries',
  'Transport',
  'Marketing',
  'Maintenance',
  'Other',
]

const schema = z.object({
  title: z.string().min(2, 'Title is required'),
  category: z.enum(['Rent', 'Utilities', 'Salaries', 'Transport', 'Marketing', 'Maintenance', 'Other']),
  amount: z.coerce.number().positive('Enter an amount'),
  paymentMethod: z.enum(['cash', 'card', 'transfer']),
  date: z.string().min(1, 'Select a date'),
  storeId: z.string(),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function Expenses() {
  const loading = useSimulatedLoading()
  const { actor } = useAuth()
  const expenses = useDataStore((s) => s.expenses)
  const stores = useDataStore((s) => s.stores)
  const users = useDataStore((s) => s.users)
  const addExpense = useDataStore((s) => s.addExpense)
  const updateExpense = useDataStore((s) => s.updateExpense)
  const deleteExpense = useDataStore((s) => s.deleteExpense)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | undefined>()
  const [deleting, setDeleting] = useState<Expense | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('all')

  const summary = useMemo(() => {
    const total = expenses.reduce((s, e) => s + e.amount, 0)
    const thisMonth = expensesInRange(expenses, startOfMonth(new Date()), new Date()).reduce(
      (s, e) => s + e.amount,
      0,
    )
    return { total, thisMonth, count: expenses.length }
  }, [expenses])

  const filtered = useMemo(
    () => expenses.filter((e) => (categoryFilter === 'all' ? true : e.category === categoryFilter)),
    [expenses, categoryFilter],
  )

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? '—'

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      category: 'Other',
      amount: 0,
      paymentMethod: 'cash',
      date: new Date().toISOString().slice(0, 10),
      storeId: stores[0]?.id ?? '',
      notes: '',
    },
  })

  useEffect(() => {
    if (formOpen) {
      reset({
        title: editing?.title ?? '',
        category: editing?.category ?? 'Other',
        amount: editing?.amount ?? 0,
        paymentMethod: editing?.paymentMethod ?? 'cash',
        date: editing ? editing.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        storeId: editing?.storeId ?? stores[0]?.id ?? '',
        notes: editing?.notes ?? '',
      })
    }
  }, [formOpen, editing, reset, stores])

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      notes: values.notes ?? '',
      date: new Date(values.date).toISOString(),
      addedBy: actor.id,
    }
    if (editing) {
      updateExpense(editing.id, payload, actor)
      toast.success('Expense updated successfully.')
    } else {
      addExpense(payload, actor)
      toast.success('Expense added successfully.')
    }
    setFormOpen(false)
  }

  const columns = useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Expense',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.title}</p>
            <p className="text-xs text-muted-foreground">{row.original.reference}</p>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => <Badge variant="secondary">{row.original.category}</Badge>,
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.amount)}</span>,
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Payment',
        cell: ({ row }) => (
          <span className="capitalize">
            {row.original.paymentMethod === 'card' ? 'POS/Card' : row.original.paymentMethod}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.date)}</span>
        ),
      },
      {
        id: 'by',
        header: 'Added by',
        cell: ({ row }) => <span className="text-sm">{userName(row.original.addedBy)}</span>,
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
        title="Expenses"
        description="Track your business spending."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        }
      />

      {loading ? (
        <CardsSkeleton count={3} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total expenses"
            value={formatCurrency(summary.total, { decimals: false })}
            icon={Wallet}
            iconClassName="bg-rose-100 text-rose-700"
          />
          <StatCard
            title="This month"
            value={formatCurrency(summary.thisMonth, { decimals: false })}
            icon={Calendar}
            iconClassName="bg-amber-100 text-amber-700"
          />
          <StatCard title="Records" value={String(summary.count)} icon={Receipt} />
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchKey="title"
          searchPlaceholder="Search expenses…"
          toolbar={
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          emptyState={<EmptyState icon={Wallet} title="No expenses" description="Add your first expense." />}
        />
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit expense' : 'Add expense'}</DialogTitle>
            <DialogDescription>Record a business expense.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="e.g. Generator diesel" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={watch('category')} onValueChange={(v) => setValue('category', v as ExpenseCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (₦)</Label>
                <Input type="number" step="0.01" {...register('amount')} />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Payment method</Label>
                <Select
                  value={watch('paymentMethod')}
                  onValueChange={(v) => setValue('paymentMethod', v as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">POS / Card</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" {...register('date')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Store</Label>
              <Select value={watch('storeId')} onValueChange={(v) => setValue('storeId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea {...register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? 'Save changes' : 'Add expense'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete expense?"
        description={deleting ? <>Delete <strong>{deleting.title}</strong>?</> : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleting) {
            deleteExpense(deleting.id, actor)
            toast.success('Expense deleted.')
            setDeleting(null)
          }
        }}
      />
    </div>
  )
}
