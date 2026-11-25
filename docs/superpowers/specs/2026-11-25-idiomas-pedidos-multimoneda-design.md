# Diseño · Idiomas ES/EN, "Mis pedidos" y multimoneda (F6, F7, F8)

[Volver al inicio](../../00-inicio.md) · [Hoja de ruta](../../hoja-de-ruta.md)

Estado del spec: **Propuesto** el 2026-11-25 (las respuestas de la tabla siguiente son del propietario; el resto del spec espera su aprobación). No autoriza escribir el plan ni implementar hasta que el propietario lo apruebe.

Respuestas del propietario del 2026-11-25 que este spec ya incorpora (el spec en conjunto sigue **Propuesto**):

| # | Pregunta | Respuesta |
|---|---|---|
| 1 | Un solo spec y un solo plan para F6, F7 y F8, activas a la vez, con lotes cortados por archivos | Sí |
| 2 | Idioma en la URL (`/es`, `/en`), español por defecto | Sí |
| 3 | Monedas USD, EUR y CLP con lista de precios fija por moneda | Sí |
| 8 | E7 (`onUploadError`) se integra en `main` antes del lote 0 | Sí |
| 5 | Moneda independiente del idioma, USD por defecto, selector propio (D5) | Sí, como se recomendó |
| 6 | "Mis pedidos" solo con pagados y enlace al resumen existente (D6) | Sí, como se recomendó |
| 7 | Ingresos del panel separados por moneda, sin convertir (D7) | Sí, como se recomendó |

Decisiones que el propietario **no** ha visto y se aprueban junto con este spec: D9 (precios concretos), D10 (regla 11 de AGENTS.md), y las regiones de formato `es-CL`/`en-US` (D2) y conservar el nombre `amountCents` (D4). Todas **Propuestas**.

## 1. Intención

Que el proyecto destaque como portafolio con tres mejoras:

1. **F6 · Idiomas:** toda la interfaz en español por defecto y en inglés con un selector; el idioma vive en la URL.
2. **F7 · Mis pedidos:** el comprador autenticado ve sus pedidos pagados y su estado de envío.
3. **F8 · Multimoneda:** el comprador elige USD, EUR o CLP; el precio mostrado, el cobrado por Stripe y el guardado en el pedido coinciden y se calculan en el servidor.

## 2. Punto de partida

- `src/app/layout.tsx` fija `<html lang="en">` y metadata de plantilla; no hay `middleware.ts`; todos los textos están en los componentes, en inglés (unas 1 900 líneas de interfaz).
- Precio: `src/config/products.ts` (`BASE_PRICE` 14_00, policarbonato +5_00, texturizado +3_00) y `calculatePriceCents()` en `src/lib/pricing.ts`, solo USD.
- `createCheckoutSession` (`src/app/configure/preview/actions.ts`) cobra en `"USD"`, reutiliza el pedido sin pagar **sin actualizar el monto**, y arma `success_url`/`cancel_url` sin idioma.
- `handleCheckoutCompleted` marca pagado sin comprobar monto ni moneda.
- `Order.amountCents` (Int) sin moneda; una sola migración (`init`).
- `formatPrice()` en `src/lib/utils.ts` fija USD y los llamadores dividen por 100 (incorrecto para CLP, que no tiene decimales).
- `getOrderSummary()` ya filtra por `id` + `userId`; `/thank-you` muestra el resumen de un pedido.
- El panel suma ingresos de 7 y 30 días en un solo número.
- Navbar de servidor, `sticky h-14`, sin menú móvil.

## 3. Decisiones

### D1 · Biblioteca y rutas de idioma (F6)

- `next-intl` (única dependencia nueva del proyecto en este spec). Segmento `src/app/[locale]/`, `localePrefix: 'always'`, idiomas `es` (defecto) y `en`.
- Detección en `/`: cookie `NEXT_LOCALE`, luego `Accept-Language`, luego `es`. Cambiar de idioma escribe la cookie.
- `middleware.ts` en la raíz con matcher que **excluye** `api/**` (Kinde `/api/auth/*`, UploadThing, webhook de Stripe), `_next/**` y archivos con extensión.
- Todas las páginas pasan a `src/app/[locale]/…`, incluidas `auth-callback` y `thank-you`. `KINDE_POST_LOGIN_REDIRECT_URL` no cambia: `/auth-callback` se redirige a `/{locale}/auth-callback` conservando la query.
- `<html lang>` toma el idioma; metadata por idioma con `alternates.languages` (`hreflang` es/en).
- Stripe Checkout recibe `locale: 'es' | 'en'`; `success_url` y `cancel_url` llevan el prefijo del idioma.
- Fechas, números y montos se formatean con `Intl` mediante el formateador de next-intl (`es-CL`/`en-US` como regiones de formato; ver D2).

