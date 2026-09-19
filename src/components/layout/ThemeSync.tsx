import { useEffect } from 'react'
import { useUiStore } from '@/stores/uiStore'

/** Applies the persisted theme to <html> and keeps it in sync. */
export function ThemeSync() {
  const theme = useUiStore((s) => s.theme)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])
  return null
}
