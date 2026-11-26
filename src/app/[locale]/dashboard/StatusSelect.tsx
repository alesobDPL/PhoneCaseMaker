'use client'

import { Button } from '@/components/ui/button'
import type { OrderStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { updateOrderStatus } from './actions'

export default function StatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState(status)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setSelectedStatus(status) }, [status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsUpdating(true)
    setError(null)
    try {
      await updateOrderStatus({ orderId, status: selectedStatus })
      router.refresh()
    } catch {
      setError('Unable to update this order. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-2'>
      <div className='flex items-center gap-2'>
        <label htmlFor={`status-${orderId}`} className='sr-only'>Order status</label>
        <select
          id={`status-${orderId}`}
          value={selectedStatus}
          onChange={event => setSelectedStatus(event.target.value as OrderStatus)}
          disabled={isUpdating}
          className='h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm focus-visible:outline-green-600 disabled:opacity-50'
        >
          <option value='awaiting_shipment'>Awaiting shipment</option>
          <option value='shipped'>Shipped</option>
          <option value='fulfilled'>Delivered</option>
        </select>
        <Button type='submit' size='sm' disabled={isUpdating || selectedStatus === status}>
          {isUpdating ? 'Saving…' : 'Save'}
        </Button>
      </div>
      {error && <p role='alert' className='max-w-xs text-sm text-red-600'>{error}</p>}
    </form>
  )
}