### D2 · Organización de mensajes (F6)

- Un archivo por espacio de nombres y por idioma: `messages/{es,en}/{common,home,configure,orders,thank-you,dashboard}.json`. `src/i18n/request.ts` los importa con una lista fija.
- El encargo de la base crea **todos** los archivos (los que no son suyos como `{}`); cada encargo posterior es dueño de su espacio de nombres. Así nunca dos encargos editan el mismo JSON.
- Prueba unitaria de paridad: mismas claves en `es` y `en`, ningún valor vacío en archivos ya poblados.
- Los mensajes se cargan en el servidor; al cliente solo pasan los espacios de nombres que usan sus componentes cliente.
- Región de formato: `es` → `es-CL` (miles con punto, coma decimal), `en` → `en-US`. **Propuesto**.

### D3 · Monedas y lista de precios (F8)

- Monedas permitidas: `usd`, `eur`, `clp` en `src/config/currencies.ts` (código, unidades menores por unidad: 100, 100, 1; símbolo; nombre por idioma en mensajes).
- Lista fija por moneda en `src/config/products.ts`, siempre en **unidad menor entera** (en CLP la unidad menor es el peso). Ver D9 para los valores.
- `calculatePrice(configuration, currency)` en `src/lib/pricing.ts` devuelve `{ amount, currency }`. `calculatePriceCents()` queda como envoltorio USD **solo** hasta el lote 2 para que la compilación siga verde.
- `formatMoney(amount, currency, locale)` en `src/lib/money.ts` usa `Intl.NumberFormat` con los decimales de la moneda; nadie divide por 100 fuera de este módulo. `formatPrice` se elimina en el lote 2.
- Sin conversión con tasas de cambio.

### D4 · Pedido, cobro y verificación (F8)

- Migración aditiva: `Order.currency` (`String`, por defecto `'usd'`, restringido a la lista en el servidor). Los pedidos existentes quedan en USD, que es lo que se cobró.
- `amountCents` **conserva su nombre** y se documenta como "monto en unidad menor de `currency`" (renombrar obligaría a una migración destructiva). **Propuesto**.
- `createCheckoutSession` lee la moneda de la cookie `CURRENCY`, la valida contra la lista (si no es válida usa USD), calcula el precio en el servidor y, si reutiliza un pedido sin pagar, **actualiza `amountCents` y `currency`** antes de crear la sesión. `currency` y `unit_amount` de Stripe salen de ese cálculo.
- `handleCheckoutCompleted` solo marca pagado si `amount_total` y `currency` de la sesión coinciden con el pedido; si no, no lo marca, registra el desajuste y responde 200 para que Stripe no reintente en bucle.
- Mínimos de Stripe: el precio más bajo de cada moneda queda muy por encima del mínimo (0,50 USD/EUR; CLP equivalente). Se verifica en una prueba unitaria contra una constante documentada.

### D5 · Moneda independiente del idioma (F8) · decidida por el propietario el 2026-11-25

La moneda **no** depende del idioma. Por defecto USD; selector propio; se guarda en la cookie `CURRENCY` (1 año, `SameSite=Lax`) mediante una acción de servidor. Motivo: un visitante chileno puede leer en inglés y pagar en CLP, y viceversa; atar ambos confunde y complica las pruebas.

### D6 · Alcance de "Mis pedidos" (F7) · decidida por el propietario el 2026-11-25

- Ruta `/{locale}/orders`, solo para usuarios autenticados; consulta en el servidor con `where: { userId, isPaid: true }`, orden por `createdAt` descendente, máximo 50, sin paginación.
- Solo pedidos pagados. No se listan pedidos sin pagar ni hay "reanudar pago".
- Cada pedido enlaza al resumen existente `/{locale}/thank-you?orderId=…`, que ya valida el dueño.
- El estado de envío se muestra tal cual lo deja la tienda, con una nota visible: lo actualiza la tienda a mano y no hay seguimiento real.
- Sin sesión: la página muestra el estado "Inicia sesión" (no redirige en silencio).

