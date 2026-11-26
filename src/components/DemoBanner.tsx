import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import MaxWidthWrapper from './MaxWidthWrapper'

export default async function DemoBanner() {
  if (process.env.DEMO_MODE !== 'true') return null

  const t = await getTranslations('common.demoBanner')

  return (
    <aside aria-label={t('ariaLabel')} className='border-b border-green-200 bg-green-50 text-green-900'>
      <MaxWidthWrapper className='flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between'>
        <p>
          {t.rich('message', {
            label: (chunks) => <strong>{chunks}</strong>,
            card: (chunks) => <span className='whitespace-nowrap font-semibold'>{chunks}</span>,
          })}
        </p>
        <Link href='/dashboard' className='shrink-0 font-semibold underline underline-offset-4'>
          {t('dashboardLink')}
        </Link>
      </MaxWidthWrapper>
    </aside>
  )
}
