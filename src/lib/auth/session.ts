import { createRemoteJWKSet, errors } from 'jose'
import { cookies } from 'next/headers'
import { verifySessionTokens, type SessionUser } from './verify-session'

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

export async function getSessionUser(): Promise<SessionUser | null> {
  const issuer = process.env.KINDE_ISSUER_URL?.replace(/\/+$/, '')
  const clientId = process.env.KINDE_CLIENT_ID
  const audience = process.env.KINDE_AUDIENCE?.trim().split(/\s+/).filter(Boolean)
  if (!issuer || !clientId) {
    console.error('Kinde session configuration is missing')
    return null
  }

  const cookieStore = await cookies()
  const idToken = cookieStore.get('id_token')?.value
  const accessToken = cookieStore.get('access_token')?.value
  if (!idToken || !accessToken) return null

  let keySet = keySets.get(issuer)
  if (!keySet) {
    try {
      keySet = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))
      keySets.set(issuer, keySet)
    } catch {
      console.error('Kinde JWKS configuration is invalid')
      return null
    }
  }

  return verifySessionTokens({ idToken, accessToken }, {
    issuer,
    clientId,
    audience,
    async keySet(...args) {
      try {
        return await keySet(...args)
      } catch (error) {
        if (!(error instanceof errors.JWKSNoMatchingKey) &&
            !(error instanceof errors.JWKSMultipleMatchingKeys)) {
          console.error('Kinde JWKS lookup failed')
        }
        throw error
      }
    },
  })
}
