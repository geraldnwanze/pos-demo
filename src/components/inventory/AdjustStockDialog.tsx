import { useEffect, useState } from 'react'
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
import { ProductImage } from '@/components/shared/ProductImage'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

type AdjustType = 'STOCK_IN' | 'SALE' | 'ADJUSTMENT'

const REASONS: Record<AdjustType, string[]> = {
  STOCK_IN: ['Restock', 'Supplier delivery', 'Return to stock', 'Transfer in'],
  SALE: ['Damaged', 'Expired', 'Theft / loss', 'Transfer out'],
  ADJUSTMENT: ['Stock count correction', 'Data entry fix', 'Other'],
}

interface AdjustStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
}

export function AdjustStockDialog({ open, onOpenChange, product }: AdjustStockDialogProps) {
  const { actor } = useAuth()
  const adjustStock = useDataStore((s) => s.adjustStock)
  const [type, setType] = useState<AdjustType>('STOCK_IN')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (open) {
      setType('STOCK_IN')
      setQuantity('')
      setReason('')
      setNote('')
      setConfirming(false)
    }
  }, [open])

  if (!product) return null

  const qty = Number(quantity)
  const signed = type === 'STOCK_IN' ? Math.abs(qty) : type === 'SALE' ? -Math.abs(qty) : qty
  const newStock = Math.max(0, product.stock + signed)
  const valid = quantity !== '' && qty !== 0 && !!reason && (type === 'ADJUSTMENT' || qty > 0)

  const submit = () => {
    if (!valid) {
      toast.error('Enter a quantity and select a reason.')
      return
    }
    if (!confirming) {
      setConfirming(true)
      return
    }
    adjustStock({
      productId: product.id,
      type,
      quantity: signed,
      reason,
      note,
      userId: actor.id,
      userName: actor.name,
    })
    toast.success('Inventory adjusted successfully.')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>Record a stock movement for this product.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <ProductImage name={product.name} image={product.image} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.sku}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="font-semibold">{product.stock}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['STOCK_IN', 'ADJUSTMENT', 'SALE'] as AdjustType[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t)
                setReason('')
                setConfirming(false)
              }}
              className={cn(
                'rounded-md border py-2 text-xs font-medium transition-colors',
                type === t ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent',
              )}
            >
              {t === 'STOCK_IN' ? 'Stock In' : t === 'SALE' ? 'Stock Out' : 'Adjustment'}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <Label>Quantity {type === 'ADJUSTMENT' && '(use negative to reduce)'}</Label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value)
              setConfirming(false)
            }}
            placeholder="e.g. 50"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger>
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {REASONS[type].map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Notes (optional)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Additional details…" />
        </div>

        {qty !== 0 && quantity !== '' && (
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">New stock level</span>
            <span className="font-semibold">
              {product.stock} → {newStock}
            </span>
          </div>
        )}

        {confirming && (
          <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
            Please confirm — click the button again to apply this adjustment.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid}>
            {confirming ? 'Confirm adjustment' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
