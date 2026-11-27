import esCommon from '../messages/es/common.json'
import { expect, test } from './fixtures'

const ORIGIN = 'http://localhost:3100'

async function hreflangs(page: import('@playwright/test').Page) {
  const links = page.locator('link[rel="alternate"][hreflang]')
  // Next.js renders the bare origin without a trailing slash; the URL property normalizes it.
  return links.evaluateAll((nodes) =>
    Object.fromEntries(nodes.map((node) => [node.getAttribute('hreflang'), new URL(node.getAttribute('href')!).href])),
  )
}

for (const locale of ['es', 'en']) {
  test(`declares hreflang for the home page at /${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`)

    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3)
    expect(await hreflangs(page)).toEqual({
      es: `${ORIGIN}/es`,
      en: `${ORIGIN}/en`,
      'x-default': `${ORIGIN}/`,
    })
  })

  test(`declares hreflang for the upload page at /${locale}/configure/upload`, async ({ page }) => {
    await page.goto(`/${locale}/configure/upload`)

    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3)
    expect(await hreflangs(page)).toEqual({
      es: `${ORIGIN}/es/configure/upload`,
      en: `${ORIGIN}/en/configure/upload`,
      'x-default': `${ORIGIN}/configure/upload`,
    })
  })
}

test('keeps the title and description of the home page', async ({ page }) => {
  await page.goto('/es')

  await expect(page).toHaveTitle(esCommon.meta.title)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', esCommon.meta.description)
})

test('does not declare hreflang on a page without its own', async ({ page }) => {
  const response = await page.goto('/es/no-existe')

  expect(response?.status()).toBe(404)
  await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0)
})
