import { LoginLink } from '@kinde-oss/kinde-auth-nextjs/components'
import { getSessionUser } from '@/lib/auth/session'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { EmptyState } from '@/components/orders/EmptyState'
import { OrderCard } from '@/components/orders/OrderCard'
import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { getUserOrders } from '@/lib/orders/get-user-orders'
import { cn } from '@/lib/utils'

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const [user, t] = await Promise.all([getSessionUser(), getTranslations('orders')])
  const actionClassName = cn(buttonVariants(), 'min-h-touch min-w-touch duration-150 focus-visible:ring-2')

  if (!user) {
    return (
      <EmptyState
        data-testid="orders-signed-out"
        title={t('signedOut.title')}
        description={t('signedOut.description')}
        action={(
          <LoginLink
            className={actionClassName}
            postLoginRedirectURL={`${process.env.NEXT_PUBLIC_SERVER_URL}/${locale}/orders`}
          >
            {t('signedOut.signIn')}
          </LoginLink>
        )}
      />
    )
  }

  const orders = await getUserOrders(user.id)

  if (orders.length === 0) {
    return (
      <EmptyState
        data-testid="orders-empty"
        title={t('empty.title')}
        description={t('empty.description')}
        action={(
          <Link className={actionClassName} href="/configure/upload">
            {t('empty.createCase')}
          </Link>
        )}
      />
    )
  }

  return (
    <ul data-testid="orders-list" role="list" className="space-y-3">
      {orders.map((order) => (
        <li key={order.id}>
          <OrderCard order={order} locale={locale} />
        </li>
      ))}
    </ul>
  )
}