### D7 · Ingresos por moneda en el panel (F8) · decidida por el propietario el 2026-11-25

Las tarjetas de 7 y 30 días muestran una línea por moneda con ventas (`USD 1.234,00 · EUR 98,00 · CLP 45.970`), sin convertir ni sumar monedas distintas. La meta semanal actual se aplica solo a USD y lo dice en su etiqueta. La tabla de pedidos muestra cada monto en su moneda.

### D8 · Modo demostración y datos de ejemplo

- `prisma/seed.ts` añade pedidos de ejemplo pagados en EUR y CLP (montos calculados con `calculatePrice`), para que el panel y "Mis pedidos" de los usuarios de ejemplo muestren varias monedas.
- `DEMO_MODE` y el aviso de demostración no cambian de comportamiento; solo se traducen.

### D9 · Precios concretos · **Propuesto, pendiente de aprobación**

| Concepto | USD | EUR | CLP |
|---|---|---|---|
| Base | 14,00 (`14_00`) | 13,00 (`13_00`) | 13.990 (`13_990`) |
| Policarbonato | +5,00 | +5,00 | +4.990 |
| Texturizado | +3,00 | +3,00 | +2.990 |
| Máximo posible | 22,00 | 21,00 | 21.970 |

Precios redondos por mercado, no conversiones exactas.

### D10 · Regla 11 de AGENTS.md (textos de interfaz en inglés) · **Propuesto, pendiente de aprobación**

Hoy dice que los textos de interfaz van en inglés. Con F6 pasa a: "identificadores y código en inglés; los textos visibles van **solo** en `messages/{es,en}/*.json`, nunca escritos en componentes". El cambio en `AGENTS.md` lo hace Claude tras la aprobación (no es parte de ningún encargo).

## 4. Interfaz

Diseño hecho con `ui-ux-pro-max` y `design-system`. Mantiene la identidad actual: fuente Recursive, verde `green-600` como primario, grises zinc, fondo `grainy-light`, marca `case<span>Maker</span>`, componentes shadcn sobre Radix. Codex usa **solo** los tokens y componentes definidos aquí y no decide diseño.

### 4.1 Tokens (tres capas)

**Primitivos** (ya existen en Tailwind; no se crean nuevos valores crudos): `green-600`, `zinc-50…900`, `amber-50/200/800`, `blue-50/200/800`, `emerald-50/200/800`, `red-50/600`. Espaciado y radios de la escala de Tailwind; `--radius: 0.5rem` existente.

**Semánticos** (se añaden en `src/app/globals.css`, formato HSL como los de shadcn, con variante oscura, y se exponen en `tailwind.config.ts`):

| Token | Claro | Uso |
|---|---|---|
| `--status-pending` / `-foreground` / `-border` | amber-50 / amber-800 / amber-200 | Pedido "Preparando envío" |
| `--status-shipped` / `-foreground` / `-border` | blue-50 / blue-800 / blue-200 | "Enviado" |
| `--status-delivered` / `-foreground` / `-border` | emerald-50 / emerald-800 / emerald-200 | "Entregado" |
| `--nav-height` | 3.5rem | Alto del navbar (igual que `h-14` actual) |
| `--touch-target` | 2.75rem (44 px) | Mínimo de cualquier control táctil |

Se reutilizan sin cambio: `--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--border`, `--ring`, `--destructive`, `--background`, `--card`.

**De componente** (clases Tailwind que mapean a semánticos; sin hex en componentes):

| Componente | Token de componente → semántico |
|---|---|
| Disparador de selector | fondo `transparent`, hover `accent`, texto `foreground`, anillo `ring`, alto `touch-target` en móvil, `h-9` en escritorio |
| Ítem de menú activo | icono check `primary`, texto `foreground`, fondo hover `accent` |
| Control segmentado (móvil) | contenedor `muted`; opción activa fondo `background` + sombra `sm` + texto `foreground`; inactiva texto `muted-foreground` |
| `OrderStatusBadge` | fondo `status-*`, texto `status-*-foreground`, borde `status-*-border`, `rounded-full`, `text-xs font-medium` |
| `OrderCard` | fondo `card`, borde `border`, `rounded-lg`, hover borde `primary/40` |
| Esqueleto | fondo `muted`, animación `pulse` (desactivada con `prefers-reduced-motion`) |

