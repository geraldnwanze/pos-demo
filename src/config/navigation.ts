import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Boxes,
  Receipt,
  Users,
  UserCog,
  Truck,
  Wallet,
  BarChart3,
  Store,
  ShieldCheck,
  Settings,
  ClipboardList,
  Contact,
  type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@/lib/rbac'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  permission: Permission
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
      { label: 'Point of Sale', to: '/pos', icon: ShoppingCart, permission: 'pos.access' },
      { label: 'My Sales', to: '/my-sales', icon: Receipt, permission: 'sales.view_own' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products', to: '/products', icon: Package, permission: 'products.view' },
      { label: 'Categories', to: '/categories', icon: Tags, permission: 'categories.manage' },
      { label: 'Inventory', to: '/inventory', icon: Boxes, permission: 'inventory.view' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Sales', to: '/sales', icon: Receipt, permission: 'sales.view' },
      { label: 'Customers', to: '/customers', icon: Contact, permission: 'customers.view' },
      { label: 'Purchases', to: '/purchases', icon: ClipboardList, permission: 'purchases.manage' },
      { label: 'Suppliers', to: '/suppliers', icon: Truck, permission: 'suppliers.manage' },
      { label: 'Expenses', to: '/expenses', icon: Wallet, permission: 'expenses.manage' },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Reports', to: '/reports', icon: BarChart3, permission: 'reports.view' },
      { label: 'Sellers', to: '/sellers', icon: Users, permission: 'sellers.manage' },
      { label: 'Stores', to: '/stores', icon: Store, permission: 'stores.manage' },
      { label: 'Users', to: '/users', icon: UserCog, permission: 'users.manage' },
      { label: 'Audit Logs', to: '/audit-logs', icon: ShieldCheck, permission: 'audit.view' },
      { label: 'Settings', to: '/settings', icon: Settings, permission: 'settings.manage' },
    ],
  },
]

/** Seller-only: My Sales replaces the Dashboard as the seller home. */
export const SELLER_HOME = '/pos'
export const DEFAULT_HOME = '/dashboard'
