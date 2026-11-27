'use client'

import { Button } from '@/components/ui/button'
import type { OrderStatus } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { updateOrderStatus } from './actions'

type StatusSelectProps = {
  orderId: string
  status: OrderStatus
  labels: {
    options: Record<OrderStatus, string>
    label: string
    save: string
    saving: string
    error: string
  }
}

export default function StatusSelect({ orderId, status, labels }: StatusSelectProps) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState(status)
  const [isUpdating, setIsUpdating] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => { setSelectedStatus(status) }, [status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsUpdating(true)
    setHasError(false)
    try {
      await updateOrderStatus({ orderId, status: selectedStatus })
      router.refresh()
    } catch {
      setHasError(true)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-2'>
      <div className='flex items-center gap-2'>
        <label htmlFor={`status-${orderId}`} className='sr-only'>{labels.label}</label>
        <select
          id={`status-${orderId}`}
          value={selectedStatus}
          onChange={event => setSelectedStatus(event.target.value as OrderStatus)}
          disabled={isUpdating}
          className='h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm focus-visible:outline-green-600 disabled:opacity-50'
        >
          {Object.entries(labels.options).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <Button type='submit' size='sm' disabled={isUpdating || selectedStatus === status}>
          {isUpdating ? labels.saving : labels.save}
        </Button>
      </div>
      {hasError && <p role='alert' className='max-w-xs text-sm text-red-600'>{labels.error}</p>}
    </form>
  )
}
