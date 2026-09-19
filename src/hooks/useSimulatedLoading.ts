import { useEffect, useState } from 'react'

/**
 * Simulates a short async load so pages can exercise their loading/skeleton
 * states. Replace with real query loading flags when a backend is added.
 */
export function useSimulatedLoading(ms = 450): boolean {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
  }, [ms])
  return loading
}
