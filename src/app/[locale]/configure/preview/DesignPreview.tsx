"use client"

import Phone from '@/components/Phone'
import { Button } from '@/components/ui/button'
import { CURRENCY_CONFIG, type Currency } from '@/config/currencies'
import { PRICE_LIST } from '@/config/products'
import { formatMoney } from '@/lib/money'
import { calculatePrice } from '@/lib/pricing'
import { cn } from '@/lib/utils'
import { COLORS, MODELS } from '@/validators/option-validators'
import type { Configuration } from '@prisma/client'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Check } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'
import Confetti from "react-dom-confetti"
import { createCheckoutSession } from './actions'
import { useToast } from '@/hooks/use-toast'
import LoginModal from '@/components/LoginModal'

const DesignPreview = ({ configuration, currency }: { configuration: Configuration; currency: Currency }) => {
  const locale = useLocale()
  const t = useTranslations('configure')
  const { toast } = useToast()
  const { id, color, model, finish, material } = configuration
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const [showConfetti, setShowConfetti] = useState<boolean>(false)
  useEffect(() => setShowConfetti(true))

  const tw = COLORS.find((supportedColor) => supportedColor.value === color)?.tw
  const { label: modelLabel } = MODELS.options.find(({ value }) => value === model)!
  const prices = PRICE_LIST[currency]
  const total = calculatePrice({ material, finish }, currency).amount

  function showCheckoutError(code: 'not_found' | 'invalid_currency' | 'stripe_error') {
    toast({
      title: t(`checkoutErrors.${code}.title`),
      description: t(`checkoutErrors.${code}.description`),
      variant: 'destructive',
    })
  }

  const { mutate: createPaymentSession } = useMutation({
    mutationKey: ['get-checkout-session'],
    mutationFn: () => createCheckoutSession({ configId: id, locale }),
    onSuccess: (result) => {
      if ('url' in result && result.url) {
        window.location.href = result.url
        return
      }

      const error = 'error' in result ? result.error : undefined
      switch (error) {
        case 'unauthenticated':
          localStorage.setItem('configurationId', id)
          setIsLoginModalOpen(true)
          break
        case 'not_found':
        case 'invalid_currency':
          showCheckoutError(error)
          break
        default:
          showCheckoutError('stripe_error')
      }
    },
    onError: () => showCheckoutError('stripe_error'),
  })
  
  return (
    <>
      <div 
        aria-hidden="true"
        className='pointer-events-none selected-none absolute inset-0 
        overflow-hidden flex justify-center'>
        <Confetti 
        active={showConfetti} 
        config={{elementCount:200,spread:90}}
        />
      </div>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        setIsOpen={setIsLoginModalOpen}
        />
      
      <div className='mt-20 grid grid-cols-1 text-sm sm:grid-cols-12
            sm:grid-rows-1 sm:gap-x-6 md:gap-x-8 lg:gap-x-12'>
        <div className='sm:col-span-4 md:col-span-3 md:row-span-2
        md:row-end-2'>
          <Phone
            className={cn(`bg-${tw}`)}
            imgSrc={configuration.croppedImageUrl!}/>
        </div>

        <div className='mt-6 sm:col-span-9 sm:mt-0 md:row-end-1'>
          <h3 className='text-3xl font-bold tracking-tight text-gray-900'>
            {t('preview.title', { model: modelLabel })}
           </h3>
           <div className='mt-3 flex items-center gap-1.5 text-base'>
            <Check aria-hidden='true' className='h-4 w-4 text-green-500'/>
            {t('preview.inStock')}
           </div>
        </div>

        <div className='sm:col-span-12 md:col-span-9 text-base'>
          <div className='grid grid-cols-1 gap-y-8 border-b border-gray-200
           py-8 sm:grid-cols-2 sm:gap-x-6 sm:py-6 md:py-10'>
            <div>
              <p className='font-medium text-zinc-950'>{t('preview.highlights.title')}</p>
              <ol className='mt-3 text-zinc-700 list-disc list-inside'>
                <li>{t('preview.highlights.wirelessCharging')}</li>
                <li>{t('preview.highlights.shockAbsorption')}</li>
                <li>{t('preview.highlights.recycledPackaging')}</li>
                <li>{t('preview.highlights.printWarranty')}</li>
              </ol>
            </div>
            <div>
              <p className='font-medium text-zinc-950'>{t('preview.materials.title')}</p>
              <ol className='mt-3 text-zinc-700 list-disc list-inside'>
                  <li>{t('preview.materials.durable')}</li>
                  <li>{t('preview.materials.resistantCoating')}</li>
              </ol>
            </div>
          </div>

          <div className='mt-8'>
            <div className='bg-gray-50 p-6 sm:rounded-lg sm:p-8'>
              <div className='flow-root text-sm'>
                <div className='flex items-center justify-between py-1 mt-2'>
                  <p className='text-gray-600'>{t('preview.basePrice')}</p>
                  <p className='font-medium text-gray-900'>
                    {formatMoney(prices.base, currency, locale)}
                  </p>
                </div>

                {finish === "textured" ? (
                  <div className='flex items-center justify-between py-1 mt-2'>
                    <p className='text-gray-600'>{t(`options.finish.${finish}`)}</p>
                    <p className='font-medium text-gray-900'>
                       {formatMoney(prices.finish[finish], currency, locale)}
                    </p>
                  </div>
                ) : null}

                {material === "polycarbonate" ? (
                  <div className ='flex items-center justify-between py-1 mt-2'>
                    <p className='text-gray-600'>{t(`options.material.${material}`)}</p>
                    <p className='font-medium text-gray-900'>
                       {formatMoney(prices.material[material], currency, locale)}
                    </p>
                  </div>
                ) : null}


                <div className='my-2 h-px bg-gray-200'/>
                <div className='flex items-center justify-between py-2'>
                  <p className='font-semibold text-gray-900'>{t('preview.orderTotal')}</p>
                  <p className='font-semibold text-gray-900'>
                    {formatMoney(total, currency, locale)}
                  </p>
                </div>
                <p className='text-gray-600'>{t('preview.chargedIn', { currency: CURRENCY_CONFIG[currency].code })}</p>
              </div>
            </div>

            <div className='mt-8 flex justify-end pb-12'>
              <Button onClick={() => createPaymentSession()}
                className='px-4 sm:px-6 lg:px-8 '>
                {t('preview.checkout')}
                <ArrowRight aria-hidden='true' className='h-4 w-4 ml-1.5'/>
              </Button>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}

export default DesignPreview
