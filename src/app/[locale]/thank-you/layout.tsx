import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'

type ThankYouLayoutProps = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function ThankYouLayout({ children, params }: ThankYouLayoutProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const { common, thankYou, orders } = await getMessages()

  return (
    <NextIntlClientProvider messages={{ common, thankYou, orders }}>
      {children}
    </NextIntlClientProvider>
  )
}
