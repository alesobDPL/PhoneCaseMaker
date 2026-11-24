# PhoneCaseMaker listo para portafolio · Plan de implementación

[Plans](README.md) · [Diseño aprobado](../specs/2026-11-23-portafolio-design.md) · [Inicio](../../00-inicio.md)

- **Fecha:** 2026-11-23. **Estado:** **Aprobado por el propietario el 2026-11-23.** Autoriza delegar a Codex los encargos E1 a E4 en el orden indicado (E2 y E3 en paralelo). E5 se hace con el propietario.
- **Ejecución:** encargos a Codex (E1–E4), cada uno en su worktree y rama `feat/eN-…` desde `main`. Claude Code revisa; el propietario acepta. E5 (despliegue) lo hacen el propietario y Claude Code.

> **For agentic workers:** sigue las tareas en orden y las reglas de `AGENTS.md`. Los pasos usan casillas (`- [ ]`).

**Goal:** corregir el flujo de pago, añadir el panel de administración con modo demo, pruebas y CI, y dejar el proyecto presentable y desplegable en Vercel + Neon.

**Architecture:** la lógica crítica sale de las rutas y acciones a funciones puras o inyectables en `src/lib/` (precio, permisos y procesamiento del pago). Las rutas y acciones solo obtienen la sesión, llaman a esas funciones y traducen el resultado. Así se prueban sin Next.js ni Kinde.

**Tech Stack:** Next.js 15, Prisma 5 + PostgreSQL, Kinde, Stripe 17, UploadThing, Vitest, Testcontainers, Playwright y GitHub Actions. Node 26, npm.

**Spec:** [2026-11-23-portafolio-design.md](../specs/2026-11-23-portafolio-design.md)

## Global Constraints

- Dinero en **centavos enteros**: `BASE_PRICE = 1400`; polycarbonate `+500`; textured `+300` (`src/config/products.ts`, sin cambios).
- Autorización **siempre en el servidor**. Ocultar enlaces es solo comodidad.
- Webhook: firma ausente o inválida → `400`; metadatos ausentes o pedido inexistente → `200` sin cambios; evento ya procesado → `200` sin cambios; error inesperado → `500`; otros tipos de evento → `200`.
- `DEMO_MODE` se lee como `process.env.DEMO_MODE === 'true'`. Pedidos de ejemplo: `isSample = true`, nunca modificables.
- Checkout: solo `card`; países de envío `['CL', 'US', 'DE']`; `price_data` en la línea, sin `stripe.products.create`.
- Sin dependencias fuera de las nombradas en cada tarea. Sin secretos en el repo.
- Identificadores en inglés; textos de interfaz en inglés (como hoy); documentación en español; README bilingüe.

## Review Focus

1. Evento `checkout.session.completed` con un `orderId` que no existe → `200` sin escribir nada. Prueba en el Task 3.
2. Dos entregas **simultáneas** del mismo evento → un solo juego de direcciones. Prueba en el Task 3 (`Promise.all`).
3. `/thank-you` y `getPaymentStatus` con el pedido de otro usuario → 404, sin filtrar datos. Prueba en el Task 4.
4. `DEMO_MODE` desactivado y usuario que no es administrador → `/dashboard` y `updateOrderStatus` rechazan. Prueba en el Task 5.
5. Sesión de Stripe sin `shipping_details` → el pedido se marca pagado sin direcciones, sin error. Prueba en el Task 3.

## Encargos y paralelismo

