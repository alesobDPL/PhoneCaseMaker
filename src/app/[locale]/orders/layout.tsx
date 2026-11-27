import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'

type OrdersLayoutProps = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function OrdersLayout({ children, params }: OrdersLayoutProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const [messages, t] = await Promise.all([getMessages(), getTranslations('orders')])

  return (
    <NextIntlClientProvider messages={{ common: messages.common, orders: messages.orders }}>
      <MaxWidthWrapper className="px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('manualStatusNote')}</p>
          </header>
          {children}
        </div>
      </MaxWidthWrapper>
    </NextIntlClientProvider>
  )
}
