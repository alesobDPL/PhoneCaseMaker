import { Recursive } from 'next/font/google'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const recursive = Recursive({ subsets: ['latin'] })

export default async function NotFound() {
  const t = await getTranslations({ locale: 'es', namespace: 'common.notFound' })

  return (
    <html lang="es">
      <body className={recursive.className}>
        <main className="graini-light flex min-h-[calc(100vh-var(--nav-height))] flex-col">
          <MaxWidthWrapper className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
            <h1 className="text-2xl font-semibold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
            <Link href="/es" className={cn(buttonVariants(), 'min-h-touch min-w-touch focus-visible:ring-2')}>
              {t('backHome')}
            </Link>
          </MaxWidthWrapper>
        </main>
      </body>
    </html>
  )
}
