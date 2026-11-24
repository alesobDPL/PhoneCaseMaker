import { vi } from 'vitest'

type MockUser = { id: string; email: string } | null

const session = vi.hoisted(() => ({ user: null as MockUser }))

vi.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: vi.fn(() => ({ getUser: async () => session.user })),
}))

export function mockKindeUser(user: { id: string; email: string } | null): void {
  session.user = user === null ? null : { id: user.id, email: user.email }
}
