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
import { Textarea } from '@/components/ui/textarea'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import type { Customer } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email').or(z.literal('')),
  address: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface CustomerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer
  onSuccess?: (customer: Customer) => void
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerFormDialogProps) {
  const { actor } = useAuth()
  const addCustomer = useDataStore((s) => s.addCustomer)
  const updateCustomer = useDataStore((s) => s.updateCustomer)
  const isEdit = !!customer

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', email: '', address: '' },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: customer?.name ?? '',
        phone: customer?.phone ?? '',
        email: customer?.email ?? '',
        address: customer?.address ?? '',
      })
    }
  }, [open, customer, reset])

  const onSubmit = (values: FormValues) => {
    if (isEdit && customer) {
      updateCustomer(customer.id, { ...values, address: values.address ?? '' }, actor)
      toast.success('Customer updated successfully.')
      onOpenChange(false)
    } else {
      const created = addCustomer(
        { ...values, address: values.address ?? '', status: 'active' },
        actor,
      )
      toast.success('Customer added successfully.')
      onSuccess?.(created)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit customer' : 'Add new customer'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update this customer’s details.' : 'Create a customer profile for this sale.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Full name</Label>
            <Input id="c-name" placeholder="e.g. Adaeze Uche" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Phone</Label>
              <Input id="c-phone" placeholder="+234…" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" placeholder="optional" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-address">Address</Label>
            <Textarea id="c-address" placeholder="optional" {...register('address')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Add customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
