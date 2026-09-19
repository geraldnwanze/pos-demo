import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { homeForRole } from '@/lib/home'
import type { Permission } from '@/lib/rbac'
import Login from '@/pages/Login'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Pos = lazy(() => import('@/pages/Pos'))
const Products = lazy(() => import('@/pages/Products'))
const ProductDetails = lazy(() => import('@/pages/ProductDetails'))
const Categories = lazy(() => import('@/pages/Categories'))
const Inventory = lazy(() => import('@/pages/Inventory'))
const InventoryAlerts = lazy(() => import('@/pages/InventoryAlerts'))
const InventoryAdjustments = lazy(() => import('@/pages/InventoryAdjustments'))
const Sales = lazy(() => import('@/pages/Sales'))
const SaleDetails = lazy(() => import('@/pages/SaleDetails'))
const MySales = lazy(() => import('@/pages/MySales'))
const Customers = lazy(() => import('@/pages/Customers'))
const CustomerDetails = lazy(() => import('@/pages/CustomerDetails'))
const Sellers = lazy(() => import('@/pages/Sellers'))
const Purchases = lazy(() => import('@/pages/Purchases'))
const PurchaseDetails = lazy(() => import('@/pages/PurchaseDetails'))
const Suppliers = lazy(() => import('@/pages/Suppliers'))
const Expenses = lazy(() => import('@/pages/Expenses'))
const Reports = lazy(() => import('@/pages/Reports'))
const Stores = lazy(() => import('@/pages/Stores'))
const Users = lazy(() => import('@/pages/Users'))
const AuditLogs = lazy(() => import('@/pages/AuditLogs'))
const Settings = lazy(() => import('@/pages/Settings'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function RootRedirect() {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  return <Navigate to={homeForRole(user.role)} replace />
}

function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function Guard({ p, children }: { p: Permission; children: React.ReactNode }) {
  return <ProtectedRoute permission={p}>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Guard p="dashboard.view"><Dashboard /></Guard>} />
            <Route path="/pos" element={<Guard p="pos.access"><Pos /></Guard>} />
            <Route path="/my-sales" element={<Guard p="sales.view_own"><MySales /></Guard>} />

            <Route path="/products" element={<Guard p="products.view"><Products /></Guard>} />
            <Route path="/products/:id" element={<Guard p="products.view"><ProductDetails /></Guard>} />
            <Route path="/categories" element={<Guard p="categories.manage"><Categories /></Guard>} />
            <Route path="/inventory" element={<Guard p="inventory.view"><Inventory /></Guard>} />
            <Route path="/inventory/alerts" element={<Guard p="inventory.view"><InventoryAlerts /></Guard>} />
            <Route path="/inventory/adjustments" element={<Guard p="inventory.manage"><InventoryAdjustments /></Guard>} />

            <Route path="/sales" element={<Guard p="sales.view"><Sales /></Guard>} />
            <Route path="/sales/:id" element={<Guard p="sales.view_own"><SaleDetails /></Guard>} />
            <Route path="/customers" element={<Guard p="customers.view"><Customers /></Guard>} />
            <Route path="/customers/:id" element={<Guard p="customers.view"><CustomerDetails /></Guard>} />
            <Route path="/purchases" element={<Guard p="purchases.manage"><Purchases /></Guard>} />
            <Route path="/purchases/:id" element={<Guard p="purchases.manage"><PurchaseDetails /></Guard>} />
            <Route path="/suppliers" element={<Guard p="suppliers.manage"><Suppliers /></Guard>} />
            <Route path="/expenses" element={<Guard p="expenses.manage"><Expenses /></Guard>} />

            <Route path="/reports" element={<Guard p="reports.view"><Reports /></Guard>} />
            <Route path="/reports/:tab" element={<Guard p="reports.view"><Reports /></Guard>} />
            <Route path="/sellers" element={<Guard p="sellers.manage"><Sellers /></Guard>} />
            <Route path="/stores" element={<Guard p="stores.manage"><Stores /></Guard>} />
            <Route path="/users" element={<Guard p="users.manage"><Users /></Guard>} />
            <Route path="/audit-logs" element={<Guard p="audit.view"><AuditLogs /></Guard>} />
            <Route path="/settings" element={<Guard p="pos.access"><Settings /></Guard>} />
            <Route path="/settings/:tab" element={<Guard p="pos.access"><Settings /></Guard>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
