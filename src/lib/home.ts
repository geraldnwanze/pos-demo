import type { Role } from '@/types'

/** Landing route per role after login. Sellers go straight to the POS. */
export function homeForRole(role: Role): string {
  return role === 'seller' ? '/pos' : '/dashboard'
}
