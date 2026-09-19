import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/format'

export interface DonutSlice {
  label: string
  value: number
}

const PALETTE = ['#2563eb', '#7c3aed', '#059669', '#ea580c', '#0891b2', '#db2777']

interface DonutChartProps {
  data: DonutSlice[]
  height?: number
  currency?: boolean
}

export function DonutChart({ data, height = 240, currency = true }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const filtered = data.filter((d) => d.value > 0)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filtered.length ? filtered : [{ label: 'No data', value: 1 }]}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={filtered.length > 1 ? 2 : 0}
              stroke="none"
            >
              {(filtered.length ? filtered : [{ label: 'No data', value: 1 }]).map((_, i) => (
                <Cell key={i} fill={filtered.length ? PALETTE[i % PALETTE.length] : 'hsl(var(--muted))'} />
              ))}
            </Pie>
            {filtered.length > 0 && (
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--popover))',
                  fontSize: 12,
                }}
                formatter={(value, name) => [
                  currency ? formatCurrency(Number(value)) : value,
                  name,
                ]}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-lg font-bold">
            {currency ? formatCurrency(total, { decimals: false }) : total}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              />
              {d.label}
            </span>
            <span className="font-medium">
              {currency ? formatCurrency(d.value, { decimals: false }) : d.value}
              <span className="ml-1 text-xs text-muted-foreground">
                ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