### 4.2 Componentes

Todos los controles: foco visible con anillo `ring` de 2 px, área táctil ≥44 px en móvil, transiciones de 150 ms en color/opacidad (nunca en ancho/alto), iconos `lucide-react` (sin emojis; el "✨" del enlace Dashboard se reemplaza por el icono `Sparkles` con `aria-hidden`).

**LocaleSwitcher** (cliente). `DropdownMenu` existente.

| Propiedad | Por defecto | Hover | Abierto | Foco | Deshabilitado |
|---|---|---|---|---|---|
| Disparador | icono `Languages` + código `ES`/`EN`, variante ghost `sm` | fondo `accent` | fondo `accent`, chevron girado | anillo `ring` | no aplica |
| Contenido | — | — | `DropdownMenuRadioGroup`: "Español", "English" (cada nombre en su propio idioma y con `lang`), check en el activo | navegación con flechas | — |

`aria-label` del disparador: "Cambiar idioma, actual: Español" / "Change language, current: English". Cambiar navega a la misma ruta y query con el otro prefijo (no recarga a la portada) y conserva el historial.

**CurrencySwitcher** (cliente). `DropdownMenu`.

| Propiedad | Por defecto | Hover | Abierto | Foco | Pendiente |
|---|---|---|---|---|---|
| Disparador | código `USD` + chevron, ghost `sm` | `accent` | `accent` | anillo `ring` | `aria-busy`, opacidad 60 %, sin clics |
| Contenido | — | — | Radio group: "USD · Dólar estadounidense", "EUR · Euro", "CLP · Peso chileno", check en la activa | flechas | — |

`aria-label`: "Cambiar moneda, actual: USD". Al elegir llama a la acción de servidor `setCurrency`, que valida y escribe la cookie, y luego `router.refresh()`; los precios visibles se actualizan sin cambiar de página.

**MobileNav** (cliente, solo `<md`). `Sheet` lateral derecho creado como `src/components/ui/sheet.tsx` sobre `@radix-ui/react-dialog` (ya instalado; no es dependencia nueva).

- Disparador: botón icono `Menu` 44×44, `aria-label` "Abrir menú", `aria-expanded`.
- Contenido, en orden: enlaces (Mis pedidos si hay sesión, Dashboard si es admin), separador, **Idioma** como control segmentado `ES | EN`, **Moneda** como control segmentado `USD | EUR | CLP`, separador, acciones de sesión (Iniciar sesión / Registrarse o Cerrar sesión), botón primario "Crear funda" a todo el ancho.
- Cierra con Escape, clic fuera, botón `X` 44×44 y al navegar. Foco atrapado mientras está abierto; vuelve al disparador al cerrar.

**Navbar** (servidor, se mantiene `sticky`, `h-14`, `bg-white/75 backdrop-blur`).

- `≥md`: marca · [Mis pedidos] [Dashboard] [sesión] · LocaleSwitcher · CurrencySwitcher · botón "Crear funda". El enlace de la página actual lleva `aria-current="page"` y texto `foreground` (los demás `muted-foreground`).
- `<md`: marca · botón "Crear funda" compacto (solo si cabe a 375 px; si no, va dentro del menú) · disparador del `MobileNav`.

**OrderStatusBadge** (servidor). `awaiting_shipment` → "Preparando envío" / "Preparing shipment"; `shipped` → "Enviado" / "Shipped"; `fulfilled` → "Entregado" / "Delivered". Color **y** texto (no solo color). Icono `Clock`, `Truck`, `PackageCheck` con `aria-hidden`.

**OrderCard** (servidor). Miniatura de la funda (`Phone` reducido, `w-16`, con `alt` "Vista previa de la funda"), título "Funda para {modelo}", detalle "{material} · {acabado} · {color}", número corto `#` + 8 primeros caracteres del id, fecha en formato largo del idioma, total con `formatMoney` en la moneda del pedido, `OrderStatusBadge`, enlace "Ver resumen" (toda la tarjeta clicable; un solo destino de foco).

