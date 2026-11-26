'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export default function OrdersError({ reset }: { reset: () => void }) {
  const t = useTranslations('orders.error')

  return (
    <div data-testid="orders-error" className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card px-4 py-12 text-center text-card-foreground">
      <p role="alert">{t('message')}</p>
      <Button type="button" onClick={reset} className="min-h-touch min-w-touch duration-150 focus-visible:ring-2">
        {t('retry')}
      </Button>
    </div>
  )
}
