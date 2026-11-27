import { describe, expect, it } from 'vitest'
import { getMetadataBase, localeAlternates } from '@/lib/seo'

describe('getMetadataBase', () => {
  it('returns a URL for a valid http origin', () => {
    const base = getMetadataBase('http://localhost:3000')

    expect(base).toBeInstanceOf(URL)
    expect(base?.origin).toBe('http://localhost:3000')
  })

  it('returns a URL for a valid https origin', () => {
    expect(getMetadataBase('https://shop.example.com')?.origin).toBe('https://shop.example.com')
  })

  it.each([undefined, '', 'no es una url', 'ftp://x.test'])('returns undefined for %j without throwing', (value) => {
    expect(() => getMetadataBase(value)).not.toThrow()
    expect(getMetadataBase(value)).toBeUndefined()
  })
})

describe('localeAlternates', () => {
  it('maps the home page to each locale and the bare root', () => {
    expect(localeAlternates('/')).toEqual({ languages: { es: '/es', en: '/en', 'x-default': '/' } })
  })

  it('prefixes nested paths with each locale and leaves x-default unprefixed', () => {
    expect(localeAlternates('/configure/upload')).toEqual({
      languages: {
        es: '/es/configure/upload',
        en: '/en/configure/upload',
        'x-default': '/configure/upload',
      },
    })
  })
})