| Encargo | Tareas | Depende de | En paralelo con | Archivos exclusivos |
| --- | --- | --- | --- | --- |
| E1 Base | 1, 2 | — | — | `package.json`, `vitest.config.ts`, `playwright.config.ts`, `tests/helpers/*`, `prisma/*` (esquema, migración, entrada del seed), `.github/workflows/ci.yml`, `.env.example`, `src/lib/pricing.ts` |
| E2 Pago | 3, 4 | E1 | **E3** | `src/app/api/webhooks/*`, `src/lib/orders/*`, `src/app/configure/preview/actions.ts`, `src/app/thank-you/*`, `tests/integration/webhook.test.ts`, `tests/integration/checkout.test.ts`, `tests/integration/thank-you.test.ts` |
| E3 Panel | 5, 6 | E1 | **E2** | `src/lib/authz.ts`, `src/app/dashboard/*`, `prisma/seed.ts`, `public/samples/*`, `src/components/Navbar.tsx`, `tests/unit/authz.test.ts`, `tests/integration/dashboard.test.ts` |
| E4 Presentación | 7 | E2 y E3 | — | `src/components/DemoBanner.tsx`, `src/app/page.tsx`, `e2e/*`, `README.md`, `README.es.md`, `docs/assets/*`, `.github/workflows/ci.yml` (job e2e) |
| E5 Despliegue | 8 | E4 | — | Sin código: cuentas y Vercel, con el propietario |

E2 y E3 **no comparten archivos**. E1 deja preparado lo que ambos necesitarían tocar a la vez: `package.json`, esquema, ayudas de pruebas y la entrada `prisma.seed`.

---

## E1 · Base

### Task 1: Esquema, migración inicial, precio y dependencias

**Files:**
- Modify: `prisma/schema.prisma`; Create: `prisma/migrations/<timestamp>_init/migration.sql`
- Create: `src/lib/pricing.ts`; Modify: `src/app/configure/preview/actions.ts` (solo usar `calculatePriceCents` y `amountCents`)
- Modify: `package.json`; Create: `.env.example`
- Test: `tests/unit/pricing.test.ts`

**Interfaces:**
- Produces: `calculatePriceCents(c: Pick<Configuration, 'material' | 'finish'>): number`
- Produces (esquema): `Order.amountCents Int` (reemplaza `amount Float`); `Order.isSample Boolean @default(false)`
- Produces (`package.json`): scripts `test:unit`, `test:integration`, `test:e2e` y `typecheck` (`tsc --noEmit`); `"prisma": { "seed": "tsx prisma/seed.ts" }`

- [ ] **Step 1: Prueba que falla.** `tests/unit/pricing.test.ts`: `silicone + smooth → 1400`; `polycarbonate + smooth → 1900`; `silicone + textured → 1700`; `polycarbonate + textured → 2200`; material o acabado `null` → se tratan como `silicone` y `smooth` (`1400`).
- [ ] **Step 2: Instalar las dependencias de desarrollo:** `vitest`, `@vitest/coverage-v8`, `vite-tsconfig-paths`, `testcontainers`, `@testcontainers/postgresql`, `tsx` y `@playwright/test`. Alinear `eslint-config-next` a `^15` y `@types/react`/`@types/react-dom` a `^18`. Crear `vitest.config.ts` con dos proyectos: `unit` (`tests/unit/**`) e `integration` (`tests/integration/**`, `globalSetup: tests/helpers/global-setup.ts`).
- [ ] **Step 3: Ejecutar** `npm run test:unit` → falla porque `pricing` no existe.
- [ ] **Step 4: Implementar** `calculatePriceCents` con `BASE_PRICE` y `PRODUCT_PRICES`. En `preview/actions.ts`, reemplazar el cálculo inline y `amount: price / 100` por `amountCents: calculatePriceCents(configuration)` (el resto del archivo es del Task 3).
- [ ] **Step 5: Esquema y migración:** cambiar `amount` por `amountCents Int` y añadir `isSample`. Generar la migración inicial con `npx prisma migrate dev --name init` contra un PostgreSQL local de Docker. Es la primera migración del repo, que antes usaba `db push`.
- [ ] **Step 6: `.env.example`** con todas las variables de `docs/arquitectura/README.md`, valores ficticios y `DEMO_MODE=true`.
- [ ] **Step 7: Verificar:** `npm run test:unit` → PASS; `npm run typecheck` → sin errores; `npm run lint` → sin errores; `npm run build` con las variables de `.env.example` → termina bien.
- [ ] **Step 8: Commit.**

### Task 2: Ayudas de integración, Playwright y CI

