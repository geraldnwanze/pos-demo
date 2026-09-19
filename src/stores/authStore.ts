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
          const users = useDataStore.getState().users
          const user = await mockAuthService.login(email, password, users)
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