**OrdersSkeleton**: 3 tarjetas con la misma altura que `OrderCard` (sin salto de diseño), `aria-busy="true"` en la lista y texto oculto "Cargando pedidos".

**EmptyState**: icono `Package` en círculo `muted`, título, texto de ayuda y botón primario.

### 4.3 Pantallas y estados

Viewports a cubrir en capturas: 375×812, 768×1024, 1280×800, en `es` y `en`.

**Navbar**

| Estado | 375 | 768 | 1280 |
|---|---|---|---|
| Sin sesión | marca + menú | completo en una línea | completo |
| Con sesión comprador | menú incluye "Mis pedidos" | enlace visible | enlace visible |
| Admin | menú incluye Dashboard | visible | visible |
| Menú móvil abierto | sheet a ancho 85 % (máx. 20 rem) con fondo oscurecido | — | — |
| Selector abierto | — | menú desplegado bajo el disparador, alineado a la derecha | ídem |

**Mis pedidos** (`/{locale}/orders`): contenedor `MaxWidthWrapper` con contenido `max-w-3xl`; título "Mis pedidos" / "My orders", subtítulo con la nota de estado manual.

| Estado | Contenido |
|---|---|
| Sin sesión | EmptyState: "Inicia sesión para ver tus pedidos" + botón "Iniciar sesión" (Kinde con regreso a `/orders`) |
| Vacío | EmptyState: "Todavía no tienes pedidos" · "Cuando completes una compra, aparecerá aquí." + botón "Crear mi funda" → `/configure/upload` |
| Con pedidos | lista de `OrderCard` (375: una columna, datos apilados, insignia arriba a la derecha; ≥768: fila con miniatura · datos · total y estado alineados a la derecha) |
| Cargando | `loading.tsx` con `OrdersSkeleton` |
| Error | `error.tsx`: "No pudimos cargar tus pedidos." + botón "Reintentar" (`reset()`); sin detalles técnicos |

**Configurador, vista previa y resumen**: mismo diseño actual; solo cambian textos (mensajes) y precios (`formatMoney` en la moneda elegida). La vista previa muestra "Se cobrará en {moneda}" junto al total.

**Panel**: tarjetas de ingresos con una línea por moneda (D7); etiquetas de estado traducidas con las mismas palabras que la insignia.

### 4.4 Textos clave (para `common` y `orders`)

| Clave | es | en |
|---|---|---|
| `common.nav.orders` | Mis pedidos | My orders |
| `common.nav.createCase` | Crear funda | Create case |
| `common.nav.openMenu` / `closeMenu` | Abrir menú / Cerrar menú | Open menu / Close menu |
| `common.locale.label` | Idioma | Language |
| `common.currency.label` | Moneda | Currency |
| `common.currency.usd` / `eur` / `clp` | Dólar estadounidense / Euro / Peso chileno | US dollar / Euro / Chilean peso |
| `orders.title` | Mis pedidos | My orders |
| `orders.manualStatusNote` | El estado de envío lo actualiza la tienda manualmente. | Shipping status is updated manually by the store. |
| `orders.empty.title` | Todavía no tienes pedidos | You have no orders yet |
| `orders.viewSummary` | Ver resumen | View summary |

El resto de claves las define cada encargo en su espacio de nombres; las claves de `common` listadas son contrato entre encargos.

## 5. Criterios de terminada

**F6 · Idiomas**

- `/` redirige a `/es` (o al idioma de la cookie o del navegador); `/es/…` y `/en/…` funcionan en todas las páginas, incluidos `auth-callback` y `thank-you`.
- Ningún texto visible queda escrito en componentes; prueba de paridad de claves verde; búsqueda de cadenas visibles en `src/components` y `src/app` sin resultados fuera de mensajes.
- `<html lang>` y `hreflang` correctos; fechas y montos formateados según idioma.
- Cambiar idioma conserva ruta, query y moneda; la preferencia persiste.
- Stripe Checkout se abre en el idioma activo y vuelve a la URL con el mismo prefijo.
- Kinde, UploadThing y el webhook siguen funcionando (middleware no los intercepta): e2e de compra completa verde en ambos idiomas.

**F7 · Mis pedidos**

