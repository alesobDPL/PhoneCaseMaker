import type { Metadata } from 'next'
import { Recursive } from 'next/font/google'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import type { ReactNode } from 'react'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import Providers from '@/components/Providers'
import { Toaster } from '@/components/ui/toaster'
import { routing } from '@/i18n/routing'

const recursive = Recursive({ subsets: ['latin'] })

type LocaleParams = { params: Promise<{ locale: string }> }

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  const t = await getTranslations({ locale, namespace: 'common.meta' })

  return {
    title: t('title'),
    description: t('description'),
    alternates: { languages: { es: '/es', en: '/en' } },
  }
}

export default async function LocaleLayout({ children, params }: LocaleParams & { children: ReactNode }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)

  const { common } = await getMessages()

  return (
    <html lang={locale}>
      <body className={recursive.className}>
        <NextIntlClientProvider messages={{ common }}>
          <Navbar />
          <main className="graini-light flex min-h-[calc(100vh-var(--nav-height))] flex-col">
            <div className="flex flex-1 flex-col">
              <Providers>{children}</Providers>
            </div>
            <Footer />
          </main>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
