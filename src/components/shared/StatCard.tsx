import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  iconClassName?: string
  trend?: { value: number; label?: string }
  hint?: string
}

export function StatCard({ title, value, icon: Icon, iconClassName, trend, hint }: StatCardProps) {
  const positive = (trend?.value ?? 0) >= 0
  return (
    <Card className="min-w-0">
      <CardContent className="p-4 sm:p-5">
        {/* Title + icon share a row; the value gets the full card width below */}
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-sm font-medium leading-snug text-muted-foreground">{title}</p>
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10',
              iconClassName,
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
        <p className="mt-1.5 break-words text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
        {(trend || hint) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs">
            {trend && (
              <span
                className={cn(
                  'flex items-center gap-0.5 font-medium',
                  positive ? 'text-success' : 'text-destructive',
                )}
              >
                {positive ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {Math.abs(trend.value)}%
              </span>
            )}
            {(trend?.label || hint) && (
              <span className="text-muted-foreground">{trend?.label ?? hint}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
