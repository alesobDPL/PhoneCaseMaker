import Link from 'next/link'
import MaxWidthWrapper from './MaxWidthWrapper'

export default function DemoBanner() {
  if (process.env.DEMO_MODE !== 'true') return null

  return (
    <aside aria-label='Demo mode' className='border-b border-green-200 bg-green-50 text-green-900'>
      <MaxWidthWrapper className='flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between'>
        <p>
          <strong>Demo mode.</strong> This is a demo. Use test card{' '}
          <span className='whitespace-nowrap font-semibold'>4242 4242 4242 4242</span>{' '}
          with any future date and any CVC.
        </p>
        <Link href='/dashboard' className='shrink-0 font-semibold underline underline-offset-4'>
          Try the admin dashboard
        </Link>
      </MaxWidthWrapper>
    </aside>
  )
}
