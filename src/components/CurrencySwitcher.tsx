'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { setCurrency } from '@/app/actions/set-currency'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CURRENCIES, CURRENCY_CONFIG, type Currency } from '@/config/currencies'
import { cn } from '@/lib/utils'

type CurrencySwitcherProps = {
  current: Currency
  labels: { trigger: string; names: Record<Currency, string> }
  variant?: 'dropdown' | 'segmented'
}

export function CurrencySwitcher({ current, labels, variant = 'dropdown' }: CurrencySwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function selectCurrency(currency: Currency) {
    if (isPending || currency === current) return

    startTransition(async () => {
      await setCurrency(currency)
      router.refresh()
    })
  }

  if (variant === 'segmented') {
    return (
      <div
        role="group"
        aria-label={labels.trigger}
        aria-busy={isPending}
        className="inline-flex gap-1 rounded-md bg-muted p-1 transition-opacity duration-150 aria-busy:opacity-60"
      >
        {CURRENCIES.map(currency => {
          const { code } = CURRENCY_CONFIG[currency]
          const isCurrent = currency === current

          return (
            <Button
              key={currency}
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`${code} ${labels.names[currency]}`}
              aria-pressed={isCurrent}
              disabled={isPending}
              className={cn(
                'min-h-11 min-w-11 duration-150 focus-visible:ring-2 disabled:opacity-100',
                isCurrent ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
              )}
              onClick={() => selectCurrency(currency)}
            >
              {code}
            </Button>
          )
        })}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={labels.trigger}
          aria-busy={isPending}
          disabled={isPending}
          className="min-h-11 gap-1 text-foreground transition-[color,background-color,opacity] duration-150 focus-visible:ring-2 disabled:opacity-60 data-[state=open]:bg-accent md:min-h-9"
        >
          {CURRENCY_CONFIG[current].code}
          <ChevronDown aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={current}>
          {CURRENCIES.map(currency => (
            <DropdownMenuRadioItem
              key={currency}
              value={currency}
              disabled={isPending}
              className="min-h-11 text-foreground duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:min-h-0 [&>span:first-child]:hidden"
              onSelect={() => selectCurrency(currency)}
            >
              {currency === current && <Check aria-hidden="true" className="absolute left-2 size-4 text-primary" />}
              <span>
                {CURRENCY_CONFIG[currency].code} <span aria-hidden="true">·</span> {labels.names[currency]}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
