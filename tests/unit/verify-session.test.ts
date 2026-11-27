import { beforeAll, describe, expect, it } from 'vitest'
import {
  createLocalJWKSet,
  exportJWK,
  generateKeyPair,
  SignJWT,
  UnsecuredJWT,
  type JWTPayload,
} from 'jose'
import { verifySessionTokens } from '@/lib/auth/verify-session'

const issuer = 'https://issuer.example'
const clientId = 'test-client'
const apiAudience = 'https://api.example'
const subject = 'test-user'
let trustedKeys: Awaited<ReturnType<typeof generateKeyPair>>
let otherKeys: Awaited<ReturnType<typeof generateKeyPair>>
let config: Parameters<typeof verifySessionTokens>[1]

beforeAll(async () => {
  ;[trustedKeys, otherKeys] = await Promise.all([
    generateKeyPair('RS256'),
    generateKeyPair('RS256'),
  ])
  config = {
    keySet: createLocalJWKSet({ keys: [await exportJWK(trustedKeys.publicKey)] }),
    issuer,
    clientId,
  }
})

function claims(overrides: JWTPayload = {}): JWTPayload {
  return { iss: issuer, sub: subject, exp: Math.floor(Date.now() / 1000) + 60, ...overrides }
}

function sign(payload: JWTPayload, key = trustedKeys.privateKey): Promise<string> {
  return new SignJWT(payload).setProtectedHeader({ alg: 'RS256' }).sign(key)
}

async function validTokens() {
  const idToken = await sign(claims({ aud: [clientId] }))
  const accessToken = await sign(claims({ email: 'access@example.test' }))
  return { idToken, accessToken }
}

describe('verifySessionTokens', () => {
  it('returns only verified identity claims and defaults absent optional fields to null', async () => {
    const tokens = await validTokens()
    tokens.idToken = await sign(claims({
      aud: clientId,
      email: 'member@example.test',
      given_name: 'Casey',
      picture: 42,
    }))

    await expect(verifySessionTokens(tokens, config)).resolves.toEqual({
      id: subject,
      email: 'member@example.test',
      given_name: 'Casey',
      family_name: null,
      picture: null,
    })
  })

  it.each(['idToken', 'accessToken'] as const)('rejects %s signed by another key', async (name) => {
    const tokens = await validTokens()
    tokens[name] = await sign(claims({ aud: clientId }), otherKeys.privateKey)
    await expect(verifySessionTokens(tokens, config)).resolves.toBeNull()
  })

  it.each([
    ['an unsecured algorithm', (payload: JWTPayload) => new UnsecuredJWT(payload).encode()],
    ['HS256', (payload: JWTPayload) => new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(new Uint8Array(32))],
  ] as const)('rejects %s', async (_reason, encode) => {
    const tokens = await validTokens()
    tokens.idToken = await encode(claims({ aud: clientId }))
    await expect(verifySessionTokens(tokens, config)).resolves.toBeNull()
  })

  it.each([
    ['a different issuer', { iss: 'https://other.example' }],
    ['an issuer with a trailing slash', { iss: issuer + '/' }],
    ['an audience without the client ID', { aud: ['other-client'] }],
    ['an expired token', { exp: 1 }],
    ['a missing expiration', { exp: undefined }],
    ['a missing subject', { sub: undefined }],
  ] satisfies [string, JWTPayload][])('rejects an ID token with %s', async (_reason, overrides) => {
    const tokens = await validTokens()
    tokens.idToken = await sign(claims({ aud: clientId, ...overrides }))
    await expect(verifySessionTokens(tokens, config)).resolves.toBeNull()
  })

  it.each([
    ['a different issuer', { iss: 'https://other.example' }],
    ['an expired token', { exp: 1 }],
    ['a missing expiration', { exp: undefined }],
    ['a different subject', { sub: 'other-user' }],
  ] as const)('rejects an access token with %s', async (_reason, overrides) => {
    const tokens = await validTokens()
    tokens.accessToken = await sign(claims(overrides))
    await expect(verifySessionTokens(tokens, config)).resolves.toBeNull()
  })

  it.each(['idToken', 'accessToken'] as const)('rejects a missing or malformed %s', async (name) => {
    const tokens = await validTokens()
    await expect(verifySessionTokens({ ...tokens, [name]: null }, config)).resolves.toBeNull()
    await expect(verifySessionTokens({ ...tokens, [name]: 'invalid' }, config)).resolves.toBeNull()
  })

  it('rejects a non-string subject in both tokens', async () => {
    const invalidSubject = { sub: 42 } as unknown as JWTPayload
    const idToken = await sign(claims({ aud: clientId, ...invalidSubject }))
    const accessToken = await sign(claims(invalidSubject))
    await expect(verifySessionTokens({ idToken, accessToken }, config)).resolves.toBeNull()
  })

  it('requires the access token audience only when configured', async () => {
    const tokens = await validTokens()
    const audienceConfig = { ...config, audience: [apiAudience] }

    await expect(verifySessionTokens(tokens, { ...config, audience: [] })).resolves.not.toBeNull()
    await expect(verifySessionTokens(tokens, audienceConfig)).resolves.toBeNull()
    tokens.accessToken = await sign(claims({ aud: 'https://other-api.example' }))
    await expect(verifySessionTokens(tokens, audienceConfig)).resolves.toBeNull()
    tokens.accessToken = await sign(claims({ aud: [apiAudience] }))
    await expect(verifySessionTokens(tokens, audienceConfig)).resolves.not.toBeNull()
  })
})
