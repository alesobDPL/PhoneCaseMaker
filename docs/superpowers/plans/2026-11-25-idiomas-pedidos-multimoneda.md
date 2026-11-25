# Idiomas ES/EN, "Mis pedidos" y multimoneda (F6, F7, F8) · Plan de implementación

[Planes](README.md) · [Diseño aprobado](../specs/2026-11-25-idiomas-pedidos-multimoneda-design.md) · [Inicio](../../00-inicio.md)

Fecha: 2026-11-25 · Estado: **Propuesto** (pendiente de aprobación del propietario)

Ejecución: encargos a Codex por lotes (ver la tabla final), cada uno en su worktree y rama, sobre la rama de la funcionalidad `feat/f6-f8-idiomas-pedidos-moneda`. Claude integra cada lote completo antes de lanzar el siguiente.

> **Para agentes:** sigue solo la tarea de tu encargo y las reglas de `AGENTS.md`. Los pasos usan casillas (`- [ ]`). Prueba primero: escribe la prueba, mírala fallar, implementa, mírala pasar.

**Goal:** Interfaz en español e inglés con el idioma en la URL, página "Mis pedidos" para el comprador y cobro en USD, EUR o CLP con precio calculado y verificado en el servidor.

**Architecture:** `next-intl` con segmento `src/app/[locale]/` y `middleware.ts` que no toca `api/**`; mensajes en `messages/{es,en}/<espacio>.json`, uno por encargo. El dinero es una lista fija por moneda en unidad menor (`src/config/products.ts`), un único cálculo (`calculatePrice`) y un único formateador (`formatMoney`); la moneda elegida vive en la cookie `CURRENCY` y se guarda en `Order.currency`. El webhook solo marca pagado si monto y moneda coinciden.

**Tech Stack:** Next.js 15 (App Router), TypeScript, next-intl 4, Prisma 5 + PostgreSQL, Stripe 17, Tailwind + Radix (shadcn), Vitest (unitarias e integración con Testcontainers), Playwright.

**Spec:** [`docs/superpowers/specs/2026-11-25-idiomas-pedidos-multimoneda-design.md`](../specs/2026-11-25-idiomas-pedidos-multimoneda-design.md) (Aprobado 2026-11-25). Decisiones: [ADR-001](../../decisiones/ADR-001-idiomas-next-intl-prefijo-url.md) y [ADR-002](../../decisiones/ADR-002-multimoneda-lista-fija-unidad-menor.md) (Propuestos).

## Global Constraints

- Idiomas `es` (defecto) y `en`; `localePrefix: 'always'`; cookie `NEXT_LOCALE` (1 año, `SameSite=Lax`), luego `Accept-Language`, luego `es`.
- `middleware.ts` excluye `api`, `_next`, `_vercel` y rutas con extensión: matcher `'/((?!api|_next|_vercel|.*\\..*).*)'`.
- Regiones de formato: `es` → `es-CL`, `en` → `en-US`. Zona horaria fija de next-intl: `America/Santiago`.
- Mensajes: `messages/{es,en}/{common,home,configure,orders,thank-you,dashboard}.json`; en código el espacio `thank-you` se llama `thankYou`. Cada archivo tiene un único encargo dueño por lote.
- Ningún texto visible escrito en componentes, acciones o páginas que el encargo cree o edite: solo en mensajes (`AGENTS.md` regla 11). Identificadores en inglés.
- Monedas `usd`, `eur`, `clp` (minúsculas en código, base de datos y Stripe); unidades menores por unidad 100, 100 y 1.
- Precios en unidad menor: USD base `14_00`, policarbonato `+5_00`, texturizado `+3_00`; EUR `13_00`, `+5_00`, `+3_00`; CLP `13_990`, `+4_990`, `+2_990`. Sin tasas de cambio.
- Nadie divide por 100 ni formatea montos fuera de `src/lib/money.ts`.
- Moneda por defecto `usd`; cookie `CURRENCY` (1 año, `SameSite=Lax`, `path=/`), validada en el servidor; inválida o ausente → `usd`.
- `Order.currency` `String @default("usd")`; `amountCents` conserva su nombre y significa "unidad menor de `currency`". Migración solo aditiva.
- Autorización y precio siempre en el servidor. Ninguna dependencia nueva salvo `next-intl` (la instala Claude en el worktree de la Tarea A antes de lanzarla).
- Iconos `lucide-react` con `aria-hidden`; sin emojis. Solo tokens y componentes de spec §4.
- Windows: `npm.cmd` y `npx.cmd`. Codex no ejecuta `npm install`, Playwright con servidor ni Docker: Claude ejecuta `test:e2e`, `test:integration` y `build`.

## Review Focus