**Files:**
- Create: `tests/helpers/global-setup.ts`, `tests/helpers/db.ts`, `tests/helpers/auth.ts`, `tests/helpers/stripe.ts`
- Create: `tests/integration/smoke.test.ts`, `playwright.config.ts`, `e2e/smoke.spec.ts`, `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `global-setup.ts` levanta `postgres:16-alpine` con Testcontainers, exporta `DATABASE_URL` y ejecuta `prisma migrate deploy`.
- Produces: `resetDb(): Promise<void>` (vacía todas las tablas) y `createUser(email?: string): Promise<User>`, `createConfiguration(overrides?): Promise<Configuration>`, `createOrder(overrides?): Promise<Order>`.
- Produces: `mockKindeUser(user: { id: string; email: string } | null): void`, que hace `vi.mock` de `@kinde-oss/kinde-auth-nextjs/server` para que `getUser()` devuelva ese usuario.
- Produces: `signedStripeRequest(event: object, secret = 'whsec_test'): Request`, un `POST` con el header `stripe-signature` de `stripe.webhooks.generateTestHeaderString`.

- [ ] **Step 1: Prueba que falla.** `tests/integration/smoke.test.ts`: `createOrder()` y luego `db.order.count() === 1`; tras `resetDb()`, `0`.
- [ ] **Step 2: Ejecutar** `npm run test:integration` → falla porque faltan las ayudas.
- [ ] **Step 3: Implementar las ayudas.** Playwright: `webServer` con `npm run build && npm start` en el puerto 3100, solo Chromium. `e2e/smoke.spec.ts`: la portada responde 200 y muestra el texto principal.
- [ ] **Step 4: CI:** un job en `ubuntu-latest` con Node 26 que ejecuta `npm ci`, `lint`, `typecheck`, `test:unit`, `test:integration` (Docker disponible en el runner) y `build` con variables ficticias. Sin secretos.
- [ ] **Step 5: Verificar:** `npm run test:integration` → PASS; `npx playwright test e2e/smoke.spec.ts` → PASS.
- [ ] **Step 6: Commit.**

---

## E2 · Pago (en paralelo con E3)

### Task 3: Webhook idempotente y checkout correcto

**Files:**
- Delete: `src/app/api/webhooks/Route.ts`; Create: `src/app/api/webhooks/route.ts`
- Create: `src/lib/orders/handle-checkout-completed.ts`
- Modify: `src/app/configure/preview/actions.ts`
- Test: `tests/integration/webhook.test.ts`, `tests/integration/checkout.test.ts`

**Interfaces:**
- Consumes: ayudas del Task 2 y `calculatePriceCents`.
- Produces: `handleCheckoutCompleted(session: Stripe.Checkout.Session, db: PrismaClient): Promise<'paid' | 'already_processed' | 'ignored'>`. Dentro de `db.$transaction`, `updateMany({ where: { id, isPaid: false }, data: { isPaid: true } })`; si `count === 1`, crea y enlaza las direcciones presentes. `'ignored'` si faltan los metadatos o el pedido no existe.
- Produces: `POST(req: Request): Promise<Response>` con los códigos de *Global Constraints*, usando `stripe` de `src/lib/stripe.ts`.

- [ ] **Step 1: Pruebas que fallan** (`webhook.test.ts`):
  - `marks the order paid and stores both addresses` → 200, `isPaid` true, 1 `ShippingAddress` y 1 `BillingAddress`.
  - `same event twice keeps one set of addresses`, en secuencia y con `Promise.all` → 2 × 200, un solo juego de direcciones.
  - `invalid signature returns 400 and writes nothing`.
  - `missing metadata returns 200 and writes nothing`; `unknown orderId returns 200 and writes nothing`.
  - `session without shipping_details marks paid without addresses`.
  - `other event types return 200`.
- [ ] **Step 2: Pruebas que fallan** (`checkout.test.ts`, con `stripe.checkout.sessions.create` simulado con `vi.spyOn`):
  - `reuses an unpaid order for the same user and configuration`.
  - `creates a new order when the previous one is paid`.
  - `uses price_data with the server price and card only` → `unit_amount === 2200` para polycarbonate + textured, `payment_method_types` `['card']`, países `['CL','US','DE']`, sin llamadas a `stripe.products.create`.
  - `rejects when not logged in`.
- [ ] **Step 3: Ejecutar** `npm run test:integration` → fallan.
- [ ] **Step 4: Implementar** `handleCheckoutCompleted`, la nueva `route.ts` y los cambios de `createCheckoutSession`.
- [ ] **Step 5: Verificar** `npm run test:integration`, `typecheck` y `lint` → PASS.
- [ ] **Step 6: Commit.**

### Task 4: Página de gracias

**Files:**
- Create: `src/app/thank-you/page.tsx`, `src/app/thank-you/ThankYou.tsx` (cliente), `src/app/thank-you/actions.ts`
- Test: `tests/integration/thank-you.test.ts`

**Interfaces:**
- Produces: `getPaymentStatus({ orderId }: { orderId: string }): Promise<{ isPaid: boolean }>`, que lanza `notFound()` si no hay sesión, si el pedido no existe o si es de otro usuario.
- Produces: `getOrderSummary(orderId: string, userId: string)` para la página del servidor, con la misma regla.

- [ ] **Step 1: Pruebas que fallan:** `owner gets isPaid false then true`; `other user's order is not found`; `anonymous is not found`.
- [ ] **Step 2: Ejecutar** → fallan.
- [ ] **Step 3: Implementar.** El cliente consulta `getPaymentStatus` con TanStack Query cada 2 s mientras `isPaid` sea `false`, con el texto "Confirming your payment…". Cuando está pagado: imagen recortada, modelo, material, acabado, total formateado desde `amountCents` y dirección de envío si existe.
- [ ] **Step 4: Verificar** `npm run test:integration`, `typecheck`, `lint` y `build` → PASS.
- [ ] **Step 5: Commit.**

