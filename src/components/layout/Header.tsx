import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Moon, Sun, LogOut, User as UserIcon, ChevronRight, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { NotificationBell } from './NotificationBell'
import { Sidebar } from './Sidebar'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_LABELS } from '@/lib/rbac'
import { BREADCRUMB_LABELS } from '@/config/breadcrumbs'
import { useState } from 'react'

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Header() {
  const { user } = useAuth()
  const logout = useAuthStore((s) => s.logout)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/')
    const label =
      BREADCRUMB_LABELS[seg] ??
      (seg.length > 12 ? seg.slice(0, 8) + '…' : seg.charAt(0).toUpperCase() + seg.slice(1))
    return { path, label }
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:px-6">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0" hideClose>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Breadcrumbs */}
      <nav className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
        {crumbs.map((c, i) => (
          <span key={c.path} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            {i === crumbs.length - 1 ? (
              <span className="font-medium">{c.label}</span>
            ) : (
              <Link to={c.path} className="text-muted-foreground hover:text-foreground">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCommandOpen(true)}
          className="hidden gap-2 text-muted-foreground sm:flex"
        >
          <Search className="h-4 w-4" />
          <span className="hidden md:inline">Search…</span>
          <kbd className="hidden rounded border bg-muted px-1.5 text-[10px] font-medium md:inline">
            ⌘K
          </kbd>
        </Button>
        <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setCommandOpen(true)}>
          <Search className="h-5 w-5" />
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar>
                <AvatarFallback style={{ backgroundColor: user?.avatarColor, color: 'white' }}>
                  {user ? initials(user.name) : '?'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                <span className="mt-1 w-fit rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {user ? ROLE_LABELS[user.role] : ''}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
              <UserIcon className="h-4 w-4" /> My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
