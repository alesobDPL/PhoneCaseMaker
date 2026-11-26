import { jwtVerify, type JWTVerifyGetKey, type JWTVerifyOptions } from 'jose'

export type SessionUser = {
  id: string
  email: string | null
  given_name: string | null
  family_name: string | null
  picture: string | null
}

export async function verifySessionTokens(
  tokens: { idToken?: string | null; accessToken?: string | null },
  config: { keySet: JWTVerifyGetKey; issuer: string; clientId: string; audience?: string[] },
): Promise<SessionUser | null> {
  const { idToken, accessToken } = tokens
  if (!idToken || !accessToken) return null

  const options: JWTVerifyOptions = {
    algorithms: ['RS256'],
    issuer: config.issuer,
    clockTolerance: 5,
    requiredClaims: ['exp', 'sub'],
  }

  try {
    const { payload: id } = await jwtVerify(idToken, config.keySet, {
      ...options,
      audience: config.clientId,
    })
    const { payload: access } = await jwtVerify(accessToken, config.keySet, {
      ...options,
      audience: config.audience?.length ? config.audience : undefined,
    })
    if (typeof id.sub !== 'string' || !id.sub || id.sub !== access.sub) return null

    return {
      id: id.sub,
      email: typeof id.email === 'string' ? id.email : null,
      given_name: typeof id.given_name === 'string' ? id.given_name : null,
      family_name: typeof id.family_name === 'string' ? id.family_name : null,
      picture: typeof id.picture === 'string' ? id.picture : null,
    }
  } catch {
    return null
  }
}
