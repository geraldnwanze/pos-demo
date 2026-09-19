import { useAuthStore } from '@/stores/authStore'
import { permissionsForRole, roleHasPermission, type Permission } from '@/lib/rbac'
import type { Role } from '@/types'

/**
 * Reactive auth helper. Subscribes to the current user so permission checks
 * re-render when the user (or their role) changes.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const status = useAuthStore((s) => s.status)

  return {
    user,
    status,
    isAuthenticated: !!user,
    actor: user ? { id: user.id, name: user.name } : { id: 'system', name: 'System' },
    hasRole: (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    hasPermission: (permission: Permission) =>
      user ? roleHasPermission(user.role, permission) : false,
    permissions: user ? permissionsForRole(user.role) : ([] as Permission[]),
  }
}
