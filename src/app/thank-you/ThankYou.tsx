'use client'

import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import Phone from '@/components/Phone'
import type { getOrderSummary } from '@/lib/orders/get-order-summary'
import { formatPrice } from '@/lib/utils'
import { FINISHES, MATERIALS, MODELS } from '@/validators/option-validators'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getPaymentStatus } from './actions'

type OrderSummary = Awaited<ReturnType<typeof getOrderSummary>>

export default function ThankYou({ order }: { order: OrderSummary }) {
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
        <h1 className='text-3xl font-bold tracking-tight'>Thank you for your order</h1>
        <p role='status' className='mt-4 text-zinc-600'>
          {isError ? 'Unable to confirm your payment. Please refresh this page.' : 'Confirming your payment…'}
        </p>
      </MaxWidthWrapper>
    )
  }

  const { configuration, shippingAddress } = order
  const model = MODELS.options.find(({ value }) => value === configuration.model)?.label ?? 'Custom iPhone case'
  const material = MATERIALS.options.find(({ value }) => value === configuration.material)?.label ?? 'Silicone'
  const finish = FINISHES.options.find(({ value }) => value === configuration.finish)?.label ?? 'Smooth Finish'

  return (
    <MaxWidthWrapper className='py-16 sm:py-20'>
      <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>Thank you for your order</h1>
      <p role='status' className='mt-3 text-green-700'>Your payment is confirmed.</p>
      <p className='mt-2 break-all text-sm text-zinc-500'>Order {order.id}</p>

      <div className='mt-10 grid gap-10 sm:grid-cols-[180px_1fr]'>
        {configuration.croppedImageUrl ? (
          <Phone imgSrc={configuration.croppedImageUrl} className='mx-auto w-44' />
        ) : null}
        <div>
          <h2 className='text-xl font-semibold'>Your {model}</h2>
          <dl className='mt-5 grid max-w-md grid-cols-2 gap-3 text-sm'>
            <dt className='text-zinc-600'>Material</dt><dd>{material}</dd>
            <dt className='text-zinc-600'>Finish</dt><dd>{finish}</dd>
            <dt className='font-semibold'>Total</dt><dd className='font-semibold'>{formatPrice(order.amountCents / 100)}</dd>
          </dl>
          {shippingAddress ? (
            <section className='mt-8' aria-label='Shipping address'>
              <h2 className='font-semibold'>Shipping address</h2>
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
