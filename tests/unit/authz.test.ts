import { afterEach, describe, expect, it, vi } from 'vitest'
import { canUpdateOrder, canViewDashboard, getAuthzEnv, isAdmin, type AuthzEnv } from '@/lib/authz'

const admin = { id: 'admin', email: 'admin@example.com' }
const visitor = { id: 'visitor', email: 'visitor@example.com' }
const env: AuthzEnv = { adminEmail: admin.email, demoMode: false }
const ownOrder = { userId: visitor.id, isSample: false }
const otherOrder = { userId: 'other', isSample: false }
const sampleOrder = { userId: visitor.id, isSample: true }

afterEach(() => vi.unstubAllEnvs())

describe('dashboard permissions (design table 5.3)', () => {
  it('allows the real administrator to view and update all non-sample orders', () => {
    expect(isAdmin(admin, env)).toBe(true)
    expect(canViewDashboard(admin, env)).toBe(true)
    expect(canUpdateOrder(admin, ownOrder, env)).toBe(true)
    expect(canUpdateOrder(admin, otherOrder, env)).toBe(true)
  })

  it('allows a signed-in demo visitor to view and update only their own non-sample orders', () => {
    const demoEnv = { ...env, demoMode: true }
    expect(isAdmin(visitor, demoEnv)).toBe(false)
    expect(canViewDashboard(visitor, demoEnv)).toBe(true)
    expect(canUpdateOrder(visitor, ownOrder, demoEnv)).toBe(true)
    expect(canUpdateOrder(visitor, otherOrder, demoEnv)).toBe(false)
    expect(canUpdateOrder(visitor, sampleOrder, demoEnv)).toBe(false)
  })

  it('rejects a non-admin when demo mode is disabled, including for their own order', () => {
    expect(isAdmin(visitor, env)).toBe(false)
    expect(canViewDashboard(visitor, env)).toBe(false)
    expect(canUpdateOrder(visitor, ownOrder, env)).toBe(false)
    expect(canUpdateOrder(visitor, otherOrder, env)).toBe(false)
  })

  it('never lets an administrator update a sample, even if they own it', () => {
    for (const demoMode of [true, false]) {
      expect(canUpdateOrder(admin, sampleOrder, { ...env, demoMode })).toBe(false)
      expect(canUpdateOrder(admin, { userId: admin.id, isSample: true }, { ...env, demoMode })).toBe(false)
    }
  })

  it('does not consider anyone an administrator when adminEmail is undefined or empty', () => {
    for (const adminEmail of [undefined, '']) {
      const unconfiguredEnv = { adminEmail, demoMode: false }
      for (const user of [admin, visitor, { id: 'missing-email' }, { id: 'null-email', email: null }, { id: 'empty-email', email: '' }]) {
        expect(isAdmin(user, unconfiguredEnv)).toBe(false)
        expect(canViewDashboard(user, unconfiguredEnv)).toBe(false)
        expect(canUpdateOrder(user, { userId: user.id, isSample: false }, unconfiguredEnv)).toBe(false)
      }
    }
  })

  it('returns false for every permission when the user is null', () => {
    for (const demoMode of [true, false]) {
      const anonymousEnv = { ...env, demoMode }
      expect(isAdmin(null, anonymousEnv)).toBe(false)
      expect(canViewDashboard(null, anonymousEnv)).toBe(false)
      expect(canUpdateOrder(null, ownOrder, anonymousEnv)).toBe(false)
      expect(canUpdateOrder(null, sampleOrder, anonymousEnv)).toBe(false)
    }
  })
})

describe('getAuthzEnv', () => {
  it('reads ADMIN_EMAIL and enables demo mode only for the exact string true', () => {
    vi.stubEnv('ADMIN_EMAIL', admin.email)
    for (const value of ['true', 'false', 'TRUE', '1', '']) {
      vi.stubEnv('DEMO_MODE', value)
      expect(getAuthzEnv()).toEqual({ adminEmail: admin.email, demoMode: value === 'true' })
    }
    vi.stubEnv('ADMIN_EMAIL', undefined)
    vi.stubEnv('DEMO_MODE', undefined)
    expect(getAuthzEnv()).toEqual({ adminEmail: undefined, demoMode: false })
  })
})