1. **Middleware sobre `api/**`** (Kinde, UploadThing, webhook de Stripe): una petición a `/api/webhooks` nunca se redirige a `/es/...`. Prueba en Tarea A, paso A6.
2. **Cookie `CURRENCY` manipulada** (`xyz`, `''`, `EUR` en mayúsculas, valor larguísimo): cae a `usd` o se normaliza, nunca lanza. Prueba en Tarea B, paso B3.
3. **CLP cobrado ×100 o con decimales**: `unit_amount` de Stripe para CLP es `13990`, no `1399000`; `formatMoney` no muestra decimales. Pruebas en Tarea B (B2, B4) y Tarea C (C2).
4. **Cambio de idioma en una URL profunda con query** (`/es/configure/preview?id=…`): llega a `/en/configure/preview?id=…` sin perder el `id`. Prueba en Tarea A, paso A6.
5. **Prefijo desconocido** (`/fr/configure/upload`): muestra la página 404 localizada, no un error 500. Prueba en Tarea A, paso A6.

---

## Encargos y paralelismo

| Lote | Encargo | Tarea | Integración |
| --- | --- | --- | --- |
| 0 | B · Base de dinero | Tarea B | primero |
| 0 | A · Base de idiomas | Tarea A | segundo, rebasado sobre B |
| 1 | C · Cobro multimoneda | Tarea C | primero |
| 1 | D · Mis pedidos | Tarea D | segundo |
| 1 | E · Configurador traducido y con moneda | Tarea E | tercero, rebasado sobre C (usa su contrato) |
| 2 | F · Portada y comunes | Tarea F | cualquiera |
| 2 | G · Resumen y panel | Tarea G | cualquiera |
| 2 | H · Pruebas de extremo a extremo | Tarea H | último; capturas finales tras F y G |

Requisito previo: E7 (`onUploadError`) integrado en `main` y la rama `feat/f6-f8-idiomas-pedidos-moneda` creada desde ese `main` con este plan y el spec commiteados.

---

## Lote 0

### Tarea B · Base de dinero

**Files:**
- Create: `src/config/currencies.ts`, `src/lib/money.ts`, `src/lib/currency-preference.ts`, `src/app/actions/set-currency.ts`, `src/components/CurrencySwitcher.tsx`, `prisma/migrations/20261125120000_order_currency/migration.sql`, `tests/unit/money.test.ts`, `tests/unit/currency-preference.test.ts`
- Modify: `src/config/products.ts`, `src/lib/pricing.ts`, `prisma/schema.prisma` (modelo `Order`), `prisma/seed.ts`, `tests/unit/pricing.test.ts`

**Interfaces:**
- Produces (`src/config/currencies.ts`):
  - `CURRENCIES = ['usd', 'eur', 'clp'] as const`; `type Currency = (typeof CURRENCIES)[number]`; `DEFAULT_CURRENCY: Currency = 'usd'`
  - `CURRENCY_CONFIG: Record<Currency, { code: 'USD' | 'EUR' | 'CLP'; minorUnitsPerUnit: 100 | 1 }>`
  - `STRIPE_MINIMUM_AMOUNT: Record<Currency, number>` = `{ usd: 50, eur: 50, clp: 500 }` (unidad menor; comentario con la referencia pública de mínimos de Stripe; CLP es una aproximación conservadora de 0,50 USD)
  - `isCurrency(value: unknown): value is Currency`
- Produces (`src/config/products.ts`): `PRICE_LIST: Record<Currency, { base: number; material: { silicone: number; polycarbonate: number }; finish: { smooth: number; textured: number } }>` con los valores de Global Constraints. `BASE_PRICE` y `PRODUCT_PRICES` siguen exportados como alias de `PRICE_LIST.usd` hasta la Tarea G.
- Produces (`src/lib/pricing.ts`): `calculatePrice(configuration: Pick<Configuration, 'material' | 'finish'>, currency: Currency): { amount: number; currency: Currency }`; `calculatePriceCents(configuration)` queda como envoltorio de `calculatePrice(configuration, 'usd').amount` (se elimina en la Tarea G). `null` → `silicone` / `smooth` como hoy.
- Produces (`src/lib/money.ts`): `formatRegion(locale: string): 'es-CL' | 'en-US'` (`'es'` → `es-CL`, cualquier otro → `en-US`); `formatMoney(amount: number, currency: Currency, locale: string): string` con `Intl.NumberFormat(formatRegion(locale), { style: 'currency', currency: code, minimumFractionDigits: d, maximumFractionDigits: d })`, `d = 2` si `minorUnitsPerUnit = 100`, `0` si es `1`, y `amount / minorUnitsPerUnit`.
- Produces (`src/lib/currency-preference.ts`): `CURRENCY_COOKIE = 'CURRENCY'`; `CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365`; `parseCurrency(value: string | undefined | null): Currency` (recorta y pasa a minúsculas; si no es válida → `DEFAULT_CURRENCY`); `getCurrencyPreference(): Promise<Currency>` (lee `(await cookies()).get(CURRENCY_COOKIE)?.value` y aplica `parseCurrency`).
- Produces (`src/app/actions/set-currency.ts`, `"use server"`): `setCurrency(value: string): Promise<{ currency: Currency }>`; normaliza con `parseCurrency`, escribe la cookie (`maxAge` anterior, `sameSite: 'lax'`, `path: '/'`, `httpOnly: true`, `secure` en producción) y devuelve la moneda guardada. Nunca lanza por un valor inválido.
- Produces (`src/components/CurrencySwitcher.tsx`, `"use client"`): `CurrencySwitcher(props: { current: Currency; labels: { trigger: string; names: Record<Currency, string> }; variant?: 'dropdown' | 'segmented' })`. **No importa `next-intl`**: quien lo monte (Tarea C) pasa los textos de `common.currency.*`. `dropdown` (escritorio) y `segmented` (menú móvil) según spec §4.1–4.2; al elegir llama a `setCurrency` dentro de `useTransition` y luego `router.refresh()`; mientras está pendiente, `aria-busy` y opacidad 60 %. No se monta en el navbar en este lote.
- Produces (Prisma): `Order.currency String @default("usd")`.

