import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import { canViewDashboard, getAuthzEnv } from '@/lib/authz'
import { formatPrice } from '@/lib/utils'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import type { OrderStatus } from '@prisma/client'
import { notFound } from 'next/navigation'
import { getDashboardData } from './queries'
import StatusSelect from './StatusSelect'

const statusLabels: Record<OrderStatus, string> = {
  awaiting_shipment: 'Awaiting shipment',
  shipped: 'Shipped',
  fulfilled: 'Delivered',
}

export default async function DashboardPage() {
  const user = await getKindeServerSession().getUser()
  const env = getAuthzEnv()
  if (!user || !canViewDashboard(user, env)) notFound()

  const data = await getDashboardData(user, env)

  return (
    <MaxWidthWrapper className='py-12'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight text-zinc-900'>Dashboard</h1>
        <p className='mt-2 text-zinc-600'>Track paid orders and manage their shipping status.</p>
      </div>

      {env.demoMode && (
        <aside className='mb-8 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900'>
          <h2 className='font-semibold'>Demo mode</h2>
          <p className='mt-1'>Visitors can view sample orders and their own paid orders, and update only their own orders. Sample orders are read-only for everyone.</p>
        </aside>
      )}

      <section aria-label='Revenue' className='mb-6 grid gap-4 sm:grid-cols-2'>
        {[
          { label: 'Revenue · last 7 days', value: data.revenue7dCents },
          { label: 'Revenue · last 30 days', value: data.revenue30dCents },
        ].map(metric => (
          <div key={metric.label} className='rounded-lg border border-zinc-200 bg-white p-6'>
            <h2 className='text-sm text-zinc-600'>{metric.label}</h2>
            <p className='mt-2 text-3xl font-semibold'>{formatPrice(metric.value / 100)}</p>
          </div>
        ))}
      </section>

      <section aria-label='Paid orders by status' className='mb-8 grid gap-4 sm:grid-cols-3'>
        {(Object.keys(statusLabels) as OrderStatus[]).map(status => (
          <div key={status} className='rounded-lg border border-zinc-200 bg-white p-5'>
            <h2 className='text-sm text-zinc-600'>{statusLabels[status]}</h2>
            <p className='mt-2 text-2xl font-semibold'>{data.countsByStatus[status]}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby='orders-heading'>
        <h2 id='orders-heading' className='mb-4 text-xl font-semibold'>Paid orders</h2>
        <div className='overflow-x-auto rounded-lg border border-zinc-200 bg-white'>
          <table className='w-full text-left text-sm'>
            <thead className='border-b border-zinc-200 bg-zinc-50 text-zinc-600'>
              <tr>
                {['Date', 'Customer', 'Model', 'Total', 'Status'].map(label => (
                  <th key={label} scope='col' className='whitespace-nowrap px-4 py-3 font-medium'>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className='divide-y divide-zinc-200'>
              {data.orders.map(order => (
                <tr key={order.id}>
                  <td className='whitespace-nowrap px-4 py-4'>
                    <time dateTime={order.createdAt.toISOString()}>
                      {order.createdAt.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                    </time>
                  </td>
                  <td className='px-4 py-4'>
                    <span className='block'>{order.user.email}</span>
                    {order.isSample && <span className='mt-1 inline-block rounded bg-green-50 px-2 py-0.5 text-xs text-green-700'>Sample · read-only</span>}
                  </td>
                  <td className='whitespace-nowrap px-4 py-4'>
                    {order.configuration.model?.replace('iphone', 'iPhone ') ?? 'Custom case'}
                  </td>
                  <td className='whitespace-nowrap px-4 py-4'>{formatPrice(order.amountCents / 100)}</td>
                  <td className='px-4 py-4'>
                    {order.canUpdate
                      ? <StatusSelect orderId={order.id} status={order.Status} />
                      : <span className='whitespace-nowrap text-zinc-600'>{statusLabels[order.Status]}</span>}
                  </td>
                </tr>
              ))}
              {data.orders.length === 0 && (
                <tr><td colSpan={5} className='px-4 py-12 text-center text-zinc-500'>No paid orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </MaxWidthWrapper>
  )
}
