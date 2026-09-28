import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { GlobalSearch } from './GlobalSearch'
import { useDataStore } from '@/stores/dataStore'

export function AppLayout() {
  // Money is formatted during render; remount the page when the business
  // currency changes so every figure redraws in the new currency.
  const currency = useDataStore((s) => s.businessSettings.currency)
  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar />
      </aside>
      <div className="flex min-h-screen w-full min-w-0 flex-col lg:pl-64">
        <Header />
        <main key={currency} className="min-w-0 flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <GlobalSearch />
    </div>
  )
}
