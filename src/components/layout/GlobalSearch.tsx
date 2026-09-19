import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Contact, Receipt, Users, Search, CornerDownLeft } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useUiStore } from '@/stores/uiStore'
import { useDataStore } from '@/stores/dataStore'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

interface Result {
  id: string
  group: string
  icon: typeof Package
  title: string
  subtitle: string
  to: string
}

export function GlobalSearch() {
  const open = useUiStore((s) => s.commandOpen)
  const setOpen = useUiStore((s) => s.setCommandOpen)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const { hasPermission } = useAuth()

  const products = useDataStore((s) => s.products)
  const customers = useDataStore((s) => s.customers)
  const sales = useDataStore((s) => s.sales)
  const users = useDataStore((s) => s.users)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, setOpen])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActive(0)
    }
  }, [open])

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: Result[] = []

    if (hasPermission('products.view')) {
      for (const p of products) {
        if (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) {
          out.push({
            id: p.id,
            group: 'Products',
            icon: Package,
            title: p.name,
            subtitle: `${p.sku} · ${formatCurrency(p.sellingPrice)}`,
            to: `/products/${p.id}`,
          })
        }
        if (out.length > 20) break
      }
    }
    if (hasPermission('customers.view')) {
      for (const c of customers) {
        if (c.name.toLowerCase().includes(q) || c.phone.includes(q)) {
          out.push({
            id: c.id,
            group: 'Customers',
            icon: Contact,
            title: c.name,
            subtitle: c.phone,
            to: `/customers/${c.id}`,
          })
        }
      }
    }
    if (hasPermission('sales.view')) {
      for (const s of sales) {
        if (s.reference.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q)) {
          out.push({
            id: s.id,
            group: 'Transactions',
            icon: Receipt,
            title: s.reference,
            subtitle: `${s.customerName} · ${formatCurrency(s.total)}`,
            to: `/sales/${s.id}`,
          })
        }
        if (out.length > 40) break
      }
    }
    if (hasPermission('sellers.manage')) {
      for (const u of users) {
        if (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
          out.push({
            id: u.id,
            group: 'Team',
            icon: Users,
            title: u.name,
            subtitle: u.email,
            to: u.role === 'seller' ? '/sellers' : '/users',
          })
        }
      }
    }
    return out.slice(0, 24)
  }, [query, products, customers, sales, users, hasPermission])

  const grouped = useMemo(() => {
    const map = new Map<string, Result[]>()
    results.forEach((r) => {
      const arr = map.get(r.group) ?? []
      arr.push(r)
      map.set(r.group, arr)
    })
    return Array.from(map.entries())
  }, [results])

  const select = (r: Result) => {
    navigate(r.to)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent hideClose className="max-w-xl gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, results.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === 'Enter' && results[active]) {
                select(results[active])
              }
            }}
            placeholder="Search products, customers, transactions…"
            className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
            ESC
          </kbd>
        </div>
        <div className="max-h-[22rem] overflow-y-auto p-2">
          {query.trim() === '' ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Type to search across your business.
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results for &quot;{query}&quot;.
            </p>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="mb-2">
                <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </p>
                {items.map((r) => {
                  const index = results.indexOf(r)
                  return (
                    <button
                      key={r.id}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => select(r)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm',
                        index === active ? 'bg-accent' : 'hover:bg-accent/60',
                      )}
                    >
                      <r.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{r.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {r.subtitle}
                        </span>
                      </span>
                      {index === active && (
                        <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
