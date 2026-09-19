import { Bell, Check, Package, Receipt, ShoppingCart, Boxes, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDataStore } from '@/stores/dataStore'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/types'

const ICONS = {
  stock: Package,
  sale: ShoppingCart,
  inventory: Boxes,
  purchase: Receipt,
  system: Info,
}

const COLORS = {
  stock: 'bg-amber-100 text-amber-700',
  sale: 'bg-emerald-100 text-emerald-700',
  inventory: 'bg-blue-100 text-blue-700',
  purchase: 'bg-violet-100 text-violet-700',
  system: 'bg-slate-100 text-slate-700',
}

export function NotificationBell() {
  const notifications = useDataStore((s) => s.notifications)
  const markRead = useDataStore((s) => s.markNotificationRead)
  const markAllRead = useDataStore((s) => s.markAllNotificationsRead)
  const unread = notifications.filter((n) => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Check className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </div>
          ) : (
            notifications.slice(0, 12).map((n: AppNotification) => {
              const Icon = ICONS[n.type]
              return (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent',
                    !n.read && 'bg-primary/5',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      COLORS[n.type],
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{n.title}</span>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                      {n.message}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-foreground/70">
                      {formatRelative(n.createdAt)}
                    </span>
                  </span>
                </button>
              )
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
