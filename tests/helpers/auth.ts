import { vi } from 'vitest'
import type { SessionUser } from '@/lib/auth/verify-session'

const session = vi.hoisted(() => ({ user: null as SessionUser | null }))

vi.mock('@/lib/auth/session', () => ({
  getSessionUser: vi.fn(async () => session.user),
}))

export function mockKindeUser(user: { id: string; email: string } | null): void {
  session.user = user === null ? null : {
    id: user.id,
    email: user.email,
    given_name: null,
    family_name: null,
    picture: null,
  }
}
