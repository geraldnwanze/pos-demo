import { useEffect, useMemo, useState } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/format'
import type { Sale } from '@/types'

interface RefundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: Sale
}

export function RefundDialog({ open, onOpenChange, sale }: RefundDialogProps) {
  const { actor } = useAuth()
  const refundSale = useDataStore((s) => s.refundSale)
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')
  const [confirming, setConfirming] = useState(false)

  const refundable = useMemo(
    () =>
      sale.items
        .map((i) => ({ ...i, remaining: i.quantity - (i.refundedQty ?? 0) }))
        .filter((i) => i.remaining > 0),
    [sale],
  )

  useEffect(() => {
    if (open) {
      setSelected({})
      setReason('')
      setConfirming(false)
    }
  }, [open])

  const refundTotal = refundable.reduce(
    (sum, i) => sum + (selected[i.productId] ?? 0) * i.unitPrice,
    0,
  )
  const anySelected = Object.values(selected).some((q) => q > 0)

  const submit = () => {
    if (!anySelected) {
      toast.error('Select at least one item to refund.')
      return
    }
    if (!reason.trim()) {
      toast.error('Please enter a refund reason.')
      return
    }
    if (!confirming) {
      setConfirming(true)
      return
    }
    refundSale({
      saleId: sale.id,
      items: Object.entries(selected)
        .filter(([, q]) => q > 0)
        .map(([productId, quantity]) => ({ productId, quantity })),
      reason,
      userId: actor.id,
      userName: actor.name,
    })
    toast.success('Transaction refunded successfully.')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund transaction</DialogTitle>
          <DialogDescription>
            Select the items and quantities to refund for {sale.reference}. Refunded stock returns
            to inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {refundable.map((item) => {
            const qty = selected[item.productId] ?? 0
            return (
              <div key={item.productId} className="flex items-center gap-3 rounded-md border p-3">
                <Checkbox
                  checked={qty > 0}
                  onCheckedChange={(c) =>
                    setSelected((prev) => ({
                      ...prev,
                      [item.productId]: c ? item.remaining : 0,
                    }))
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.unitPrice)} · {item.remaining} refundable
                  </p>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={item.remaining}
                  value={qty || ''}
                  onChange={(e) =>
                    setSelected((prev) => ({
                      ...prev,
                      [item.productId]: Math.min(item.remaining, Math.max(0, Number(e.target.value))),
                    }))
                  }
                  className="w-20"
                />
              </div>
            )
          })}
        </div>

        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer returned damaged items"
          />
        </div>

        <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
          <span className="text-sm text-muted-foreground">Refund amount</span>
          <span className="text-lg font-bold">{formatCurrency(refundTotal)}</span>
        </div>

        {confirming && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Confirm the refund — click again to process.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={!anySelected}>
            {confirming ? 'Confirm refund' : 'Process refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
