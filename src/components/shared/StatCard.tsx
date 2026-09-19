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
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary',
              iconClassName,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {(trend || hint) && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
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
