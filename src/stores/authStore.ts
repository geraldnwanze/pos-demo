import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role, User } from '@/types'
import { mockAuthService } from '@/services/auth'
import { permissionsForRole, roleHasPermission, type Permission } from '@/lib/rbac'
import { useDataStore } from './dataStore'

interface AuthState {
  user: User | null
  status: 'idle' | 'loading' | 'authenticated'
  error: string | null
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
  hasPermission: (permission: Permission) => boolean
  permissions: () => Permission[]
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      status: 'idle',
      error: null,

      login: async (email, password) => {
        set({ status: 'loading', error: null })
        try {
          const { users, passwords } = useDataStore.getState()
          const user = await mockAuthService.login(email, password, users, passwords)
          useDataStore.getState().recordLogin(user.id)
          set({ user, status: 'authenticated', error: null })
          return user
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed.'
          set({ status: 'idle', error: message })
          throw err
        }
      },

      logout: () => set({ user: null, status: 'idle', error: null }),

      hasRole: (...roles) => {
        const user = get().user
        return user ? roles.includes(user.role) : false
      },

      hasPermission: (permission) => {
        const user = get().user
        return user ? roleHasPermission(user.role, permission) : false
      },

      permissions: () => {
        const user = get().user
        return user ? permissionsForRole(user.role) : []
      },
    }),
    {
      name: 'retailpro-auth',
      partialize: (state) => ({ user: state.user, status: state.status }),
    },
  ),
)

// Keep the signed-in user in step with the data store, so profile edits and
// role changes show immediately and a deactivated or deleted account is signed out.
function syncSession(users: User[]) {
  const current = useAuthStore.getState().user
  if (!current) return
  const fresh = users.find((u) => u.id === current.id)
  if (!fresh || fresh.status !== 'active') {
    useAuthStore.getState().logout()
  } else if (fresh !== current) {
    useAuthStore.setState({ user: fresh })
  }
}

syncSession(useDataStore.getState().users)
useDataStore.subscribe((state, prev) => {
  if (state.users !== prev.users) syncSession(state.users)
})
