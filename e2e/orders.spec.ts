import en from '../messages/en/orders.json'
import es from '../messages/es/orders.json'
import { expect, test } from './fixtures'

const languages = [
  { locale: 'es', browserLocale: 'es-CL', messages: es },
  { locale: 'en', browserLocale: 'en-US', messages: en },
]

const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
]

for (const { locale, browserLocale, messages } of languages) {
  test.describe(`${locale} orders`, () => {
    test.use({ locale: browserLocale })

    test('invites a signed-out buyer to sign in', async ({ page }) => {
      await page.goto(`/${locale}/orders`)

      const signedOut = page.getByTestId('orders-signed-out')
      const signIn = signedOut.getByRole('link', { name: messages.signedOut.signIn })
      await expect(signedOut.getByRole('heading', { name: messages.signedOut.title })).toBeVisible()
      await expect(signIn).toBeVisible()
      await expect(signIn).toHaveAttribute('href', /^\/api\/auth\/login\?/)

      const loginUrl = new URL((await signIn.getAttribute('href'))!, page.url())
      expect(loginUrl.searchParams.get('post_login_redirect_url')).toBe(page.url())
    })

    for (const viewport of viewports) {
      test.describe(`signed out at ${viewport.width}×${viewport.height} @screenshots`, () => {
        test.use({ viewport, reducedMotion: 'reduce' })

        test('captures the signed-out state', async ({ page }, testInfo) => {
          await page.goto(`/${locale}/orders`)
          await expect(page.getByTestId('orders-signed-out')).toBeVisible()
          await page.screenshot({
            path: testInfo.outputPath(`orders-signed-out-${locale}-${viewport.width}.png`),
            animations: 'disabled',
          })
        })
      })
    }
  })
}
