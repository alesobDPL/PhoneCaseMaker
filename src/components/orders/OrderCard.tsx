import { getTranslations } from 'next-intl/server'
import Phone from '@/components/Phone'
import { Link } from '@/i18n/navigation'
import { formatMoney, formatRegion } from '@/lib/money'
import type { UserOrder } from '@/lib/orders/get-user-orders'
import { MODELS } from '@/validators/option-validators'
import { OrderStatusBadge } from './OrderStatusBadge'

export async function OrderCard({ order, locale }: { order: UserOrder; locale: string }) {
  const t = await getTranslations('orders')
  const { id, createdAt, amountCents, currency, status, configuration } = order
  const { croppedImageUrl, model, material, finish, color } = configuration
  const modelLabel = MODELS.options.find(({ value }) => value === model)?.label
  const unspecified = t('options.unspecified')
  const date = new Intl.DateTimeFormat(formatRegion(locale), {
    dateStyle: 'long',
    timeZone: 'America/Santiago',
  }).format(createdAt)

  return (
    <Link
      href={{ pathname: '/thank-you', query: { orderId: id } }}
      className="relative grid gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground transition-colors duration-150 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-4"
    >
      <div
        role="img"
        aria-label={t(croppedImageUrl ? 'card.preview' : 'card.previewUnavailable')}
        className="isolate aspect-[896/1831] w-16"
      >
        {croppedImageUrl ? (
          <Phone aria-hidden="true" imgSrc={croppedImageUrl} />
        ) : (
          <div className="h-full rounded-lg bg-muted" />
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{t('card.number', { id: id.slice(0, 8) })}</p>
        <h2 className="font-semibold">
          {modelLabel ? t('card.title', { model: modelLabel }) : t('card.unknownModelTitle')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('card.options', {
            material: material ? t(`options.material.${material}`) : unspecified,
            finish: finish ? t(`options.finish.${finish}`) : unspecified,
            color: color ? t(`options.color.${color}`) : unspecified,
          })}
        </p>
        <p className="text-sm text-muted-foreground">
          <time dateTime={createdAt.toISOString()}>{date}</time>
        </p>
      </div>

      <div className="grid gap-2 md:justify-items-end md:text-right">
        <p className="font-semibold">{formatMoney(amountCents, currency, locale)}</p>
        <div className="absolute right-4 top-4 md:static">
          <OrderStatusBadge status={status} />
        </div>
        <span className="text-sm font-medium text-primary underline underline-offset-4">{t('viewSummary')}</span>
      </div>
    </Link>
  )
}
