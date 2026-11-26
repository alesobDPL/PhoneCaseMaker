import en from '../messages/en/configure.json'
import es from '../messages/es/configure.json'
import { expect, test } from './fixtures'

test.use({ locale: 'en-US' })

test('home shows demo banner with test card when DEMO_MODE', async ({ page }) => {
  test.skip(process.env.DEMO_MODE !== 'true', 'Requires DEMO_MODE=true')
  await page.goto('/es')

  const banner = page.getByRole('complementary', { name: 'Demo mode' })
  await expect(banner).toBeVisible()
  await expect(banner).toContainText('4242 4242 4242 4242')
  await expect(banner).toContainText('any future date and any CVC')
  await expect(banner.getByRole('link', { name: 'Try the admin dashboard' }))
    .toHaveAttribute('href', '/dashboard')
})

test.describe('Spanish configurator', () => {
  test.use({ locale: 'es-CL' })

  test('upload page renders the dropzone', async ({ page }) => {
    await page.goto('/es/configure/upload')

    await expect(page.getByText(es.upload.clickToUpload, { exact: true })).toBeVisible()
    await expect(page.getByText(es.upload.orDragAndDrop)).toBeVisible()
    await expect(page.locator('input[type="file"]')).toHaveAttribute('accept', /image\/png/)
  })

  test('preview displays the CLP total without decimals', async ({ page, context, baseURL, configurationId }) => {
    await context.addCookies([{ name: 'CURRENCY', value: 'clp', url: new URL('/', baseURL).href }])
    await page.goto(`/es/configure/preview?id=${configurationId}`)

    const total = page.getByText(es.preview.orderTotal, { exact: true }).locator('..')
    await expect(total).toContainText('21.970')
    await expect(total).not.toContainText(',00')
    await expect(page.getByText(es.preview.chargedIn.replace('{currency}', 'CLP'))).toBeVisible()
  })
})

test('preview displays the EUR total and checkout currency', async ({ page, context, baseURL, configurationId }) => {
  await context.addCookies([{ name: 'CURRENCY', value: 'eur', url: new URL('/', baseURL).href }])
  await page.goto(`/en/configure/preview?id=${configurationId}`)

  const total = page.getByText(en.preview.orderTotal, { exact: true }).locator('..')
  await expect(total).toContainText('21.00')
  await expect(page.getByText(en.preview.chargedIn.replace('{currency}', 'EUR'))).toBeVisible()
  await expect(page.getByText(en.options.material.polycarbonate, { exact: true })).toBeVisible()
})

test('upload page shows an error and resets the dropzone after a failed upload', async ({ page }) => {
  await page.route(/\/api\/uploadthing(?:\?|$)/, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 500, json: { message: 'Internal upload error' } })
    } else {
      await route.fallback()
    }
  })

  await page.goto('/en/configure/upload')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'image.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGP4DwABAQEAsTj2FAAAAABJRU5ErkJggg==',
      'base64',
    ),
  })

  await expect(page.getByText(en.uploadErrors.generic.title, { exact: true })).toBeVisible()
  await expect(page.getByText(en.upload.clickToUpload, { exact: true })).toBeVisible()
})

test('preview without session opens the login modal', async ({ page, configurationId }) => {
  await page.goto(`/en/configure/preview?id=${configurationId}`)

  await expect(page.getByRole('heading', { name: 'Your iPhone 15' })).toBeVisible()
  await page.getByRole('button', { name: 'Check out' }).click()
  const dialog = page.getByRole('dialog', { name: 'Log in to continue' })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('Your configuration was saved!')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('configurationId')))
    .toBe(configurationId)
})
