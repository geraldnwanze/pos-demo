import { useRef } from 'react'
import { CheckCircle2, Download, Plus, Printer } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Receipt } from '@/components/pos/Receipt'
import { useDataStore } from '@/stores/dataStore'
import { formatCurrency } from '@/lib/format'
import type { Sale } from '@/types'

interface ReceiptDialogProps {
  sale: Sale | null
  onOpenChange: (open: boolean) => void
  /** `success` shows the "Sale completed" banner and a New Sale button. */
  variant?: 'success' | 'view'
}

/**
 * Receipt modal shared by the POS and the transaction details page.
 * Layout: fixed header, scrollable receipt, fixed action footer — so the
 * receipt is always reachable regardless of screen height.
 */
export function ReceiptDialog({ sale, onOpenChange, variant = 'view' }: ReceiptDialogProps) {
  const business = useDataStore((s) => s.businessSettings)
  const footer = useDataStore((s) => s.posSettings.receiptFooter)
  const seller = useDataStore((s) => s.users.find((u) => u.id === sale?.sellerId))
  const receiptRef = useRef<HTMLDivElement>(null)

  const handleDownload = () => {
    if (!receiptRef.current || !sale) return
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${sale.reference}</title><script src="https://cdn.tailwindcss.com"></script></head><body style="font-family:ui-sans-serif,system-ui">${receiptRef.current.outerHTML}</body></html>`
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${sale.reference}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Receipt downloaded.')
  }

  return (
    <Dialog open={!!sale} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose={variant === 'success'}
        className="flex max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-md flex-col gap-0 overflow-hidden p-0"
      >
        {sale && (
          <>
            {variant === 'success' ? (
              <div className="no-print flex shrink-0 flex-col items-center gap-1.5 border-b bg-success/5 px-6 py-4 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <DialogTitle>Sale completed!</DialogTitle>
                <DialogDescription>
                  {sale.reference} · {formatCurrency(sale.total)}
                </DialogDescription>
              </div>
            ) : (
              <DialogHeader className="no-print shrink-0 border-b p-4 pr-10">
                <DialogTitle>Receipt</DialogTitle>
                <DialogDescription className="sr-only">
                  Receipt for {sale.reference}
                </DialogDescription>
              </DialogHeader>
            )}

            <div className="print-visible min-h-0 flex-1 overflow-y-auto bg-muted/30 p-4">
              <Receipt
                ref={receiptRef}
                sale={sale}
                business={business}
                seller={seller}
                footer={footer}
              />
            </div>

            <div className="no-print flex shrink-0 flex-wrap gap-2 border-t p-4">
              <Button variant="outline" className="min-w-0 flex-1" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button
                variant={variant === 'success' ? 'outline' : 'default'}
                className="min-w-0 flex-1"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" /> Download
              </Button>
              {variant === 'success' && (
                <Button className="w-full sm:w-auto sm:flex-1" onClick={() => onOpenChange(false)}>
                  <Plus className="h-4 w-4" /> New Sale
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
