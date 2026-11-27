import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { NAMESPACES, namespaceKey } from './namespaces'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale
  const entries = await Promise.all(NAMESPACES.map(async (file) => {
    const { default: messages } = await import(`../../messages/${locale}/${file}.json`)
    return [namespaceKey(file), messages]
  }))

  return { locale, messages: Object.fromEntries(entries), timeZone: 'America/Santiago' }
})
