'use server'

import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { PRICE_LIST } from '@/config/products'
import { db } from '@/db'
import { routing, type AppLocale } from '@/i18n/routing'
import { getCurrencyPreference } from '@/lib/currency-preference'
import { calculatePrice } from '@/lib/pricing'
import { stripe } from '@/lib/stripe'

export type CheckoutErrorCode = 'unauthenticated' | 'not_found' | 'invalid_currency' | 'stripe_error'

export async function createCheckoutSession({
  configId,
  locale: requestedLocale,
}: { configId: string; locale: string }): Promise<{ url: string } | { error: CheckoutErrorCode }> {
  const user = await getKindeServerSession().getUser()
  if (!user) return { error: 'unauthenticated' }

  const configuration = await db.configuration.findUnique({ where: { id: configId } })
  if (!configuration) return { error: 'not_found' }

  const preferredCurrency = await getCurrencyPreference()
  if (!Object.hasOwn(PRICE_LIST, preferredCurrency)) return { error: 'invalid_currency' }

  const { amount, currency } = calculatePrice(configuration, preferredCurrency)
  const locale: AppLocale = routing.locales.find(locale => locale === requestedLocale) ?? routing.defaultLocale

  let orderId = (await db.order.findFirst({
    where: { userId: user.id, configurationId: configuration.id, isPaid: false },
    select: { id: true },
  }))?.id

  if (orderId) {
    const { count } = await db.order.updateMany({
      where: { id: orderId, isPaid: false },
      data: { amountCents: amount, currency },
    })
    if (count === 0) orderId = undefined
  }

  if (!orderId) {
    const order = await db.order.create({
      data: { amountCents: amount, currency, userId: user.id, configurationId: configuration.id },
      select: { id: true },
    })
    orderId = order.id
  }

  const baseUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/${locale}`
  try {
    const session = await stripe.checkout.sessions.create({
      locale,
      success_url: `${baseUrl}/thank-you?orderId=${orderId}`,
      cancel_url: `${baseUrl}/configure/preview?id=${configuration.id}`,
      mode: 'payment',
      payment_method_types: ['card'],
      shipping_address_collection: { allowed_countries: ['CL', 'US', 'DE'] },
      metadata: { userId: user.id, orderId },
      line_items: [{
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: 'Custom iPhone Case',
            images: [configuration.imageUrl],
          },
        },
      }],
    })

    return session.url ? { url: session.url } : { error: 'stripe_error' }
  } catch {
    return { error: 'stripe_error' }
  }
}
