import { getTranslations } from 'next-intl/server'
import { OrdersSkeleton } from '@/components/orders/OrdersSkeleton'

export default async function OrdersLoading() {
  const t = await getTranslations('orders')
  return <OrdersSkeleton label={t('loading')} />
}
