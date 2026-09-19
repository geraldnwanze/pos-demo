import { NavLink } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { NAV_GROUPS } from '@/config/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDataStore } from '@/stores/dataStore'
import { cn } from '@/lib/utils'

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { hasPermission } = useAuth()
  const businessName = useDataStore((s) => s.businessSettings.name)
  const logo = useDataStore((s) => s.businessSettings.logo)

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg text-primary-foreground">
          {logo || <ShoppingBag className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{businessName}</p>
          <p className="text-[11px] text-sidebar-foreground/60">POS &amp; Inventory</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => hasPermission(item.permission))
          if (items.length === 0) return null
          return (
            <div key={group.label}>
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-lg bg-sidebar-accent/60 p-3 text-xs text-sidebar-foreground/70">
          <p className="font-semibold text-sidebar-foreground">Demo environment</p>
          <p className="mt-0.5">All data is mock and stored locally in your browser.</p>
        </div>
      </div>
    </div>
  )
}