- Prueba de integración: un usuario solo ve sus pedidos pagados; nunca los de otro ni los sin pagar; sin sesión no se consulta la base.
- Los cinco estados de la página (sin sesión, vacío, con pedidos, cargando, error) existen y tienen captura en 375/768/1280 y en es/en.
- Cada tarjeta enlaza al resumen del pedido y muestra monto en su moneda y estado con texto.
- Navegación por teclado completa; Lighthouse accesibilidad ≥ 95 en la página.

**F8 · Multimoneda**

- Pruebas unitarias: precio por moneda para todas las combinaciones de material y acabado; `formatMoney` para USD, EUR y CLP en es y en; mínimos de Stripe.
- Prueba de integración: la sesión de Stripe usa la moneda de la cookie válida y USD si la cookie es inválida; al reutilizar un pedido sin pagar se actualizan monto y moneda.
- Prueba de integración: el webhook no marca pagado si `amount_total` o `currency` no coinciden.
- Migración aditiva aplicada en la base de pruebas sin perder pedidos; los existentes quedan en `usd`.
- Panel: ingresos separados por moneda, sin sumas mezcladas.
- e2e: compra de prueba en EUR y en CLP con tarjeta de prueba de Stripe; el pedido guarda la moneda y el monto mostrados.

**Comunes**: `npm run lint`, `typecheck`, unitarias, integración y e2e verdes en cada encargo; ningún secreto ni `.env` versionado.

## 6. Partición en lotes

Regla: dentro de un lote ningún archivo pertenece a dos encargos. Cada lote se integra completo en `main` antes de lanzar el siguiente. Las rutas bajo `src/app/[locale]/` existen desde el lote 0.

### Lote 0 · Bases (2 encargos)

| Encargo | Archivos de los que es dueño |
|---|---|
| **A · Base de idiomas** | `package.json`, `package-lock.json`, `next.config.*`, `middleware.ts`, `src/i18n/**`, `src/app/layout.tsx`, `src/app/[locale]/layout.tsx`, `src/app/[locale]/not-found.tsx`, `src/app/globals.css`, `tailwind.config.ts`, traslado (solo mover, sin traducir) de todas las páginas de `src/app/*` a `src/app/[locale]/*`, `src/components/Navbar.tsx`, `src/components/MobileNav.tsx`, `src/components/LocaleSwitcher.tsx`, `src/components/ui/sheet.tsx`, todos los `messages/{es,en}/*.json` (`common` poblado con las claves de §4.4; el resto `{}`), `tests/unit/messages.test.ts`, `e2e/**` (ajuste de rutas al prefijo) |
| **B · Base de dinero** | `prisma/schema.prisma`, `prisma/migrations/**` (nueva), `prisma/seed.ts`, `src/config/products.ts`, `src/config/currencies.ts`, `src/lib/pricing.ts`, `src/lib/money.ts`, `src/lib/currency-preference.ts`, `src/app/actions/set-currency.ts`, `src/components/CurrencySwitcher.tsx` (usa las claves `common.currency.*` fijadas en §4.4, sin montarlo en el navbar), `tests/unit/pricing.test.ts`, `tests/unit/money.test.ts` |

Orden de integración: B primero (no toca rutas), luego A rebasado sobre B. `src/app/actions/` queda fuera de `[locale]` porque no es una página.

### Lote 1 · Funcionalidades (3 encargos)

| Encargo | Archivos de los que es dueño |
|---|---|
| **C · Cobro multimoneda** | `src/app/[locale]/configure/preview/actions.ts`, `src/lib/orders/handle-checkout-completed.ts`, `src/app/api/webhooks/route.ts`, `src/app/[locale]/dashboard/queries.ts`, `src/components/Navbar.tsx` y `src/components/MobileNav.tsx` (solo montar `CurrencySwitcher`), `tests/integration/{checkout,webhook,dashboard}.test.ts`, `tests/helpers/stripe.ts` |
| **D · Mis pedidos** | `src/lib/orders/get-user-orders.ts`, `src/app/[locale]/orders/**` (página, `loading.tsx`, `error.tsx`), `src/components/orders/**` (`OrderCard`, `OrderStatusBadge`, `OrdersSkeleton`, `EmptyState`), `messages/{es,en}/orders.json`, `tests/integration/orders.test.ts`, `e2e/orders.spec.ts` |
| **E · Configurador traducido y con moneda** | `src/app/[locale]/configure/**` excepto `preview/actions.ts`, `messages/{es,en}/configure.json`, `e2e/configure.spec.ts` |