---

## E3 · Panel (en paralelo con E2)

### Task 5: Permisos y acciones del panel

**Files:**
- Create: `src/lib/authz.ts`, `src/app/dashboard/actions.ts`, `src/app/dashboard/queries.ts`
- Test: `tests/unit/authz.test.ts`, `tests/integration/dashboard.test.ts`

**Interfaces:**
- Produces: `type AuthzEnv = { adminEmail?: string; demoMode: boolean }`; `getAuthzEnv(): AuthzEnv`.
- Produces: `isAdmin(user: { email?: string | null } | null, env: AuthzEnv): boolean`; `canViewDashboard(user, env): boolean`; `canUpdateOrder(user: { id: string; email?: string | null } | null, order: { userId: string; isSample: boolean }, env: AuthzEnv): boolean`.
- Produces: `getDashboardData(user: { id: string; email?: string | null }, env: AuthzEnv)` → `{ revenue7dCents: number; revenue30dCents: number; countsByStatus: Record<OrderStatus, number>; orders: Array<Order & { canUpdate: boolean; ... }> }`. Solo pedidos pagados. El administrador ve todos; en demo, los de ejemplo más los propios.
- Produces: `updateOrderStatus({ orderId, status }: { orderId: string; status: OrderStatus }): Promise<void>`, que rechaza con un error si `canUpdateOrder` es falso.

- [ ] **Step 1: Pruebas unitarias que fallan:** una por fila de la tabla 5.3 del diseño, más: el administrador no puede modificar un pedido de ejemplo (`isSample` nunca es modificable); con `adminEmail` indefinido nadie es administrador; un usuario `null` → todo `false`.
- [ ] **Step 2: Pruebas de integración que fallan:** `demo visitor sees samples and own paid orders only`; `demo visitor cannot update a sample or another user's order`; `demo visitor updates own order`; `admin sees all and updates non-sample orders`; `non-admin without demo mode is rejected`; `revenue counts only paid orders in the window`.
- [ ] **Step 3: Ejecutar** → fallan.
- [ ] **Step 4: Implementar.**
- [ ] **Step 5: Verificar** `npm run test:unit` y `npm run test:integration` → PASS.
- [ ] **Step 6: Commit.**

### Task 6: Página del panel, seed y enlace

