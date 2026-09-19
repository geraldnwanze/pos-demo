import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { TableSkeleton, EmptyState } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDataStore } from '@/stores/dataStore'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { formatDateTime } from '@/lib/format'
import type { AuditLog } from '@/types'

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function AuditLogs() {
  const loading = useSimulatedLoading()
  const logs = useDataStore((s) => s.auditLogs)
  const [entityFilter, setEntityFilter] = useState('all')

  const entities = useMemo(() => Array.from(new Set(logs.map((l) => l.entity))), [logs])
  const filtered = useMemo(
    () => (entityFilter === 'all' ? logs : logs.filter((l) => l.entity === entityFilter)),
    [logs, entityFilter],
  )

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        accessorKey: 'userName',
        header: 'User',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-[10px]">{initials(row.original.userName)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{row.original.userName}</span>
          </div>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono text-[10px]">
            {row.original.action}
          </Badge>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span className="text-sm">
            <span className="font-medium">{row.original.userName}</span>{' '}
            {row.original.description}
          </span>
        ),
      },
      {
        accessorKey: 'entity',
        header: 'Entity',
        cell: ({ row }) => <Badge variant="outline">{row.original.entity}</Badge>,
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP Address',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.ipAddress}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="A record of all key actions across the system." />

      {loading ? (
        <TableSkeleton rows={10} cols={5} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchKey="description"
          searchPlaceholder="Search activity…"
          pageSize={15}
          toolbar={
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {entities.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          emptyState={
            <EmptyState icon={ShieldCheck} title="No audit logs" description="Activity will appear here." />
          }
        />
      )}
    </div>
  )
}
