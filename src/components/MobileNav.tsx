'use client'

import { LoginLink, LogoutLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components'
import { Menu, Sparkles, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export function NavLink({ href, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname()

  return <Link {...props} href={href} aria-current={pathname === href ? 'page' : undefined} />
}

export default function MobileNav({ isSignedIn, isAdmin, currencySlot }: {
  isSignedIn: boolean
  isAdmin: boolean
  currencySlot?: ReactNode
}) {
  const t = useTranslations('common.nav')
  const pathname = usePathname()
  const locale = useLocale()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname, locale])

  const close = () => setOpen(false)
  const iconButton = 'min-h-touch min-w-touch duration-150 focus-visible:ring-2'
  const link = cn(buttonVariants({ variant: 'ghost' }),
    'min-h-touch min-w-touch justify-start gap-2 text-muted-foreground duration-150 focus-visible:ring-2 aria-[current=page]:text-foreground')

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className={cn(iconButton, 'md:hidden')} aria-label={t('openMenu')}>
          <Menu aria-hidden="true" className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle className="text-lg font-semibold">{t('menu')}</SheetTitle>
          <SheetClose asChild>
            <Button type="button" variant="ghost" size="icon" className={iconButton} aria-label={t('closeMenu')}>
              <X aria-hidden="true" className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <nav aria-label={t('menu')} className="flex flex-col gap-4">
          {(isSignedIn || isAdmin) && (
            <div className="flex flex-col border-b pb-4">
              {isSignedIn && <NavLink href="/orders" className={link} onClick={close}>{t('orders')}</NavLink>}
              {isAdmin && (
                <NavLink href="/dashboard" className={link} onClick={close}>
                  <Sparkles aria-hidden="true" className="size-4" />
                  {t('dashboard')}
                </NavLink>
              )}
            </div>
          )}

          <div className="grid gap-4 border-b pb-4">
            <LocaleSwitcher variant="segmented" />
            {currencySlot}
          </div>

          <div className="flex flex-col">
            {isSignedIn ? (
              <LogoutLink className={link} onClick={close}>{t('signOut')}</LogoutLink>
            ) : (
              <>
                <LoginLink className={link} onClick={close}>{t('signIn')}</LoginLink>
                <RegisterLink className={link} onClick={close}>{t('signUp')}</RegisterLink>
              </>
            )}
          </div>

          <NavLink
            href="/configure/upload"
            className={cn(buttonVariants(), 'min-h-touch min-w-touch w-full duration-150 focus-visible:ring-2')}
            onClick={close}
          >
            {t('createCase')}
          </NavLink>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
