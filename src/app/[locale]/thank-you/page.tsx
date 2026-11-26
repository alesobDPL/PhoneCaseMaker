import { getOrderSummary } from '@/lib/orders/get-order-summary'
import { parseOrderIdParam } from '@/lib/orders/parse-order-id-param'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { notFound } from 'next/navigation'
import ThankYou from './ThankYou'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ThankYouPage({ searchParams }: PageProps) {
  const orderId = parseOrderIdParam((await searchParams).orderId)
  if (!orderId) notFound()

  const { getUser } = getKindeServerSession()
  const user = await getUser()
  if (!user) notFound()

  const order = await getOrderSummary(orderId, user.id)
  return <ThankYou order={order} />
}
