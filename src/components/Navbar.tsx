import { LoginLink, LogoutLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components'
import { getSessionUser } from '@/lib/auth/session'
import { ArrowRight, Sparkles } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { CurrencySwitcher } from '@/components/CurrencySwitcher'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import MaxWidthWrapper from '@/components/MaxWidthWrapper'
import MobileNav, { NavLink } from '@/components/MobileNav'
import { buttonVariants } from '@/components/ui/button'
import { CURRENCY_CONFIG } from '@/config/currencies'
import { getAuthzEnv, isAdmin } from '@/lib/authz'
import { getCurrencyPreference } from '@/lib/currency-preference'
import { cn } from '@/lib/utils'

export default async function Navbar() {
  const [user, t, current, tCurrency] = await Promise.all([
    getSessionUser(),
    getTranslations('common.nav'),
    getCurrencyPreference(),
    getTranslations('common.currency'),
  ])
  const labels = {
    trigger: tCurrency('changeAria', { code: CURRENCY_CONFIG[current].code }),
    names: { usd: tCurrency('usd'), eur: tCurrency('eur'), clp: tCurrency('clp') },
  }
  const isSignedIn = Boolean(user)
  const showDashboard = isAdmin(user, getAuthzEnv())
  const link = cn(buttonVariants({ size: 'sm', variant: 'ghost' }),
    'gap-1 text-muted-foreground duration-150 focus-visible:ring-2 aria-[current=page]:text-foreground')

  return (
    <header className="sticky inset-x-0 top-0 z-40 h-nav border-b bg-white/75 backdrop-blur-lg dark:bg-background/75">
      <MaxWidthWrapper className="md:px-6 lg:px-20">
        <nav className="flex h-full items-center justify-between gap-2">
          <NavLink
            href="/"
            className="inline-flex min-h-touch min-w-touch items-center rounded-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t.rich('brand', { accent: (part) => <span className="text-green-600">{part}</span> })}
          </NavLink>
          <div className="hidden items-center gap-2 md:flex">
            {isSignedIn && <NavLink href="/orders" className={link}>{t('orders')}</NavLink>}
            {showDashboard && (
              <NavLink href="/dashboard" className={link}>
                <Sparkles aria-hidden="true" className="size-4" />
                {t('dashboard')}
              </NavLink>
            )}
            {isSignedIn ? (
              <LogoutLink className={link}>{t('signOut')}</LogoutLink>
            ) : (
              <>
                <LoginLink className={link}>{t('signIn')}</LoginLink>
                <RegisterLink className={link}>{t('signUp')}</RegisterLink>
              </>
            )}
            <LocaleSwitcher />
            <CurrencySwitcher current={current} labels={labels} />
            <NavLink
              href="/configure/upload"
              className={cn(buttonVariants({ size: 'sm' }), 'gap-1 duration-150 focus-visible:ring-2')}
            >
              {t('createCase')}
              <ArrowRight aria-hidden="true" className="size-4" />
            </NavLink>
          </div>
          <MobileNav
            isSignedIn={isSignedIn}
            isAdmin={showDashboard}
            currencySlot={<CurrencySwitcher variant="segmented" current={current} labels={labels} />}
          />
        </nav>
      </MaxWidthWrapper>
    </header>
  )
}
