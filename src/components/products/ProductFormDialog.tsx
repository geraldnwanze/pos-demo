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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import type { Product } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'Select a category'),
  description: z.string().optional(),
  costPrice: z.coerce.number().min(0, 'Must be 0 or more'),
  sellingPrice: z.coerce.number().min(0, 'Must be 0 or more'),
  taxRate: z.coerce.number().min(0).max(100),
  minStock: z.coerce.number().int().min(0),
  stock: z.coerce.number().int().min(0),
  supplierId: z.string().optional(),
  image: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})

type FormValues = z.infer<typeof schema>

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
}

export function ProductFormDialog({ open, onOpenChange, product }: ProductFormDialogProps) {
  const { actor } = useAuth()
  const categories = useDataStore((s) => s.categories)
  const suppliers = useDataStore((s) => s.suppliers)
  const addProduct = useDataStore((s) => s.addProduct)
  const updateProduct = useDataStore((s) => s.updateProduct)
  const isEdit = !!product

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      categoryId: '',
      description: '',
      costPrice: 0,
      sellingPrice: 0,
      taxRate: 7.5,
      minStock: 10,
      stock: 0,
      supplierId: '',
      image: '📦',
      status: 'active',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name: product?.name ?? '',
        sku: product?.sku ?? '',
        barcode: product?.barcode ?? '',
        categoryId: product?.categoryId ?? '',
        description: product?.description ?? '',
        costPrice: product?.costPrice ?? 0,
        sellingPrice: product?.sellingPrice ?? 0,
        taxRate: product?.taxRate ?? 7.5,
        minStock: product?.minStock ?? 10,
        stock: product?.stock ?? 0,
        supplierId: product?.supplierId ?? '',
        image: product?.image ?? '📦',
        status: product?.status ?? 'active',
      })
    }
  }, [open, product, reset])

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      barcode: values.barcode ?? '',
      description: values.description ?? '',
      image: values.image || '📦',
      supplierId: values.supplierId || null,
    }
    if (isEdit && product) {
      // stock is managed via inventory adjustments, don't overwrite on edit
      const { stock: _stock, ...rest } = payload
      void _stock
      updateProduct(product.id, rest, actor)
      toast.success('Product updated successfully.')
    } else {
      addProduct(payload, actor)
      toast.success('Product created successfully.')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b p-4 pr-10 sm:p-6">
          <DialogTitle>{isEdit ? 'Edit product' : 'Add new product'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the product details below.'
              : 'Fill in the details to add a product to your catalog.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Product name</Label>
                <Input placeholder="e.g. Coca Cola 50cl" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input placeholder="e.g. BEV-0001" {...register('sku')} />
                {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Barcode</Label>
                <Input placeholder="optional" {...register('barcode')} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={watch('categoryId')}
                  onValueChange={(v) => setValue('categoryId', v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-xs text-destructive">{errors.categoryId.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <Select
                  value={watch('supplierId') || 'none'}
                  onValueChange={(v) => setValue('supplierId', v === 'none' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No supplier</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea placeholder="optional" {...register('description')} />
              </div>
              <div className="space-y-1.5">
                <Label>Cost price (₦)</Label>
                <Input type="number" step="0.01" {...register('costPrice')} />
                {errors.costPrice && (
                  <p className="text-xs text-destructive">{errors.costPrice.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Selling price (₦)</Label>
                <Input type="number" step="0.01" {...register('sellingPrice')} />
                {errors.sellingPrice && (
                  <p className="text-xs text-destructive">{errors.sellingPrice.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Tax rate (%)</Label>
                <Input type="number" step="0.1" {...register('taxRate')} />
              </div>
              <div className="space-y-1.5">
                <Label>Minimum stock</Label>
                <Input type="number" {...register('minStock')} />
              </div>
              <div className="space-y-1.5">
                <Label>{isEdit ? 'Current stock' : 'Initial stock'}</Label>
                <Input type="number" disabled={isEdit} {...register('stock')} />
                {isEdit && (
                  <p className="text-[11px] text-muted-foreground">
                    Adjust stock from the Inventory page.
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Icon / Emoji</Label>
                <Input maxLength={2} {...register('image')} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3 sm:col-span-2">
                <div>
                  <Label>Active status</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive products are hidden from the POS.
                  </p>
                </div>
                <Switch
                  checked={watch('status') === 'active'}
                  onCheckedChange={(c) => setValue('status', c ? 'active' : 'inactive')}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t p-4 sm:p-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Create product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
