import enCommon from '../messages/en/common.json'
import en from '../messages/en/configure.json'
import esCommon from '../messages/es/common.json'
import es from '../messages/es/configure.json'
import { expect, test } from './fixtures'

test.use({ locale: 'en-US' })

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

const languages = [
  { locale: 'es', browserLocale: 'es-CL', common: esCommon, configure: es },
  { locale: 'en', browserLocale: 'en-US', common: enCommon, configure: en },
]

for (const { locale, browserLocale, common, configure } of languages) {
  test.describe(`${locale} demo banner and login modal`, () => {
    test.use({ locale: browserLocale })

    test('home shows demo banner with test card when DEMO_MODE', async ({ page }) => {
      test.skip(process.env.DEMO_MODE !== 'true', 'Requires DEMO_MODE=true')
      await page.goto(`/${locale}`)

      const banner = page.getByRole('complementary', { name: common.demoBanner.ariaLabel })
      await expect(banner).toBeVisible()
      await expect(banner).toContainText(common.demoBanner.message.replace(/<\/?(?:label|card)>/g, ''))
      await expect(banner.getByRole('link', { name: common.demoBanner.dashboardLink }))
        .toHaveAttribute('href', `/${locale}/dashboard`)
    })

    test('preview without session opens the login modal', async ({ page, configurationId }) => {
      await page.goto(`/${locale}/configure/preview?id=${configurationId}`)

      await expect(page.getByRole('heading', {
        name: configure.preview.title.replace('{model}', 'iPhone 15'),
      })).toBeVisible()
      await page.getByRole('button', { name: configure.preview.checkout }).click()
      const dialog = page.getByRole('dialog', { name: common.loginModal.title })
      await expect(dialog).toBeVisible()
      await expect(dialog).toContainText(common.loginModal.description.replace(/<\/?saved>/g, ''))
      await expect.poll(() => page.evaluate(() => localStorage.getItem('configurationId')))
        .toBe(configurationId)
    })
  })
}
