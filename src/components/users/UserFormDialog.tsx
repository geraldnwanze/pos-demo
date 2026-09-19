import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/lib/rbac'
import type { Role, User } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(7, 'Enter a valid phone'),
  role: z.enum(['super_admin', 'admin', 'seller']),
  storeId: z.string(),
  status: z.enum(['active', 'inactive']),
})
type FormValues = z.infer<typeof schema>

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User
  allowedRoles: Role[]
  title?: string
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  allowedRoles,
  title,
}: UserFormDialogProps) {
  const { actor } = useAuth()
  const stores = useDataStore((s) => s.stores)
  const addUser = useDataStore((s) => s.addUser)
  const updateUser = useDataStore((s) => s.updateUser)
  const isEdit = !!user

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
      name: '',
      email: '',
      phone: '',
      role: allowedRoles[0],
      storeId: 'none',
      status: 'active',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        role: user?.role ?? allowedRoles[0],
        storeId: user?.storeId ?? 'none',
        status: user?.status ?? 'active',
      })
    }
  }, [open, user, reset, allowedRoles])

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      storeId: values.storeId === 'none' ? null : values.storeId,
    }
    if (isEdit && user) {
      updateUser(user.id, payload, actor)
      toast.success('User updated successfully.')
    } else {
      addUser(payload, actor)
      toast.success('User created successfully.')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title ?? (isEdit ? 'Edit user' : 'Add user')}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the account details.' : 'Create a new team member account.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input placeholder="e.g. Tunde Bakare" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="name@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="+234…" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={watch('role')}
                onValueChange={(v) => setValue('role', v as Role)}
                disabled={allowedRoles.length === 1}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned store</Label>
              <Select value={watch('storeId')} onValueChange={(v) => setValue('storeId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No store (HQ)</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Active</Label>
              <p className="text-xs text-muted-foreground">Inactive users cannot log in.</p>
            </div>
            <Switch
              checked={watch('status') === 'active'}
              onCheckedChange={(c) => setValue('status', c ? 'active' : 'inactive')}
            />
          </div>
          {!isEdit && (
            <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Demo accounts use the password <span className="font-mono font-medium">password</span>.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? 'Save changes' : 'Create user'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
