'use client'

import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Phone from '@/components/Phone'
import { formatMoney } from '@/lib/money'
import type { getOrderSummary } from '@/lib/orders/get-order-summary'
import { MODELS } from '@/validators/option-validators'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getPaymentStatus } from './actions'

type OrderSummary = Awaited<ReturnType<typeof getOrderSummary>>

export default function ThankYou({ order }: { order: OrderSummary }) {
  const locale = useLocale()
  const t = useTranslations('thankYou')
  const orders = useTranslations('orders')
  const router = useRouter()
  const { data, isError } = useQuery({
    queryKey: ['payment-status', order.id],
    queryFn: () => getPaymentStatus({ orderId: order.id }),
    initialData: { isPaid: order.isPaid },
    enabled: !order.isPaid,
    retry: false,
    refetchInterval: (query) => query.state.data?.isPaid || query.state.error ? false : 2000,
  })

  useEffect(() => {
    if (data.isPaid && !order.isPaid) router.refresh()
  }, [data.isPaid, order.isPaid, router])

  if (!order.isPaid) {
    return (
      <MaxWidthWrapper className='py-20 text-center'>
        <h1 className='text-3xl font-bold tracking-tight'>{t('title')}</h1>
        <p role='status' className='mt-4 text-zinc-600'>
          {t(isError ? 'payment.error' : 'payment.pending')}
        </p>
      </MaxWidthWrapper>
    )
  }

  const { configuration, shippingAddress } = order
  const { material, finish } = configuration
  const model = MODELS.options.find(({ value }) => value === configuration.model)?.label

  return (
    <MaxWidthWrapper className='py-16 sm:py-20'>
      <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>{t('title')}</h1>
      <p role='status' className='mt-3 text-green-700'>{t('payment.confirmed')}</p>
      <p className='mt-2 break-all text-sm text-zinc-500'>{t('orderNumber', { id: order.id })}</p>

      <div className='mt-10 grid gap-10 sm:grid-cols-[180px_1fr]'>
        {configuration.croppedImageUrl ? (
          <Phone
            imgSrc={configuration.croppedImageUrl}
            role='img'
            aria-label={orders('card.preview')}
            className='mx-auto w-44'
          />
        ) : null}
        <div>
          <h2 className='text-xl font-semibold'>
            {model ? t('modelTitle', { model }) : orders('card.unknownModelTitle')}
          </h2>
          <dl className='mt-5 grid max-w-md grid-cols-2 gap-3 text-sm'>
            <dt className='text-zinc-600'>{t('material')}</dt>
            <dd>{material ? orders(`options.material.${material}`) : orders('options.unspecified')}</dd>
            <dt className='text-zinc-600'>{t('finish')}</dt>
            <dd>{finish ? orders(`options.finish.${finish}`) : orders('options.unspecified')}</dd>
            <dt className='font-semibold'>{t('total')}</dt>
            <dd className='font-semibold'>{formatMoney(order.amountCents, order.currency, locale)}</dd>
          </dl>
          {shippingAddress ? (
            <section className='mt-8' aria-label={t('shippingAddress')}>
              <h2 className='font-semibold'>{t('shippingAddress')}</h2>
              <address className='mt-3 text-sm not-italic leading-6 text-zinc-600'>
                {shippingAddress.name}<br />
                {shippingAddress.street}<br />
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}<br />
                {shippingAddress.country}
              </address>
            </section>
          ) : null}
        </div>
      </div>
    </MaxWidthWrapper>
  )
}