**Files:**
- Create: `src/app/dashboard/page.tsx`, `src/app/dashboard/StatusSelect.tsx`, `prisma/seed.ts`, `public/samples/case-1.png` … `case-4.png`
- Modify: `src/components/Navbar.tsx` (hoy el enlace "Dashboard" apunta por error a `/api/auth/logout`)

**Interfaces:**
- Consumes: `canViewDashboard`, `getDashboardData` y `updateOrderStatus` del Task 5.

- [ ] **Step 1: Implementar la página:** `notFound()` si `!canViewDashboard`. Muestra las métricas, la tabla de pedidos y `StatusSelect` solo cuando `canUpdate` es verdadero. En demo, muestra un aviso con lo que el visitante puede hacer. Los textos van en inglés.
- [ ] **Step 2: Seed idempotente:** borra y vuelve a crear solo los registros `isSample`. Crea 8 pedidos pagados de los últimos 30 días, con estados variados, 3 usuarios ficticios (`@example.com`) e imágenes de `public/samples/`.
- [ ] **Step 3: Navbar:** el enlace "Dashboard" va a `/dashboard` y se muestra si `canViewDashboard(user, getAuthzEnv())`.
- [ ] **Step 4: Verificar** `npx prisma db seed` dos veces contra la base de datos local → siempre 8 pedidos de ejemplo. `npm run typecheck`, `lint` y `build` → PASS. Captura manual del panel adjunta en la entrega.
- [ ] **Step 5: Commit.**

---

## E4 · Presentación

### Task 7: Aviso de demo, end-to-end y README

**Files:**
- Create: `src/components/DemoBanner.tsx`; Modify: `src/app/page.tsx`
- Create: `e2e/configure.spec.ts`
- Rewrite: `README.md` (inglés); Create: `README.es.md`; Create: `docs/assets/*.png`

- [ ] **Step 1: Prueba que falla** (`e2e/configure.spec.ts`): `home shows demo banner with test card when DEMO_MODE`; `upload page renders the dropzone`; `preview without session opens the login modal`. Las dos últimas usan una configuración creada por el seed de la prueba.
- [ ] **Step 2: Ejecutar** `npm run test:e2e` → fallan.
- [ ] **Step 3: Implementar** `DemoBanner` (visible solo con `DEMO_MODE`), con la tarjeta `4242 4242 4242 4242`, cualquier fecha futura y CVC, y un enlace a `/dashboard`.
- [ ] **Step 4: README** según la sección 5.5 del diseño: qué es, demo, capturas, diagrama del flujo de pago y webhook (Mermaid), decisiones (idempotencia, centavos, autorización en servidor y modo demo), cómo ejecutarlo y probarlo, y créditos honestos al tutorial de origen. Las capturas se toman en local con el seed.
- [ ] **Step 5: CI end-to-end:** añadir a `.github/workflows/ci.yml` un job `e2e` con un servicio `postgres:16-alpine`, `prisma migrate deploy`, instalación de Chromium de Playwright y `npm run test:e2e` con variables ficticias y `DEMO_MODE=true`. Guardar el informe de Playwright si falla. (Excepción acordada a los archivos de E1: E4 va después de E1.)
- [ ] **Step 6: Verificar** `npm run test:e2e` → PASS y la suite completa de CI en local → PASS.
- [ ] **Step 7: Commit.**

---

## E5 · Despliegue (propietario + Claude Code, sin Codex)

### Task 8: Vercel + Neon

- [ ] Crear el proyecto en Neon y aplicar `prisma migrate deploy` y `prisma db seed`.
- [ ] Revisar las cuentas de Kinde y UploadThing (ver la nota privada de servicios) y actualizar las URLs de redirección al subdominio.
- [ ] Stripe en modo prueba: claves de prueba y endpoint del webhook en `https://<subdominio>/api/webhooks` con el evento `checkout.session.completed`.
- [ ] Vercel: importar el repo, cargar las variables y `DEMO_MODE=true`, y apuntar el subdominio con un CNAME.
- [ ] Verificar en producción: compra completa con `4242…` → la página de gracias pasa a pagado → el pedido aparece en el panel; probar dos veces el reenvío del evento desde el dashboard de Stripe → sin direcciones duplicadas.
