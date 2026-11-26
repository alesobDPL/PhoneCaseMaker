import { createServer } from 'node:http'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'

const host = '127.0.0.1'
const port = 3199
const issuer = `http://${host}:${port}`
const alg = 'RS256'
const kid = 'e2e'
const { publicKey, privateKey } = await generateKeyPair(alg)
const jwks = { keys: [{ ...await exportJWK(publicKey), kid, alg, use: 'sig' }] }

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/.well-known/jwks.json') {
    json(response, 200, jwks)
    return
  }

  if (request.method === 'POST' && request.url === '/sign') {
    try {
      request.setEncoding('utf8')
      let body = ''
      for await (const chunk of request) body += chunk
      const { claims } = JSON.parse(body)
      const now = Math.floor(Date.now() / 1000)
      const token = await new SignJWT(claims)
        .setProtectedHeader({ alg, kid, typ: 'JWT' })
        .setIssuer(issuer)
        .setIssuedAt(now)
        .setExpirationTime(now + 3600)
        .sign(privateKey)
      json(response, 200, { token })
    } catch {
      json(response, 400, { error: 'Invalid claims' })
    }
    return
  }

  response.writeHead(404).end()
}).listen(port, host)