- [ ] **B1: Pruebas de precio por moneda.** Reescribe `tests/unit/pricing.test.ts`: `describe('calculatePrice')` con `it.each` sobre las 12 combinaciones (3 monedas × 2 materiales × 2 acabados). Valores esperados: USD 1400/1900/1700/2200; EUR 1300/1800/1600/2100; CLP 13990/18980/16980/21970 (orden: silicona-liso, policarbonato-liso, silicona-texturizado, policarbonato-texturizado). Además: `calculatePrice({ material: null, finish: null }, 'clp')` → `{ amount: 13990, currency: 'clp' }`; `calculatePriceCents` sigue devolviendo 1400/2200; y `it('keeps every price above the Stripe minimum')` recorre `CURRENCIES` y comprueba `calculatePrice({ material: 'silicone', finish: 'smooth' }, c).amount > STRIPE_MINIMUM_AMOUNT[c]`.
- [ ] **B2: Pruebas de formato.** En `tests/unit/money.test.ts` (sin fijar espacios: normaliza ` ` y ` ` a espacio antes de comparar):
  - `formatMoney(1400, 'usd', 'en')` contiene `14.00` y empieza por `$`; `formatMoney(1400, 'usd', 'es')` contiene `14,00`.
  - `formatMoney(1300, 'eur', 'en')` contiene `13.00` y `€`; con `'es'` contiene `13,00`.
  - `formatMoney(13990, 'clp', 'es')` contiene `13.990` y no contiene `,`; con `'en'` contiene `13,990` y no contiene `.`.
  - `formatRegion('es')` → `'es-CL'`; `formatRegion('en')` → `'en-US'`; `formatRegion('fr')` → `'en-US'`.
- [ ] **B3: Pruebas de preferencia.** En `tests/unit/currency-preference.test.ts`: `parseCurrency('eur')` → `'eur'`; `' CLP '` → `'clp'`; `'xyz'`, `''`, `undefined`, `null`, `'usd;eur'` y una cadena de 5 000 caracteres → `'usd'`. `isCurrency('EUR')` → `false` (solo minúsculas).
- [ ] **B4: Ejecuta y mira fallar.** `npx.cmd vitest run tests/unit/pricing.test.ts tests/unit/money.test.ts tests/unit/currency-preference.test.ts` → FAIL (módulos o exports inexistentes).
- [ ] **B5: Implementa** `currencies.ts`, `PRICE_LIST` en `products.ts`, `calculatePrice` y el envoltorio, `money.ts` y `currency-preference.ts` con las firmas de Interfaces.
- [ ] **B6: Ejecuta y mira pasar** el mismo comando → PASS.
- [ ] **B7: Esquema y migración.** Añade `currency String @default("usd")` a `Order` con un comentario `/// Minor-unit amount currency; amountCents is in this currency's minor unit.` sobre `amountCents`. Escribe a mano `prisma/migrations/20261125120000_order_currency/migration.sql` con `ALTER TABLE "Order" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'usd';`. Ejecuta `npx.cmd prisma validate` y `npx.cmd prisma generate` → sin errores.
- [ ] **B8: Datos de ejemplo.** En `prisma/seed.ts`, cada pedido de ejemplo `index` usa `currency = CURRENCIES[index % 3]` y `amountCents = calculatePrice(configuration, currency).amount`; guarda `currency`. Mensaje de consola: `Seeded 8 paid sample orders in USD, EUR and CLP for 3 example users.`
- [ ] **B9: Acción y selector.** Implementa `setCurrency` y `CurrencySwitcher` (sin textos propios; todo de `labels`). El `aria-label` del disparador es `labels.trigger`.
- [ ] **B10: Verifica.** `npm.cmd run test:unit`, `npm.cmd run typecheck`, `npm.cmd run lint` → verdes. Claude: `npm.cmd run test:integration` (la migración se aplica y los pedidos existentes quedan en `usd`) y `npm.cmd run build`.

