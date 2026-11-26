import { formatMoney } from '@/lib/money'
import en from '../messages/en/orders.json'
import es from '../messages/es/orders.json'
import { sessionClaims, sessionCookies, unsignedToken } from './auth'
import { expect, languages, orderSummaryPath, showOrdersError, test, withOrdersLoading } from './fixtures'

const messagesByLocale = { es, en }

test.describe('es session recipe', () => {
  test.use({ locale: 'es-CL' })

  test('accepts both RS256 cookies from the local issuer', async ({ page, createUser, signedInAs }) => {
    await signedInAs(await createUser())
    await page.goto('/es/orders')
    await expect(page.getByTestId('orders-empty')).toBeVisible()
    await expect(page.getByTestId('orders-signed-out')).toHaveCount(0)
  })

  test('rejects both unsigned cookies even with the admin email', async ({ page, context, createUser }) => {
    const email = process.env.ADMIN_EMAIL
    if (!email) throw new Error('Missing ADMIN_EMAIL')
    const claims = sessionClaims(await createUser({ email }))
    await context.addCookies(sessionCookies(unsignedToken(claims.id), unsignedToken(claims.access)))
    await page.goto('/es/orders')
    await expect(page.getByTestId('orders-signed-out')).toBeVisible()
  })
})

for (const { locale, browserLocale, common } of languages) {
  const messages = messagesByLocale[locale]
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

    test('lists only the signed-in buyer’s paid orders with their original currencies', async ({
      page, createUser, signedInAs, createOrder, createPaidOrders,
    }) => {
      const user = await createUser()
      const paid = await createPaidOrders(user)
      const unpaid = await createOrder(user, 'usd')
      const other = await createOrder(await createUser(), 'usd', { isPaid: true })
      await signedInAs(user)
      await page.goto(`/${locale}/orders`)

      const links = page.getByTestId('orders-list').getByRole('link')
      await expect(links).toHaveCount(paid.length)
      for (const { id, amountCents, currency } of paid) {
        const amount = page.getByText(formatMoney(amountCents, currency, locale), { exact: true })
        await expect(links.filter({ has: amount })).toHaveAttribute('href', orderSummaryPath(locale, id))
      }
      const hrefs = await links.evaluateAll(elements => elements.map(element => element.getAttribute('href')))
      expect(hrefs).not.toContain(orderSummaryPath(locale, unpaid.id))
      expect(hrefs).not.toContain(orderSummaryPath(locale, other.id))
    })

    test('shows the empty state for a buyer without paid orders', async ({ page, createUser, signedInAs }) => {
      await signedInAs(await createUser())
      await page.goto(`/${locale}/orders`)
      const empty = page.getByTestId('orders-empty')
      await expect(empty.getByRole('heading', { name: messages.empty.title })).toBeVisible()
      await expect(empty.getByRole('link', { name: messages.empty.createCase }))
        .toHaveAttribute('href', `/${locale}/configure/upload`)
    })

    test('shows a loading skeleton during client navigation', async ({ page, createUser, signedInAs }) => {
      await signedInAs(await createUser())
      await withOrdersLoading(page, locale, common, async loading => {
        await expect(loading).toHaveAttribute('aria-busy', 'true')
        await expect(loading).toHaveAccessibleName(messages.loading)
      })
      await expect(page.getByTestId('orders-empty')).toBeVisible()
    })

    test('shows the retry state on an RSC failure', async ({ page, createUser, signedInAs }) => {
      await signedInAs(await createUser())
      await showOrdersError(page, locale, common)
      const error = page.getByTestId('orders-error')
      await expect(error.getByRole('alert')).toHaveText(messages.error.message)
      await expect(error.getByRole('button', { name: messages.error.retry })).toBeVisible()
    })
  })
}
