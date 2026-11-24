export type AuthzEnv = { adminEmail?: string; demoMode: boolean }

type DashboardUser = { email?: string | null } | null

export function getAuthzEnv(): AuthzEnv {
  return {
    adminEmail: process.env.ADMIN_EMAIL,
    demoMode: process.env.DEMO_MODE === 'true',
  }
}

export function isAdmin(user: DashboardUser, env: AuthzEnv): boolean {
  return Boolean(env.adminEmail && user?.email === env.adminEmail)
}

export function canViewDashboard(user: DashboardUser, env: AuthzEnv): boolean {
  return user !== null && (isAdmin(user, env) || env.demoMode)
}

export function canUpdateOrder(
  user: { id: string; email?: string | null } | null,
  order: { userId: string; isSample: boolean },
  env: AuthzEnv,
): boolean {
  if (!user || order.isSample || !canViewDashboard(user, env)) return false
  return isAdmin(user, env) || order.userId === user.id
}
