import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'

const MAP: Record<string, { label: string; variant: Variant }> = {
  // generic
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  // sales
  completed: { label: 'Completed', variant: 'success' },
  refunded: { label: 'Refunded', variant: 'destructive' },
  partially_refunded: { label: 'Partial Refund', variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
  // purchases
  draft: { label: 'Draft', variant: 'secondary' },
  ordered: { label: 'Ordered', variant: 'warning' },
  received: { label: 'Received', variant: 'success' },
  // stock
  in_stock: { label: 'In Stock', variant: 'success' },
  low_stock: { label: 'Low Stock', variant: 'warning' },
  out_of_stock: { label: 'Out of Stock', variant: 'destructive' },
}

interface StatusBadgeProps {
  status: string
  className?: string
  withDot?: boolean
}

const DOT_COLORS: Record<Variant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  secondary: 'bg-muted-foreground',
  default: 'bg-primary',
  outline: 'bg-muted-foreground',
}

export function StatusBadge({ status, className, withDot = true }: StatusBadgeProps) {
  const config = MAP[status] ?? { label: status, variant: 'secondary' as Variant }
  return (
    <Badge variant={config.variant} className={cn('gap-1.5', className)}>
      {withDot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT_COLORS[config.variant])} />}
      {config.label}
    </Badge>
  )
}

export function stockStatus(stock: number, minStock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (stock <= 0) return 'out_of_stock'
  if (stock <= minStock) return 'low_stock'
  return 'in_stock'
}
