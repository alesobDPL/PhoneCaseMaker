import { routing } from '@/i18n/routing'

export function getMetadataBase(value: string | undefined = process.env.NEXT_PUBLIC_SERVER_URL): URL | undefined {
  if (!value) return undefined

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : undefined
  } catch {
    return undefined
  }
}

export function localeAlternates(pathname: string): { languages: Record<'es' | 'en' | 'x-default', string> } {
  const suffix = pathname === '/' ? '' : pathname
  const localized = Object.fromEntries(routing.locales.map((locale) => [locale, `/${locale}${suffix}`])) as Record<
    (typeof routing.locales)[number],
    string
  >

  return { languages: { ...localized, 'x-default': pathname } }
}
