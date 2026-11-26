import en from '../messages/en/common.json'
import es from '../messages/es/common.json'
import { expect, test } from './fixtures'

test('uses Spanish when neither the cookie nor the browser specifies a language', async ({ page }) => {
  await page.route('**/', async (route) => {
    const headers = route.request().headers()
    delete headers['accept-language']
    await route.continue({ headers })
  })

  await page.goto('/')
  await expect(page).toHaveURL(/\/es$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
})

test('gives the language cookie precedence over the browser', async ({ page, context, baseURL }) => {
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-CL' })
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: new URL('/', baseURL).href }])

  await page.goto('/')
  await expect(page).toHaveURL(/\/en$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('uses the browser language in the absence of a cookie', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US' })

  await page.goto('/')
  await expect(page).toHaveURL(/\/en$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('preserves the query when redirecting an old callback URL', async ({ request }) => {
  const response = await request.get('/auth-callback?x=1', {
    headers: { 'Accept-Language': 'es-CL' },
    maxRedirects: 0,
  })

  expect(response.status()).toBe(307)
  expect(new URL(response.headers().location, response.url()).pathname).toBe('/es/auth-callback')
  expect(new URL(response.headers().location, response.url()).search).toBe('?x=1')
})

test('does not redirect API requests', async ({ request }) => {
  const response = await request.get('/api/webhooks', { maxRedirects: 0 })

  expect([307, 308]).not.toContain(response.status())
  expect(response.headers().location).toBeUndefined()
})

test('preserves the preview query and saves the selected language', async ({ page, context, configurationId }) => {
  const path = `/configure/preview?id=${configurationId}&tag=one&tag=two`
  await page.goto(`/es${path}`)

  await page.getByRole('button', { name: 'Cambiar idioma, actual: Español' }).click()
  await page.getByRole('menuitemradio', { name: en.locale.en }).click()

  await expect(page).toHaveURL((url) => `${url.pathname}${url.search}` === `/en${path}`)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  const cookie = (await context.cookies()).find(({ name }) => name === 'NEXT_LOCALE')
  expect(cookie).toMatchObject({ value: 'en', sameSite: 'Lax', path: '/' })
  expect(cookie!.expires - Date.now() / 1000).toBeGreaterThan(364 * 24 * 60 * 60)
})

test('renders the Spanish 404 for an unsupported locale', async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'fr-FR' })
  const response = await page.goto('/fr/configure/upload')

  expect(response?.status()).toBe(404)
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  await expect(page.getByRole('heading', { name: es.notFound.title })).toBeVisible()
  await expect(page.getByRole('link', { name: es.notFound.backHome })).toHaveAttribute('href', '/es')
})

test('renders the English 404 for an unknown path under /en', async ({ page }) => {
  const response = await page.goto('/en/missing-page')

  expect(response?.status()).toBe(404)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { name: en.notFound.title })).toBeVisible()
  await expect(page.getByRole('link', { name: en.notFound.backHome })).toHaveAttribute('href', '/en')
})

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('closes on Escape, through the close button, outside and on navigation', async ({ page }) => {
    await page.goto('/es')

    const trigger = page.getByRole('button', { name: es.nav.openMenu })
    const menu = page.getByRole('dialog', { name: es.nav.menu })

    await trigger.click()
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('button', { name: es.locale.es })).toHaveAttribute('aria-pressed', 'true')
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(trigger).toBeFocused()

    await trigger.click()
    await menu.getByRole('button', { name: es.nav.closeMenu }).click()
    await expect(menu).toBeHidden()
    await expect(trigger).toBeFocused()

    await trigger.click()
    await page.mouse.click(8, 80)
    await expect(menu).toBeHidden()
    await expect(trigger).toBeFocused()

    await trigger.click()
    await menu.getByRole('link', { name: es.nav.createCase }).click()
    await expect(page).toHaveURL(/\/es\/configure\/upload$/)
    await expect(menu).toBeHidden()
  })
})
