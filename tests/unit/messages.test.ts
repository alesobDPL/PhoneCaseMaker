import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { NAMESPACES } from '@/i18n/namespaces'

type Messages = { [key: string]: string | Messages }

const commonKeys = [
  'nav.orders',
  'nav.createCase',
  'nav.openMenu',
  'nav.closeMenu',
  'dialog.close',
  'locale.label',
  'currency.label',
  'currency.usd',
  'currency.eur',
  'currency.clp',
  'authCallback.errorTitle',
  'authCallback.errorDescription',
  'authCallback.retry',
]

function flatten(messages: Messages, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'string' ? [[path, value]] : Object.entries(flatten(value, path))
  }))
}

function readMessages(locale: 'es' | 'en', namespace: (typeof NAMESPACES)[number]) {
  const path = resolve('messages', locale, `${namespace}.json`)
  return flatten(JSON.parse(readFileSync(path, 'utf8')))
}

function placeholders(message: string) {
  return [...new Set(message.match(/\{\s*[\w-]+\s*\}/g)?.map((match) => match.slice(1, -1).trim()))].sort()
}

describe('message catalogs', () => {
  it.each(NAMESPACES)('has matching keys and placeholders in %s', (namespace) => {
    const es = readMessages('es', namespace)
    const en = readMessages('en', namespace)

    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort())

    for (const key of Object.keys(es)) {
      expect(es[key].trim(), `es.${namespace}.${key}`).not.toBe('')
      expect(en[key].trim(), `en.${namespace}.${key}`).not.toBe('')
      expect(placeholders(es[key]), `${namespace}.${key}`).toEqual(placeholders(en[key]))
    }
  })

  it.each(['es', 'en'] as const)('includes the common interface keys in %s', (locale) => {
    expect(Object.keys(readMessages(locale, 'common'))).toEqual(expect.arrayContaining(commonKeys))
  })
})
