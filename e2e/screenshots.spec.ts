import { resolve } from 'node:path'
import type { Page } from '@playwright/test'
import { CURRENCY_CONFIG, DEFAULT_CURRENCY } from '@/config/currencies'
import { formatMoney } from '@/lib/money'
import { MODELS } from '@/validators/option-validators'
import enDashboard from '../messages/en/dashboard.json'
import enHome from '../messages/en/home.json'
import enOrders from '../messages/en/orders.json'
import enThankYou from '../messages/en/thank-you.json'
import esDashboard from '../messages/es/dashboard.json'
import esHome from '../messages/es/home.json'
import esOrders from '../messages/es/orders.json'
import esThankYou from '../messages/es/thank-you.json'
import { expect, languages, navbar, openMobileMenu, orderSummaryPath, showOrdersError, test, withOrdersLoading } from './fixtures'

const messages = {
  es: { home: esHome, orders: esOrders, thankYou: esThankYou, dashboard: esDashboard },
  en: { home: enHome, orders: enOrders, thankYou: enThankYou, dashboard: enDashboard },
}

const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
]

async function waitForImage(page: Page, alt: string) {
  const image = page.getByAltText(alt, { exact: true })
  await expect(image).toHaveJSProperty('complete', true)
  await expect(image).not.toHaveJSProperty('naturalWidth', 0)
}

