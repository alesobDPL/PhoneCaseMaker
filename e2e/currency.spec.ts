import { CURRENCY_CONFIG, DEFAULT_CURRENCY } from '@/config/currencies'
import { formatMoney } from '@/lib/money'
import { calculatePrice } from '@/lib/pricing'
import { CURRENCY_COOKIE, expect, languages, navbar, previewTotal, test } from './fixtures'

for (const { locale, browserLocale, common, configure } of languages) {
  test.describe(`${locale} currency`, () => {
    test.use({ locale: browserLocale })

    test('updates the preview and the currency cookie without navigating', async ({ page, context, configuration }) => {
      await page.goto(`/${locale}/configure/preview?id=${configuration.id}`)
      const previewUrl = page.url()
      const total = previewTotal(page, configure.preview.orderTotal)
      const nav = navbar(page)
      let current = DEFAULT_CURRENCY

      const initialTotal = formatMoney(calculatePrice(configuration, current).amount, current, locale)
      await expect(total.getByText(initialTotal, { exact: true })).toBeVisible()

      for (const currency of ['eur', 'clp'] as const) {
        const label = common.currency.changeAria.replace('{code}', CURRENCY_CONFIG[current].code)
        await nav.getByRole('button', { name: label }).click()
        await page.getByRole('menuitemradio', { name: `${CURRENCY_CONFIG[currency].code} ${common.currency[currency]}` }).click()

        const expectedTotal = formatMoney(calculatePrice(configuration, currency).amount, currency, locale)
        await expect(total.getByText(expectedTotal, { exact: true })).toBeVisible()
        await expect(page).toHaveURL(previewUrl)
        await expect.poll(async () => (await context.cookies(previewUrl)).find(({ name }) => name === CURRENCY_COOKIE)?.value)
          .toBe(currency)
        current = currency
      }
    })
  })
}