C define los códigos de error que devuelve `createCheckoutSession` (`unauthenticated`, `not_found`, `invalid_currency`, `stripe_error`); E los traduce. Se fijan en el plan.

### Lote 2 · Cierre (3 encargos)

| Encargo | Archivos de los que es dueño |
|---|---|
| **F · Portada y comunes** | `src/app/[locale]/page.tsx`, `src/components/{Reviews,Steps,Footer,LoginModal,DemoBanner}.tsx` y demás componentes de portada, metadata por idioma en `src/app/[locale]/layout.tsx`, `messages/{es,en}/{home,common}.json` |
| **G · Resumen y panel** | `src/app/[locale]/thank-you/**`, `src/app/[locale]/dashboard/page.tsx` y `StatusSelect`, `messages/{es,en}/{thank-you,dashboard}.json`, `src/lib/utils.ts` (eliminar `formatPrice`), `src/lib/pricing.ts` (eliminar el envoltorio `calculatePriceCents`), `tests/integration/thank-you.test.ts` |
| **H · Pruebas de extremo a extremo** | `e2e/**` excepto lo anterior ya integrado: cambio de idioma, cambio de moneda, compras de prueba EUR y CLP, capturas de todas las pantallas de §4.3 en es/en y tres viewports |

H usa selectores por rol y `data-testid`, no textos literales, para no depender de F y G; sus capturas finales se toman después de integrar F y G (último paso de H, rebasado sobre `main`).

## 7. Riesgos

| Riesgo | Mitigación |
|---|---|
| Mover todas las páginas a `[locale]` choca con ramas abiertas | E7 se integra antes (aprobado); el lote 0 A no traduce, solo mueve; no hay otras ramas abiertas al lanzarlo |
| El middleware intercepta Kinde, UploadThing o el webhook | Matcher que excluye `api/**`; e2e de compra completa y prueba del webhook en el lote 0 |
| Fuga de pedidos ajenos en "Mis pedidos" | Filtro por `userId` en el servidor y prueba de integración con dos usuarios |
| CLP sin decimales mal formateado o cobrado ×100 | `formatMoney` único y lista de precios en unidad menor; pruebas por moneda |
| Pedido sin pagar reutilizado con monto o moneda viejos | Actualizarlos al crear la sesión; prueba de integración |
| Cookie de moneda manipulada | Validación contra la lista en el servidor; el webhook verifica monto y moneda |
| Migración en producción | Solo aditiva con valor por defecto; se aplica con el despliegue habitual tras aprobación |
| Textos sin traducir | Prueba de paridad y criterio de "ningún texto en componentes"; cada encargo es dueño de su espacio de nombres |
| Tamaño del bundle cliente por mensajes | Mensajes en el servidor; al cliente solo los espacios de nombres necesarios |
| Enlace "Mis pedidos" visible antes de que exista la página | Entre el lote 0 y el lote 1 `main` no se despliega; el despliegue es al final de los tres lotes |
| Tres funcionalidades activas a la vez | Aprobado como excepción; lotes sin archivos compartidos e integración completa por lote |

## 8. Fuera de alcance

- Envíos reales, seguimiento de transportista, inventario y correos transaccionales.
- Conversión con tasas de cambio en vivo; sumar ingresos de distintas monedas.
- Más idiomas o monedas que es/en y USD/EUR/CLP; moneda automática por país.
- Pedidos sin pagar en "Mis pedidos", reanudar pago, cancelaciones y devoluciones.
- Paginación, filtros y búsqueda en "Mis pedidos".
- Traducir las pantallas alojadas por Kinde (inicio de sesión y registro quedan en el idioma que Kinde muestre).
- Páginas legales, impuestos por país y rediseño general de la interfaz.

## 9. Después de la aprobación

1. Claude registra la aprobación con fecha aquí y en la hoja de ruta, crea los ADR (next-intl con idioma en la URL; multimoneda con lista fija y `Order.currency`) y ajusta la regla 11 de `AGENTS.md` si se aprueba D10.
2. Claude escribe el plan con `writing-plans` siguiendo esta partición y prepara los encargos del lote 0.
