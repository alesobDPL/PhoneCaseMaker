import { expect, test } from '@playwright/test'
import en from '../messages/en/home.json'
import es from '../messages/es/home.json'

const languages = [
  { locale: 'es', browserLocale: 'es-CL', messages: es },
  { locale: 'en', browserLocale: 'en-US', messages: en },
]

for (const { locale, browserLocale, messages } of languages) {
  test.describe(`${locale} home`, () => {
    test.use({ locale: browserLocale })

    test('home responds with 200 and shows the main heading', async ({ page }) => {
      const response = await page.goto(`/${locale}`)
      expect(response?.status()).toBe(200)
      await expect(page.getByRole('heading', {
        level: 1,
        name: messages.hero.title.replace(/<\/?accent>/g, ''),
        exact: true,
      })).toBeVisible()
    })
  })
}