### Tarea A · Base de idiomas

**Files:**
- Create: `middleware.ts`, `src/i18n/routing.ts`, `src/i18n/navigation.ts`, `src/i18n/namespaces.ts`, `src/i18n/request.ts`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/not-found.tsx`, `src/app/[locale]/[...rest]/page.tsx`, `src/components/LocaleSwitcher.tsx`, `src/components/MobileNav.tsx`, `src/components/ui/sheet.tsx`, `messages/es/*.json` y `messages/en/*.json` (seis por idioma), `tests/unit/messages.test.ts`, `e2e/i18n.spec.ts`
- Move (Codex mueve en el árbol de trabajo sin cambiar contenido salvo imports y rutas; Claude comprueba al recoger que git lo detecta como renombrado): `src/app/page.tsx`, `src/app/auth-callback/**`, `src/app/configure/**`, `src/app/dashboard/**`, `src/app/thank-you/**` → `src/app/[locale]/…`. `src/app/api/**`, `src/app/favicon.ico` y `src/app/globals.css` no se mueven.
- Modify: `package.json` y `package-lock.json` (solo los deja Claude con `next-intl`), `next.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `tailwind.config.ts`, `src/components/Navbar.tsx`, `tests/integration/{checkout,dashboard,thank-you}.test.ts` (solo la ruta del `import`), `e2e/configure.spec.ts`, `e2e/screenshots.spec.ts`, `e2e/smoke.spec.ts` (solo rutas con prefijo)

**Interfaces:**
- Produces (`src/i18n/routing.ts`): `routing = defineRouting({ locales: ['es', 'en'], defaultLocale: 'es', localePrefix: 'always', localeCookie: { name: 'NEXT_LOCALE', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' } })`; `type AppLocale = (typeof routing.locales)[number]`.
- Produces (`src/i18n/navigation.ts`): `export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)`. Todo enlace interno nuevo o editado usa este `Link`.
- Produces (`src/i18n/namespaces.ts`, sin imports de next-intl): `NAMESPACES = ['common', 'home', 'configure', 'orders', 'thank-you', 'dashboard'] as const`; `namespaceKey(file: (typeof NAMESPACES)[number]): string` (`'thank-you'` → `'thankYou'`, el resto igual).
- Produces (`src/i18n/request.ts`): `getRequestConfig` que valida el idioma con `hasLocale`, importa los seis archivos del idioma con la lista fija y devuelve `{ locale, messages, timeZone: 'America/Santiago' }`.
- Produces (`src/app/[locale]/layout.tsx`): `<html lang={locale}>`, fuente Recursive, `Navbar`, `Footer`, `Providers`, `Toaster`; `NextIntlClientProvider` con solo `common` para los componentes cliente; `generateStaticParams` con los dos idiomas; `setRequestLocale(locale)`; `notFound()` si el idioma no es válido; `generateMetadata` con `alternates.languages` `{ es: '/es', en: '/en' }` (el título y la descripción definitivos los pone la Tarea F; aquí salen de `common.meta.title` y `common.meta.description`).
- Produces (`src/app/layout.tsx`): devuelve `children` (el `<html>` vive en `[locale]/layout.tsx`).
- Produces (mensajes): `common` poblado en `es` y `en` con las claves de spec §4.4 más las que usan Navbar, LocaleSwitcher, MobileNav y la 404: `nav.signIn`, `nav.signUp`, `nav.signOut`, `nav.dashboard`, `nav.menu`, `locale.changeAria` (`"Cambiar idioma, actual: {current}"` / `"Change language, current: {current}"`), `locale.es` = `Español`, `locale.en` = `English` (iguales en ambos archivos), `currency.changeAria` (`"Cambiar moneda, actual: {code}"` / `"Change currency, current: {code}"`), `notFound.title`, `notFound.description`, `notFound.backHome`, `meta.title`, `meta.description`. Los otros cinco espacios: `{}`.
- Produces (tokens, spec §4.1): en `globals.css` `--status-pending`, `--status-pending-foreground`, `--status-pending-border` y lo mismo para `shipped` y `delivered` (HSL, con variante `.dark`), `--nav-height: 3.5rem`, `--touch-target: 2.75rem`; en `tailwind.config.ts` colores `status.pending.DEFAULT|foreground|border` (ídem `shipped`, `delivered`), `spacing.nav` y `minHeight/minWidth.touch` → `var(--touch-target)`.
- Produces (componentes): `LocaleSwitcher(props: { variant?: 'dropdown' | 'segmented' })` cliente; `MobileNav(props: { isSignedIn: boolean; isAdmin: boolean; currencySlot?: React.ReactNode })` cliente; `Sheet`, `SheetTrigger`, `SheetContent` (`side: 'right'`), `SheetHeader`, `SheetTitle`, `SheetClose` en `src/components/ui/sheet.tsx` sobre `@radix-ui/react-dialog`. `currencySlot` lo llena la Tarea C.

- [ ] **A0 (Claude, antes de lanzar):** en el worktree de A, `npm.cmd install next-intl@4` y registrar la versión exacta en el encargo. Codex no toca `package.json` ni `package-lock.json`.
- [ ] **A1: Prueba de paridad.** `tests/unit/messages.test.ts` lee `messages/{es,en}/<archivo>.json` para cada entrada de `NAMESPACES`: ambos existen; mismas claves aplanadas (`a.b.c`); mismos marcadores ICU `{nombre}` por clave; en archivos no vacíos ningún valor es cadena vacía; `common` contiene todas las claves de spec §4.4.
- [ ] **A2: Ejecuta y mira fallar.** `npx.cmd vitest run tests/unit/messages.test.ts` → FAIL (faltan archivos).
- [ ] **A3: Mensajes y configuración.** Crea los doce JSON, `namespaces.ts`, `routing.ts`, `navigation.ts`, `request.ts`, `middleware.ts` (`createMiddleware(routing)` y el matcher de Global Constraints) y el plugin `createNextIntlPlugin()` en `next.config.mjs` conservando `images.domains`. Mismo comando → PASS.
- [ ] **A4: Traslado de páginas.** Mueve las páginas a `src/app/[locale]/` sin traducirlas; actualiza imports relativos y los `import` de `@/app/...` en las tres pruebas de integración (`@/app/[locale]/configure/preview/actions`, `@/app/[locale]/dashboard/queries`, `@/app/[locale]/dashboard/actions`, `@/app/[locale]/thank-you/actions`). `auth-callback` navega con el `useRouter` de `@/i18n/navigation`. Los enlaces sin prefijo que queden en archivos de otros lotes siguen funcionando porque el middleware los redirige.
- [ ] **A5: Layouts, 404, tokens y navbar.** Implementa los dos layouts, `[locale]/not-found.tsx` (textos de `common.notFound`, botón a la portada), `[...rest]/page.tsx` (llama a `notFound()`), tokens, `sheet.tsx`, `LocaleSwitcher` (cambia con `router.replace({ pathname, query }, { locale })` conservando la query; ítems con `lang`), `MobileNav` (spec §4.2: orden, 44×44, cierre con Escape, clic fuera, `X` y al navegar) y `Navbar` (spec §4.2 y §4.3; "Mis pedidos" a `/orders` si hay sesión, Dashboard con icono `Sparkles` si es admin, `aria-current="page"` en el enlace activo; todos los textos de `common`).
- [ ] **A6: Pruebas e2e de idioma** en `e2e/i18n.spec.ts`:
  - `/` sin cookie ni `Accept-Language` → URL `/es`, `html[lang="es"]`.
  - Con cookie `NEXT_LOCALE=en` → `/en`; con `Accept-Language: en-US` y sin cookie → `/en`.
  - `/auth-callback?x=1` → `/es/auth-callback?x=1`.
  - `request.get('/api/webhooks', { maxRedirects: 0 })` → el estado no es 307/308 y no hay cabecera `location` hacia `/es` (Review Focus 1).
  - En `/es/configure/preview?id=<E2E_CONFIGURATION_ID>`, elegir "English" en el selector → URL `/en/configure/preview?id=<mismo id>` y cookie `NEXT_LOCALE=en` (Review Focus 4).
  - `/fr/configure/upload` → estado 404 y texto de `common.notFound.title` en `es` (Review Focus 5).
  - A 375×812, el botón de menú abre el panel, Escape lo cierra y el foco vuelve al disparador.
  Ajusta las rutas de `configure.spec.ts`, `screenshots.spec.ts` y `smoke.spec.ts` al prefijo `/es`.
- [ ] **A7: Verifica.** `npm.cmd run test:unit`, `npm.cmd run typecheck`, `npm.cmd run lint` → verdes. Claude: `npm.cmd run test:e2e`, `npm.cmd run test:integration`, `npm.cmd run build`, y capturas del navbar (sin sesión) y del menú móvil abierto a 375, 768 y 1280 en `es` y `en`.

---

## Lote 1

### Tarea C · Cobro multimoneda

**Files:**
- Modify: `src/app/[locale]/configure/preview/actions.ts`, `src/lib/orders/handle-checkout-completed.ts`, `src/app/api/webhooks/route.ts`, `src/app/[locale]/dashboard/queries.ts`, `src/components/Navbar.tsx` y `src/components/MobileNav.tsx` (solo montar `CurrencySwitcher`), `tests/integration/{checkout,webhook,dashboard}.test.ts`, `tests/helpers/stripe.ts`

**Interfaces:**
- Consumes: `calculatePrice`, `getCurrencyPreference`, `CURRENCY_CONFIG`, `CurrencySwitcher` (Tarea B); `routing`, `AppLocale`, `MobileNav.currencySlot` (Tarea A).
- Produces: `type CheckoutErrorCode = 'unauthenticated' | 'not_found' | 'invalid_currency' | 'stripe_error'`; `createCheckoutSession(input: { configId: string; locale: string }): Promise<{ url: string } | { error: CheckoutErrorCode }>`. Ya no lanza por casos esperados. `invalid_currency` solo si `calculatePrice` no conoce la moneda (la cookie inválida cae a USD antes).
- Produces: `handleCheckoutCompleted(session, db): Promise<'paid' | 'already_processed' | 'ignored' | 'mismatch'>`.
- Produces: `getDashboardData` añade `revenue7dByCurrency` y `revenue30dByCurrency: Partial<Record<Currency, number>>`; `revenue7dCents` y `revenue30dCents` pasan a sumar **solo USD** (meta semanal, D7).

- [ ] **C1: Pruebas de checkout** (`tests/integration/checkout.test.ts`): con cookie `CURRENCY=eur` → `line_items[0].price_data.currency === 'eur'`, `unit_amount === 2100` para policarbonato texturizado y el pedido guarda `currency: 'eur'`, `amountCents: 2100`; cookie `clp` → `unit_amount === 21970` (Review Focus 3); cookie `xyz` → `usd` y `2200`; pedido sin pagar reutilizado creado en `usd` y nueva sesión con cookie `clp` → el mismo pedido queda en `clp`/`21970`; `locale: 'en'` → Stripe recibe `locale: 'en'`, `success_url` termina en `/en/thank-you?orderId=<id>` y `cancel_url` en `/en/configure/preview?id=<configId>`; `locale: 'de'` → `es`; sin sesión → `{ error: 'unauthenticated' }`; configuración inexistente → `{ error: 'not_found' }`; Stripe lanza → `{ error: 'stripe_error' }`.
- [ ] **C2: Pruebas del webhook** (`tests/integration/webhook.test.ts`): `amount_total` distinto → resultado `mismatch`, pedido sin pagar, respuesta 200 y un `console.error` con `orderId` (sin datos de la tarjeta); `currency` distinta → igual; un evento posterior que sí coincide marca pagado.
- [ ] **C3: Pruebas del panel** (`tests/integration/dashboard.test.ts`): pedidos pagados en USD 1400, EUR 1300 y CLP 13990 en los últimos 7 días → `revenue7dByCurrency` = `{ usd: 1400, eur: 1300, clp: 13990 }` y `revenue7dCents === 1400`.
- [ ] **C4: Ejecuta y mira fallar** `npx.cmd vitest run --project integration tests/integration/checkout.test.ts tests/integration/webhook.test.ts tests/integration/dashboard.test.ts` (Claude, Docker).
- [ ] **C5: Implementa** las tres firmas; el webhook compara `session.amount_total === order.amountCents` y `session.currency === order.currency` dentro de la transacción antes de `updateMany`. Monta `CurrencySwitcher` en `Navbar` (`dropdown`) y en `MobileNav` vía `currencySlot` (`segmented`) con `current = await getCurrencyPreference()` y textos de `common.currency.*`.
- [ ] **C6: Verifica:** unitarias, `typecheck`, `lint`; Claude: integración, e2e y `build`.

### Tarea D · Mis pedidos

**Files:**
- Create: `src/lib/orders/get-user-orders.ts`, `src/app/[locale]/orders/page.tsx`, `loading.tsx`, `error.tsx`, `src/components/orders/{OrderCard,OrderStatusBadge,OrdersSkeleton,EmptyState}.tsx`, `tests/integration/orders.test.ts`, `e2e/orders.spec.ts`
- Modify: `messages/{es,en}/orders.json`

**Interfaces:**
- Consumes: `formatMoney`, `formatRegion`, `Currency` (B); `Link`, tokens `status-*` (A).
- Produces: `getUserOrders(userId: string, db?: PrismaClient): Promise<UserOrder[]>` con `where: { userId, isPaid: true }`, `orderBy: [{ createdAt: 'desc' }, { id: 'asc' }]`, `take: 50`; `UserOrder = { id; createdAt; amountCents; currency: Currency; status: OrderStatus; configuration: { model; material; finish; color; croppedImageUrl } }`. `OrderStatusBadge({ status })` lo reutiliza la Tarea G.

- [ ] **D1: Prueba** `tests/integration/orders.test.ts`: usuario A con 2 pagados y 1 sin pagar, usuario B con 1 pagado → `getUserOrders(A)` devuelve 2, ninguno de B ni sin pagar, el más reciente primero; 51 pagados → 50.
- [ ] **D2: Mira fallar, implementa la consulta, mira pasar.**
- [ ] **D3: Página** (spec §4.2–4.3): sin sesión no llama a `getUserOrders` y muestra `EmptyState` con `LoginLink` (regreso a `/{locale}/orders`); vacío, con pedidos, `loading.tsx` y `error.tsx` con `reset()`. Textos en `orders.json` (claves de §4.4 y las demás que necesite). Fecha con `Intl.DateTimeFormat(formatRegion(locale), { dateStyle: 'long' })`.
- [ ] **D4: e2e** `e2e/orders.spec.ts`: sin sesión, `/es/orders` muestra el estado de inicio de sesión (por `data-testid="orders-signed-out"`); estados por `data-testid` en 375/768/1280 y es/en con `@screenshots`.
- [ ] **D5: Verifica** como C6.

### Tarea E · Configurador traducido y con moneda

**Files:**
- Modify: `src/app/[locale]/configure/**` excepto `preview/actions.ts`, `src/lib/upload-errors.ts` (sus textos pasan a mensajes), `tests/unit/upload-errors.test.ts`, `messages/{es,en}/configure.json`, `e2e/configure.spec.ts`

**Interfaces:**
- Consumes: `createCheckoutSession` y `CheckoutErrorCode` (C); `calculatePrice`, `formatMoney`, `PRICE_LIST`, `getCurrencyPreference` (B).
- Produces: `getUploadErrorKey(error: unknown): 'tooLarge' | 'invalidFile' | 'generic'` en `src/lib/upload-errors.ts` (sustituye a `getUploadErrorMessage`); textos en `configure.uploadErrors.*`.

- [ ] **E1: Prueba** `tests/unit/upload-errors.test.ts` adaptada a `getUploadErrorKey` con los mismos casos que E7. Mira fallar, implementa, mira pasar.
- [ ] **E2:** Todos los textos de `configure/**` a `configure.json`. Los precios de opciones y total salen de `PRICE_LIST[currency]` con `formatMoney(…, currency, locale)`; la moneda la lee la página de servidor con `getCurrencyPreference()` y la pasa por props. La vista previa muestra `configure.preview.chargedIn` ("Se cobrará en {currency}") y traduce cada `CheckoutErrorCode` en un toast. Ningún `/ 100`.
- [ ] **E3: e2e** `e2e/configure.spec.ts`: con cookie `CURRENCY=clp`, `/es/configure/preview?id=…` muestra `21.970` y ningún `,00`; con `eur` y `/en` muestra `21.00`.
- [ ] **E4: Verifica** como C6, después de rebasar sobre C.

---

## Lote 2

### Tarea F · Portada y comunes

**Files:** `src/app/[locale]/page.tsx`, `src/components/{Reviews,Steps,Footer,LoginModal,DemoBanner,Phone,HandleComponent,Icons}.tsx` según tengan texto, `generateMetadata` en `src/app/[locale]/layout.tsx`, `messages/{es,en}/{home,common}.json`.

- [ ] **F1:** Textos de portada a `home.json`; de los componentes comunes a `common.json` (sin borrar claves de spec §4.4). Paridad verde.
- [ ] **F2:** `generateMetadata` con título y descripción por idioma y `alternates.languages`; `LoginModal` y `DemoBanner` usan `Link` de `@/i18n/navigation`.
- [ ] **F3: Verifica:** `rg` de cadenas visibles en esos archivos sin resultados fuera de mensajes; unitarias, `typecheck`, `lint`; Claude: e2e y `build`.

### Tarea G · Resumen y panel

**Files:** `src/app/[locale]/thank-you/**`, `src/app/[locale]/dashboard/page.tsx`, `src/app/[locale]/dashboard/StatusSelect.tsx`, `src/lib/orders/get-order-summary.ts` (añadir `currency`), `messages/{es,en}/{thank-you,dashboard}.json`, `src/lib/utils.ts` (eliminar `formatPrice`), `src/lib/pricing.ts` (eliminar `calculatePriceCents`), `src/config/products.ts` (eliminar `BASE_PRICE` y `PRODUCT_PRICES`), `prisma/seed.ts` y `tests/helpers/db.ts` (dejar de usar el envoltorio), `tests/unit/pricing.test.ts`, `tests/integration/thank-you.test.ts`.

- [ ] **G1: Prueba** `thank-you.test.ts`: el resumen de un pedido en CLP devuelve `currency: 'clp'` y `amountCents: 21970`. Mira fallar, implementa, mira pasar.
- [ ] **G2:** Resumen y panel con `formatMoney` en la moneda de cada pedido; tarjetas de 7 y 30 días con una línea por moneda (`revenue*ByCurrency`), meta semanal etiquetada como solo USD; estados con `OrderStatusBadge` (Tarea D).
- [ ] **G3:** Elimina `formatPrice`, `calculatePriceCents`, `BASE_PRICE` y `PRODUCT_PRICES`; `rg "formatPrice|calculatePriceCents|BASE_PRICE|PRODUCT_PRICES|/ 100" src prisma tests` sin resultados.
- [ ] **G4: Verifica** como C6.

### Tarea H · Pruebas de extremo a extremo

**Files:** `e2e/**` salvo lo que modifiquen F y G (ninguno), incluidos `e2e/screenshots.spec.ts`, `e2e/currency.spec.ts` y `e2e/purchase.spec.ts`.

- [ ] **H1:** Cambio de moneda en el navbar: elegir EUR actualiza el total de la vista previa sin cambiar de URL y la cookie queda en `eur`.
- [ ] **H2:** Compra de prueba en EUR y en CLP con la tarjeta de prueba de Stripe (modo de prueba) en `es` y `en`: el pedido guarda la moneda y el monto mostrados y "Mis pedidos" lo lista.
- [ ] **H3:** Capturas `@screenshots` de todas las pantallas y estados de spec §4.3 en 375×812, 768×1024 y 1280×800, en `es` y `en`, con selectores por rol y `data-testid`. Último paso, tras rebasar sobre F y G integrados.
- [ ] **H4:** Claude ejecuta `npm.cmd run test:e2e` y `npm.cmd run screenshots`.

---

## Tabla de lotes

| Lote | Tareas | Archivos que tocan | Depende de |
| --- | --- | --- | --- |
| 0 | B · Base de dinero | `prisma/schema.prisma`, `prisma/migrations/20261125120000_order_currency/`, `prisma/seed.ts`, `src/config/products.ts`, `src/config/currencies.ts`, `src/lib/pricing.ts`, `src/lib/money.ts`, `src/lib/currency-preference.ts`, `src/app/actions/set-currency.ts`, `src/components/CurrencySwitcher.tsx`, `tests/unit/{pricing,money,currency-preference}.test.ts` | E7 integrado en `main`; rama de la funcionalidad creada |
| 0 | A · Base de idiomas | `package.json`, `package-lock.json`, `next.config.mjs`, `middleware.ts`, `src/i18n/`, `src/app/layout.tsx`, `src/app/[locale]/` (traslado, layout, 404, `[...rest]`), `src/app/globals.css`, `tailwind.config.ts`, `src/components/{Navbar,MobileNav,LocaleSwitcher}.tsx`, `src/components/ui/sheet.tsx`, `messages/`, `tests/unit/messages.test.ts`, imports de `tests/integration/{checkout,dashboard,thank-you}.test.ts`, `e2e/` | Igual que B; se integra después de B, rebasado |
| 1 | C · Cobro multimoneda | `src/app/[locale]/configure/preview/actions.ts`, `src/lib/orders/handle-checkout-completed.ts`, `src/app/api/webhooks/route.ts`, `src/app/[locale]/dashboard/queries.ts`, `src/components/{Navbar,MobileNav}.tsx`, `tests/integration/{checkout,webhook,dashboard}.test.ts`, `tests/helpers/stripe.ts` | Lote 0 |
| 1 | D · Mis pedidos | `src/lib/orders/get-user-orders.ts`, `src/app/[locale]/orders/`, `src/components/orders/`, `messages/{es,en}/orders.json`, `tests/integration/orders.test.ts`, `e2e/orders.spec.ts` | Lote 0 |
| 1 | E · Configurador | `src/app/[locale]/configure/` salvo `preview/actions.ts`, `src/lib/upload-errors.ts`, `tests/unit/upload-errors.test.ts`, `messages/{es,en}/configure.json`, `e2e/configure.spec.ts` | Lote 0; contrato de C (se integra después de C) |
| 2 | F · Portada y comunes | `src/app/[locale]/page.tsx`, componentes de portada y comunes, `generateMetadata` de `src/app/[locale]/layout.tsx`, `messages/{es,en}/{home,common}.json` | Lote 1 |
| 2 | G · Resumen y panel | `src/app/[locale]/thank-you/`, `src/app/[locale]/dashboard/{page,StatusSelect}.tsx`, `src/lib/orders/get-order-summary.ts`, `messages/{es,en}/{thank-you,dashboard}.json`, `src/lib/utils.ts`, `src/lib/pricing.ts`, `src/config/products.ts`, `prisma/seed.ts`, `tests/helpers/db.ts`, `tests/unit/pricing.test.ts`, `tests/integration/thank-you.test.ts` | Lote 1 (usa `OrderStatusBadge` de D) |
| 2 | H · e2e | `e2e/` | Lote 1; capturas finales tras integrar F y G |
