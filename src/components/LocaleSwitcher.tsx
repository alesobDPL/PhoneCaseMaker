'use client'

import { ItemIndicator, RadioItem } from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown, Languages } from 'lucide-react'
import { hasLocale, useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePathname, useRouter } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'

export default function LocaleSwitcher({ variant = 'dropdown' }: { variant?: 'dropdown' | 'segmented' }) {
  const t = useTranslations('common.locale')
  const current = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  function changeLocale(locale: string) {
    if (locale === current || !hasLocale(routing.locales, locale)) return

    router.replace({ pathname, query: window.location.search }, { locale })
  }

  if (variant === 'segmented') {
    return (
      <div className="grid gap-2">
        <div className="text-sm font-medium">{t('label')}</div>
        <div role="group" aria-label={t('label')} className="flex gap-1 rounded-md bg-muted p-1">
          {routing.locales.map((locale) => (
            <button
              key={locale}
              type="button"
              lang={locale}
              aria-label={t(locale)}
              aria-pressed={locale === current}
              className={cn(
                'min-h-touch min-w-touch flex-1 rounded-sm text-sm font-medium transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                locale === current ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
              )}
              onClick={() => changeLocale(locale)}
            >
              {t(`${locale}Code`)}
            </button>
          ))}
        </div>
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
          className="group h-9 min-h-touch min-w-touch gap-1 text-foreground duration-150 focus-visible:ring-2 data-[state=open]:bg-accent md:min-h-0 md:min-w-0"
          aria-label={t('changeAria', { current: t(current) })}
        >
          <Languages aria-hidden="true" className="size-4" />
          {t(`${current}Code`)}
          <ChevronDown aria-hidden="true" className="size-4 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="duration-150 motion-reduce:animate-none">
        <DropdownMenuRadioGroup value={current} onValueChange={changeLocale}>
          {routing.locales.map((locale) => (
            <RadioItem
              key={locale}
              value={locale}
              lang={locale}
              className="relative flex min-h-touch select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-foreground outline-none transition-colors duration-150 data-[highlighted]:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:min-h-0"
            >
              <ItemIndicator className="absolute left-2 text-primary">
                <Check aria-hidden="true" className="size-4" />
              </ItemIndicator>
              {t(locale)}
            </RadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
