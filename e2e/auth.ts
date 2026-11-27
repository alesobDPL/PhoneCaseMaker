import type { BrowserContext } from '@playwright/test'

export type TestUser = { id: string; email: string; givenName?: string; familyName?: string }

type Claims = Record<string, unknown>
const issuer = 'http://127.0.0.1:3199'

export async function signToken(claims: Claims) {
  const response = await fetch(`${issuer}/sign`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ claims }),
  })
  if (!response.ok) throw new Error(`Test issuer returned ${response.status}`)
  const { token } = await response.json() as { token: string }
  return token
}

export function sessionClaims(user: TestUser) {
  const clientId = process.env.KINDE_CLIENT_ID
  if (!clientId) throw new Error('Missing KINDE_CLIENT_ID')
  return {
    id: {
      sub: user.id,
      email: user.email,
      given_name: user.givenName,
      family_name: user.familyName,
      aud: [clientId],
    },
    access: {
      sub: user.id,
      aud: [],
      scp: ['openid', 'profile', 'email'],
      permissions: [],
      roles: [],
    },
  }
}

export function sessionCookies(idToken: string, accessToken: string) {
  const attributes = { domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' as const }
  return [
    { ...attributes, name: 'id_token', value: idToken },
    { ...attributes, name: 'access_token', value: accessToken },
  ]
}

export async function signedInAs(context: BrowserContext, user: TestUser) {
  const claims = sessionClaims(user)
  const [idToken, accessToken] = await Promise.all([signToken(claims.id), signToken(claims.access)])
  await context.addCookies(sessionCookies(idToken, accessToken))
}

function b64url(value: Claims) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

export function unsignedToken(claims: Claims) {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url({ alg: 'RS256', typ: 'JWT' })
  const payload = b64url({ ...claims, iss: issuer, iat: now, exp: now + 3600 })
  return `${header}.${payload}.e2e`
}
