import type { APIRequestContext } from '@playwright/test'
import type { Order } from '@prisma/client'
import { CURRENCY_CONFIG } from '@/config/currencies'
import { formatMoney } from '@/lib/money'
import { calculatePrice } from '@/lib/pricing'
import { signedStripeRequest } from '../tests/helpers/stripe'
import { CURRENCY_COOKIE, expect, languages, orderSummaryPath, previewTotal, test } from './fixtures'

async function completeCheckout(request: APIRequestContext, order: Order, currency = order.currency) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('Missing STRIPE_WEBHOOK_SECRET')

  const signed = signedStripeRequest({
    id: `evt_${order.id}`,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: `cs_test_${order.id}`,
        metadata: { orderId: order.id, userId: order.userId },
        amount_total: order.amountCents,
        currency,
      },
    },
  }, secret)

  const response = await request.post('/api/webhooks', {
    headers: Object.fromEntries(signed.headers),
    data: await signed.text(),
  })
  expect(response.status()).toBe(200)
}

for (const { locale, browserLocale, configure } of languages) {
  test.describe(`${locale} checkout webhook`, () => {
    test.use({ locale: browserLocale })

    for (const currency of ['eur', 'clp'] as const) {
      test(`lists the paid ${currency} order with the preview total`, async ({
        page, context, baseURL, request, configuration, createUser, signedInAs, createOrder, prisma,
      }) => {
        await context.addCookies([{ name: CURRENCY_COOKIE, value: currency, url: new URL('/', baseURL).href }])
        await page.goto(`/${locale}/configure/preview?id=${configuration.id}`)
        const price = calculatePrice(configuration, currency)
        const expectedTotal = formatMoney(price.amount, currency, locale)
        const total = previewTotal(page, configure.preview.orderTotal)
        await expect(total.getByText(expectedTotal, { exact: true })).toBeVisible()
        await expect(page.getByText(configure.preview.chargedIn.replace('{currency}', CURRENCY_CONFIG[currency].code)))
          .toBeVisible()

        const user = await createUser()
        const order = await createOrder(user, currency)
        expect(order).toMatchObject({ isPaid: false, currency, amountCents: price.amount })
        await completeCheckout(request, order)
        expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
          .toMatchObject({ isPaid: true, currency, amountCents: price.amount })

        await signedInAs(user)
        await page.goto(`/${locale}/orders`)
        const orderLink = page.getByTestId('orders-list').getByRole('link')
        await expect(orderLink).toHaveAttribute('href', orderSummaryPath(locale, order.id))
        await expect(orderLink.getByText(expectedTotal, { exact: true })).toBeVisible()
      })
    }

    test('keeps an order unpaid when the webhook currency differs', async ({
      page, request, createUser, signedInAs, createOrder, prisma,
    }) => {
      const user = await createUser()
      const order = await createOrder(user, 'eur')
      await completeCheckout(request, order, 'clp')
      expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } }))
        .toMatchObject({ isPaid: false, currency: 'eur', amountCents: order.amountCents })

      await signedInAs(user)
      await page.goto(`/${locale}/orders`)
      await expect(page.getByTestId('orders-empty')).toBeVisible()
    })
  })
}