for (const { locale, browserLocale, common, configure } of languages) {
  const { home, orders, thankYou, dashboard } = messages[locale]

  for (const viewport of viewports) {
    test.describe(`${locale} ${viewport.width}×${viewport.height} @screenshots`, () => {
      test.use({ locale: browserLocale, viewport, reducedMotion: 'reduce' })

      const mobile = viewport.width < 768

      async function capture(page: Page, screen: string, state: string, readmeName?: string) {
        const name = `${screen}-${state}-${locale}-${viewport.width}.png`
        await page.screenshot({ path: resolve('test-results', 'capturas', name), animations: 'disabled' })
        if (readmeName && locale === 'en' && viewport.width === 1280) {
          await page.screenshot({ path: resolve('docs', 'assets', `${readmeName}.png`), animations: 'disabled' })
        }
      }

      test('home', async ({ page }) => {
        await page.goto(`/${locale}`)
        const title = home.hero.title.replace(/<\/?accent>/g, '')
        await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
        await capture(page, 'home', 'default', 'home')
      })

      test('configurator upload', async ({ page }) => {
        await page.goto(`/${locale}/configure/upload`)
        await expect(page.getByText(configure.upload.clickToUpload, { exact: true })).toBeVisible()
        await capture(page, 'configure', 'upload', 'upload')
      })

      test('configurator design', async ({ page, configurationId }) => {
        await page.goto(`/${locale}/configure/design?id=${configurationId}`)
        await expect(page.getByRole('heading', { name: configure.design.title })).toBeVisible()
        await waitForImage(page, configure.design.uploadedImageAlt)
        await capture(page, 'configure', 'design', 'design')
      })

      test('configurator preview', async ({ page, configuration }) => {
        await page.goto(`/${locale}/configure/preview?id=${configuration.id}`)
        const model = MODELS.options.find(({ value }) => value === configuration.model)
        if (!model) throw new Error('Missing model in the configuration fixture')
        await expect(page.getByRole('heading', { name: configure.preview.title.replace('{model}', model.label) }))
          .toBeVisible()
        await waitForImage(page, common.phone.overlayAlt)
        await capture(page, 'configure', 'preview', 'preview')
      })

      test('signed-out navbar', async ({ page }) => {
        await page.goto(`/${locale}`)
        const nav = navbar(page)
        await expect(nav.getByRole('link').and(nav.locator(`[href="/${locale}"]`))).toBeVisible()
        const entry = mobile
          ? nav.getByRole('button', { name: common.nav.openMenu })
          : nav.getByRole('link', { name: common.nav.signIn })
        await expect(entry).toBeVisible()
        await capture(page, 'navbar', 'signed-out')
      })

      for (const state of ['buyer', 'admin'] as const) {
        test(`${state} navbar`, async ({ page, createUser, signedInAs }) => {
          const email = state === 'admin' ? process.env.ADMIN_EMAIL : undefined
          if (state === 'admin' && !email) throw new Error('Missing ADMIN_EMAIL')
          await signedInAs(await createUser({ email }))
          await page.goto(`/${locale}`)
          const nav = mobile ? await openMobileMenu(page, common.nav) : navbar(page)
          await expect(nav.getByRole('link', { name: common.nav.orders })).toBeVisible()
          const adminLink = nav.getByRole('link', { name: common.nav.dashboard })
          if (state === 'admin') await expect(adminLink).toBeVisible()
          else await expect(adminLink).toHaveCount(0)
          await capture(page, 'navbar', state === 'admin' ? 'admin' : 'signed-in')
        })
      }

      if (mobile) {
        test('open mobile menu', async ({ page }) => {
          await page.goto(`/${locale}`)
          await expect(await openMobileMenu(page, common.nav)).toBeVisible()
          await capture(page, 'navbar', 'mobile-menu-open')
        })
      } else {
        test('open currency selector', async ({ page }) => {
          await page.goto(`/${locale}`)
          const label = common.currency.changeAria.replace('{code}', CURRENCY_CONFIG[DEFAULT_CURRENCY].code)
          await navbar(page).getByRole('button', { name: label }).click()
          await expect(page.getByRole('menu').getByRole('menuitemradio')).toHaveCount(3)
          await capture(page, 'navbar', 'selector-open')
        })
      }

      test('signed-out orders', async ({ page }) => {
        await page.goto(`/${locale}/orders`)
        await expect(page.getByTestId('orders-signed-out')).toBeVisible()
        await capture(page, 'orders', 'signed-out')
      })

      test('paid orders', async ({ page, createUser, signedInAs, createPaidOrders }) => {
        const user = await createUser()
        await createPaidOrders(user)
        await signedInAs(user)
        await page.goto(`/${locale}/orders`)
        await expect(page.getByTestId('orders-list').getByRole('listitem')).toHaveCount(3)
        await capture(page, 'orders', 'list')
      })

      test('empty orders', async ({ page, createUser, signedInAs }) => {
        await signedInAs(await createUser())
        await page.goto(`/${locale}/orders`)
        await expect(page.getByTestId('orders-empty')).toBeVisible()
        await capture(page, 'orders', 'empty')
      })

      test('loading orders', async ({ page, createUser, signedInAs }) => {
        await signedInAs(await createUser())
        await withOrdersLoading(page, locale, common, async () => {
          await capture(page, 'orders', 'loading')
        })
        await expect(page.getByTestId('orders-empty')).toBeVisible()
      })

      test('orders error', async ({ page, createUser, signedInAs }) => {
        await signedInAs(await createUser())
        await showOrdersError(page, locale, common)
        await expect(page.getByTestId('orders-error').getByRole('alert')).toHaveText(orders.error.message)
        await capture(page, 'orders', 'error')
      })

      test('thank-you summary', async ({ page, createUser, createOrder, signedInAs }) => {
        const user = await createUser()
        const order = await createOrder(user, 'eur', { isPaid: true })
        await signedInAs(user)
        await page.goto(orderSummaryPath(locale, order.id))
        await expect(page.getByRole('heading', { name: thankYou.title })).toBeVisible()
        await expect(page.getByRole('status')).toHaveText(thankYou.payment.confirmed)
        await expect(page.getByText(formatMoney(order.amountCents, order.currency, locale), { exact: true })).toBeVisible()
        await waitForImage(page, common.phone.overlayAlt)
        await capture(page, 'thank-you', 'paid')
      })

      test('demo dashboard', async ({ page, createUser, createPaidOrders, signedInAs }) => {
        const sampleBuyer = await createUser()
        const sampleOrders = await createPaidOrders(sampleBuyer, { isSample: true })
        await signedInAs(await createUser())
        await page.goto(`/${locale}/dashboard`)
        await expect(page.getByRole('heading', { name: dashboard.demo.title })).toBeVisible()
        await expect(page.getByRole('region', { name: dashboard.revenue.label })).toBeVisible()
        const sampleRows = page.getByRole('row').filter({ has: page.getByText(sampleBuyer.email, { exact: true }) })
        await expect(sampleRows.getByText(dashboard.orders.sampleReadOnly)).toHaveCount(sampleOrders.length)
        await capture(page, 'dashboard', 'demo')
      })
    })
  }
}
