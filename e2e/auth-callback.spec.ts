import { expect, test } from '@playwright/test'
import en from '../messages/en/common.json'
import es from '../messages/es/common.json'

const messagesByLocale = { es, en }

for (const locale of ['es', 'en'] as const) {
  test(`shows the sign-in error in ${locale} without a session`, async ({ page }) => {
    const messages = messagesByLocale[locale].authCallback
    await page.goto(`/${locale}/auth-callback`)

    const alert = page.getByRole('alert').filter({
      has: page.getByRole('heading', { name: messages.errorTitle, exact: true }),
    })
    await expect(alert).toBeVisible({ timeout: 10_000 })
    await expect(alert.getByText(messages.errorDescription, { exact: true })).toBeVisible()
    const signIn = alert.getByRole('link', { name: messages.retry, exact: true })
    await expect(signIn).toBeVisible()
    await expect(signIn).toHaveAttribute('href', /^\/api\/auth\/login(?:\?|$)/)
    await expect(page.locator('.animate-spin')).toHaveCount(0)
    await expect(page).toHaveURL(new RegExp(`/${locale}/auth-callback$`))
  })
}
