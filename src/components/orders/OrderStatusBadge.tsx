import type { OrderStatus } from '@prisma/client'
import { Clock, PackageCheck, Truck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'

const appearances = {
  awaiting_shipment: {
    icon: Clock,
    className: 'border-status-pending-border bg-status-pending text-status-pending-foreground',
  },
  shipped: {
    icon: Truck,
    className: 'border-status-shipped-border bg-status-shipped text-status-shipped-foreground',
  },
  fulfilled: {
    icon: PackageCheck,
    className: 'border-status-delivered-border bg-status-delivered text-status-delivered-foreground',
  },
}

export async function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = await getTranslations('orders.status')
  const { icon: Icon, className } = appearances[status]

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium', className)}>
      <Icon aria-hidden="true" className="size-3.5" />
      {t(status)}
    </span>
  )
}
