import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import {
  createLocalJWKSet,
  createRemoteJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWTVerifyGetKey,
} from 'jose'
import { getSessionUser } from '@/lib/auth/session'

const getCookie = vi.hoisted(() => vi.fn())
vi.mock('next/headers', () => ({ cookies: async () => ({ get: getCookie }) }))

const resolveKey = vi.fn<JWTVerifyGetKey>()
vi.mock('jose', async (importOriginal) => {
  const jose = await importOriginal<typeof import('jose')>()
  return { ...jose, createRemoteJWKSet: vi.fn(() => resolveKey) }
})

const issuer = 'https://issuer.example'
const clientId = 'test-client'
const user = {
  id: 'test-user',
  email: 'member@example.test',
  given_name: 'Casey',
  family_name: 'Smith',
  picture: 'https://images.example/avatar',
}
let trustedKeys: Awaited<ReturnType<typeof generateKeyPair>>
let otherKeys: Awaited<ReturnType<typeof generateKeyPair>>
let localKeySet: JWTVerifyGetKey

beforeAll(async () => {
  ;[trustedKeys, otherKeys] = await Promise.all([
    generateKeyPair('RS256'),
    generateKeyPair('RS256'),
  ])
  localKeySet = createLocalJWKSet({ keys: [await exportJWK(trustedKeys.publicKey)] })
})

beforeEach(() => {
  vi.stubEnv('KINDE_ISSUER_URL', issuer + '/')
  vi.stubEnv('KINDE_CLIENT_ID', clientId)
  vi.stubEnv('KINDE_AUDIENCE', '')
  getCookie.mockReset()
  resolveKey.mockReset().mockImplementation(localKeySet)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

async function setSessionCookies(idKey = trustedKeys.privateKey, tokenIssuer = issuer) {
  const { id, ...profile } = user
  const idToken = await new SignJWT(profile)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(tokenIssuer)
    .setSubject(id)
    .setAudience(clientId)
    .setExpirationTime('1m')
    .sign(idKey)
  const accessToken = await new SignJWT({ email: 'access@example.test' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(tokenIssuer)
    .setSubject(id)
    .setAudience('https://api.example')
    .setExpirationTime('1m')
    .sign(trustedKeys.privateKey)

  const tokens = new Map([['id_token', idToken], ['access_token', accessToken]])
  getCookie.mockImplementation((name: string) => {
    const value = tokens.get(name)
    return value ? { name, value } : undefined
  })
  return { idToken, accessToken }
}

it('rejects a session with an untrusted ID token signature', async () => {
  await setSessionCookies(otherKeys.privateKey)
  await expect(getSessionUser()).resolves.toBeNull()
})

it('returns the verified ID token profile from signed cookies', async () => {
  await setSessionCookies()
  await expect(getSessionUser()).resolves.toEqual(user)
})

it('reads configuration each time and reuses the JWKS per issuer', async () => {
  const otherIssuer = 'https://other-issuer.example'
  vi.mocked(createRemoteJWKSet).mockClear()
  vi.stubEnv('KINDE_ISSUER_URL', otherIssuer)
  vi.stubEnv('KINDE_AUDIENCE', 'https://other-api.example https://api.example')
  await setSessionCookies(trustedKeys.privateKey, otherIssuer)
  await expect(getSessionUser()).resolves.toEqual(user)

  vi.stubEnv('KINDE_AUDIENCE', 'https://other-api.example')
  await expect(getSessionUser()).resolves.toBeNull()
  expect(createRemoteJWKSet).toHaveBeenCalledExactlyOnceWith(
    new URL(otherIssuer + '/.well-known/jwks.json'),
  )
})

it('returns null and logs a diagnostic when required configuration is absent', async () => {
  vi.stubEnv('KINDE_CLIENT_ID', '')
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  await expect(getSessionUser()).resolves.toBeNull()
  expect(log).toHaveBeenCalledExactlyOnceWith('Kinde session configuration is missing')
})

it('returns null and logs a diagnostic without tokens when the JWKS fails', async () => {
  const { idToken, accessToken } = await setSessionCookies()
  resolveKey.mockRejectedValue(new Error(idToken + accessToken))
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  await expect(getSessionUser()).resolves.toBeNull()
  expect(log).toHaveBeenCalledExactlyOnceWith('Kinde JWKS lookup failed')
})
