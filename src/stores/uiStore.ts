import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  commandOpen: boolean
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleSidebar: () => void
  setCommandOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarCollapsed: false,
      commandOpen: false,
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setCommandOpen: (open) => set({ commandOpen: open }),
    }),
    { name: 'retailpro-ui', partialize: (s) => ({ theme: s.theme, sidebarCollapsed: s.sidebarCollapsed }) },
  ),
)
