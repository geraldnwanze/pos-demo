import type { Role } from '@/types'

/** All permissions used across the app. */
export type Permission =
  | 'dashboard.view'
  | 'pos.access'
  | 'products.view'
  | 'products.manage'
  | 'categories.manage'
  | 'inventory.view'
  | 'inventory.manage'
  | 'sales.view'
  | 'sales.view_own'
  | 'sales.refund'
  | 'customers.view'
  | 'customers.manage'
  | 'sellers.manage'
  | 'purchases.manage'
  | 'suppliers.manage'
  | 'expenses.manage'
  | 'reports.view'
  | 'stores.manage'
  | 'users.manage'
  | 'users.manage_super_admin'
  | 'audit.view'
  | 'settings.manage'
  | 'settings.system'

const SELLER_PERMISSIONS: Permission[] = [
  'pos.access',
  'products.view',
  'inventory.view',
  'sales.view_own',
  'customers.view',
  'customers.manage',
]

const ADMIN_PERMISSIONS: Permission[] = [
  'dashboard.view',
  'pos.access',
  'products.view',
  'products.manage',
  'categories.manage',
  'inventory.view',
  'inventory.manage',
  'sales.view',
  'sales.view_own',
  'sales.refund',
  'customers.view',
  'customers.manage',
  'sellers.manage',
  'purchases.manage',
  'suppliers.manage',
  'expenses.manage',
  'reports.view',
  'settings.manage',
]

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  'stores.manage',
  'users.manage',
  'users.manage_super_admin',
  'audit.view',
  'settings.system',
]

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  seller: SELLER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  super_admin: SUPER_ADMIN_PERMISSIONS,
}

export function permissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role]
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  seller: 'Seller',
}
