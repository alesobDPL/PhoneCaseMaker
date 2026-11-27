import { getTranslations } from 'next-intl/server'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export default async function NotFound() {
  const t = await getTranslations('common.notFound')

  return (
    <MaxWidthWrapper className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-muted-foreground">{t('description')}</p>
      <Link href="/" className={cn(buttonVariants(), 'min-h-touch min-w-touch focus-visible:ring-2')}>
        {t('backHome')}
      </Link>
    </MaxWidthWrapper>
  )
}
