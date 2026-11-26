import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { CURRENCIES, DEFAULT_CURRENCY, isCurrency } from '@/config/currencies'
import { canViewDashboard, getAuthzEnv } from '@/lib/authz'
import { formatMoney } from '@/lib/money'
import { MODELS } from '@/validators/option-validators'
import { getSessionUser } from '@/lib/auth/session'
import type { OrderStatus } from '@prisma/client'
import { getFormatter, getLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { getDashboardData } from './queries'
import StatusSelect from './StatusSelect'

export default async function DashboardPage() {
  const user = await getSessionUser()
  const env = getAuthzEnv()
  if (!user || !canViewDashboard(user, env)) notFound()

  const [data, t, status, format, locale] = await Promise.all([
    getDashboardData(user, env),
    getTranslations('dashboard'),
    getTranslations('orders.status'),
    getFormatter(),
    getLocale(),
  ])
  const statusOptions: Record<OrderStatus, string> = {
    awaiting_shipment: status('awaiting_shipment'),
    shipped: status('shipped'),
    fulfilled: status('fulfilled'),
  }
  const statusSelectLabels = {
    options: statusOptions,
    label: t('statusSelect.label'),
    save: t('statusSelect.save'),
    saving: t('statusSelect.saving'),
    error: t('statusSelect.error'),
  }
  const revenueMetrics = [
    { key: 'last7Days', totals: data.revenue7dByCurrency },
    { key: 'last30Days', totals: data.revenue30dByCurrency },
  ] as const
  const columns = ['date', 'customer', 'model', 'total', 'status'] as const

  return (
    <MaxWidthWrapper className='py-12'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight text-zinc-900'>{t('title')}</h1>
        <p className='mt-2 text-zinc-600'>{t('description')}</p>
      </div>

      {env.demoMode && (
        <aside className='mb-8 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900'>
          <h2 className='font-semibold'>{t('demo.title')}</h2>
          <p className='mt-1'>{t('demo.description')}</p>
        </aside>
      )}

      <section aria-label={t('revenue.label')} className='mb-6 grid gap-4 sm:grid-cols-2'>
        {revenueMetrics.map(({ key, totals }) => {
          const amounts = CURRENCIES.flatMap(currency => {
            const cents = totals[currency]
            return cents === undefined ? [] : [{ currency, amount: formatMoney(cents, currency, locale) }]
          })

          return (
            <div key={key} className='min-w-0 rounded-lg border border-zinc-200 bg-white p-6'>
              <h2 className='text-sm text-zinc-600'>{t(`revenue.${key}`)}</h2>
              <div className='mt-2 break-words text-3xl font-semibold'>
                {amounts.length === 0
                  ? <p>{t('revenue.noSales')}</p>
                  : amounts.map(({ currency, amount }) => <p key={currency}>{amount}</p>)}
              </div>
            </div>
          )
        })}
      </section>

      <section aria-label={t('paidOrdersByStatus')} className='mb-8 grid gap-4 sm:grid-cols-3'>
        {(Object.keys(statusOptions) as OrderStatus[]).map(value => (
          <div key={value} className='rounded-lg border border-zinc-200 bg-white p-5'>
            <h2 className='text-sm text-zinc-600'>{statusOptions[value]}</h2>
            <p className='mt-2 text-2xl font-semibold'>{format.number(data.countsByStatus[value])}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby='orders-heading'>
        <h2 id='orders-heading' className='mb-4 text-xl font-semibold'>{t('orders.title')}</h2>
        <div className='overflow-x-auto rounded-lg border border-zinc-200 bg-white'>
          <table className='w-full text-left text-sm'>
            <thead className='border-b border-zinc-200 bg-zinc-50 text-zinc-600'>
              <tr>
                {columns.map(column => (
                  <th key={column} scope='col' className='whitespace-nowrap px-4 py-3 font-medium'>
                    {t(`orders.columns.${column}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-zinc-200'>
              {data.orders.map(order => {
                const currency = isCurrency(order.currency) ? order.currency : DEFAULT_CURRENCY
                const model = MODELS.options.find(({ value }) => value === order.configuration.model)?.label

                return (
                  <tr key={order.id}>
                    <td className='whitespace-nowrap px-4 py-4'>
                      <time dateTime={order.createdAt.toISOString()}>
                        {format.dateTime(order.createdAt, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </time>
                    </td>
                    <td className='px-4 py-4'>
                      <span className='block'>{order.user.email}</span>
                      {order.isSample && (
                        <span className='mt-1 inline-block rounded bg-green-50 px-2 py-0.5 text-xs text-green-700'>
                          {t('orders.sampleReadOnly')}
                        </span>
                      )}
                    </td>
                    <td className='whitespace-nowrap px-4 py-4'>{model ?? t('orders.customCase')}</td>
                    <td className='whitespace-nowrap px-4 py-4'>{formatMoney(order.amountCents, currency, locale)}</td>
                    <td className='px-4 py-4'>
                      {order.canUpdate
                        ? <StatusSelect orderId={order.id} status={order.Status} labels={statusSelectLabels} />
                        : <OrderStatusBadge status={order.Status} />}
                    </td>
                  </tr>
                )
              })}
              {data.orders.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className='px-4 py-12 text-center text-zinc-500'>{t('orders.empty')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </MaxWidthWrapper>
  )
}
