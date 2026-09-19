import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { GlobalSearch } from './GlobalSearch'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </aside>
      <div className="flex min-h-screen w-full flex-col lg:pl-64">
        <Header />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <GlobalSearch />
    </div>
  )
}
