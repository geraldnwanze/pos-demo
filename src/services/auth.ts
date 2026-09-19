import type { User } from '@/types'

/**
 * Auth abstraction. Swap this implementation for real API calls later —
 * the store and components only depend on this interface.
 */
export interface AuthService {
  login(email: string, password: string, users: User[]): Promise<User>
}

const DEMO_PASSWORD = 'password'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const mockAuthService: AuthService = {
  async login(email, password, users) {
    await delay(500) // simulate network latency
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!user || password !== DEMO_PASSWORD) {
      throw new Error('Invalid email or password.')
    }
    if (user.status !== 'active') {
      throw new Error('This account has been deactivated. Contact an administrator.')
    }
    return user
  },
}
