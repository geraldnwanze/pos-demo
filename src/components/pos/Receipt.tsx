import { forwardRef } from 'react'
import type { BusinessSettings, Sale, User } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/format'

interface ReceiptProps {
  sale: Sale
  business: BusinessSettings
  seller?: User
  footer: string
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'POS / Card',
  transfer: 'Bank Transfer',
}

/** Print-friendly receipt. Rendered inside #receipt-print for the print stylesheet. */
export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, business, seller, footer }, ref) => {
    return (
      <div ref={ref} id="receipt-print" className="mx-auto max-w-xs bg-white p-5 text-slate-900">
        <div className="text-center">
          <div className="text-2xl">{business.logo}</div>
          <h2 className="text-base font-bold uppercase tracking-wide">{business.name}</h2>
          <p className="text-[11px] leading-tight text-slate-600">{business.address}</p>
          <p className="text-[11px] text-slate-600">{business.phone}</p>
          {business.taxNumber && (
            <p className="text-[11px] text-slate-600">TIN: {business.taxNumber}</p>
          )}
        </div>

        <div className="my-3 border-t border-dashed border-slate-300" />

        <div className="space-y-0.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Receipt No.</span>
            <span className="font-medium">{sale.reference}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date</span>
            <span>{formatDateTime(sale.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Served by</span>
            <span>{seller?.name ?? 'Seller'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Customer</span>
            <span>{sale.customerName}</span>
          </div>
        </div>

        <div className="my-3 border-t border-dashed border-slate-300" />

        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-1 font-medium">Item</th>
              <th className="pb-1 text-center font-medium">Qty</th>
              <th className="pb-1 text-right font-medium">Price</th>
              <th className="pb-1 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item) => (
              <tr key={item.productId} className="align-top">
                <td className="py-1 pr-1">{item.name}</td>
                <td className="py-1 text-center">{item.quantity}</td>
                <td className="py-1 text-right">{formatCurrency(item.unitPrice, { decimals: false })}</td>
                <td className="py-1 text-right">
                  {formatCurrency(item.unitPrice * item.quantity, { decimals: false })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="my-3 border-t border-dashed border-slate-300" />

        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount</span>
              <span>-{formatCurrency(sale.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Tax</span>
            <span>{formatCurrency(sale.tax)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-slate-300 pt-1 text-sm font-bold">
            <span>Total</span>
            <span>{formatCurrency(sale.total)}</span>
          </div>
        </div>

        <div className="my-3 border-t border-dashed border-slate-300" />

        <div className="space-y-0.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Payment</span>
            <span>{PAYMENT_LABELS[sale.paymentMethod]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount paid</span>
            <span>{formatCurrency(sale.amountPaid)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Change</span>
            <span>{formatCurrency(sale.change)}</span>
          </div>
        </div>

        <div className="my-3 border-t border-dashed border-slate-300" />

        <p className="text-center text-[11px] font-medium text-slate-700">{footer}</p>
        <p className="mt-1 text-center text-[10px] text-slate-400">Powered by RetailPro</p>
      </div>
    )
  },
)
Receipt.displayName = 'Receipt'
