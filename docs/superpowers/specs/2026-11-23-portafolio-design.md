# Diseño · PhoneCaseMaker listo para portafolio

[Specs](README.md) · [Inicio](../../00-inicio.md) · [Arquitectura actual](../../arquitectura/README.md)

- **Fecha:** 2026-11-23
- **Estado:** **Aprobado por el propietario el 2026-11-23**, incluidas las decisiones de la sección 7. No autoriza implementar: el plan necesita su propia aprobación.
- **Implementa:** Codex, por encargos. **Revisa:** Claude Code. **Aprueba:** el propietario.

## 1. Intención

PhoneCaseMaker es un configurador de fundas con pago en Stripe. Su base proviene de un tutorial público conocido. El propietario quiere convertirlo en una pieza de portafolio para **quien lo contrate como desarrollador** (reclutador o líder técnico). En unos minutos, esa persona debe ver en el repo y en la demo que el autor sabe construir un comercio que **no pierde pedidos ni cobra mal**, que **controla permisos en el servidor** y que **prueba lo crítico**.

Cada proyecto del portafolio demuestra algo distinto: flowdesk ya muestra servidor propio, Docker y seguridad. PhoneCaseMaker se centra en **pagos, webhooks, panel de administración y pruebas**.

## 2. Objetivos, no objetivos y antiobjetivos

**Objetivos**
1. Un flujo de pago correcto de punta a punta, también ante eventos de Stripe repetidos o inválidos.
2. Un panel de administración propio, que se pueda probar en la demo pública sin riesgo.
3. Evidencia de calidad: pruebas automatizadas de lo crítico y CI en GitHub.
4. Una demo en línea con Stripe en modo prueba, y un README que explique las decisiones.

**No objetivos:** cambiar Kinde o UploadThing, rediseñar la interfaz completa, envíos reales, multimoneda, inventario o correos transaccionales.

**Antiobjetivos** (sería un fracaso aunque funcione):
- Que un visitante pueda modificar o borrar datos que otros ven en la demo.
- Que el panel dependa solo de ocultar botones, sin autorización en el servidor.
- Que la demo pueda cobrar dinero real.
- Que el proyecto crezca sin límite: es una versión acotada.

## 3. Restricciones

- Next.js 15 (App Router), Prisma y PostgreSQL, Kinde, UploadThing y Stripe se mantienen.
- Despliegue: **Vercel + Neon** (PostgreSQL administrado, plan gratuito), en un subdominio de `alejandrosobarzo.cl`. Aprobado el 2026-11-23.
- Acceso al panel en la demo: **modo demo**. Aprobado el 2026-11-23 (sección 5.3).
- Stripe solo en **modo prueba** en la demo.
- Sin secretos en el repo; `.env.example` con valores ficticios.
- Identificadores en inglés; documentación en español; README bilingüe.

## 4. Enfoques considerados

| Decisión | Opciones | Elegida (fecha) |
| --- | --- | --- |
| Público | Quien contrata · clientes freelance | **Quien contrata** (2026-11-23) |
| Funcionalidad propia | Panel de administración · otras | **Panel de administración** (2026-11-23) |
| Despliegue | **Vercel + Neon** · VPS con Docker como flowdesk | **Vercel + Neon**: el VPS ya está demostrado en flowdesk y aquí costaría más mantenimiento (2026-11-23) |
| Panel en la demo | **Modo demo con rol de administrador** · cuenta pública de administrador · solo capturas | **Modo demo**: el reclutador lo prueba sin arruinar la demo y se demuestra el control de permisos (2026-11-23) |

## 5. Diseño

### 5.1 Defectos actuales que hay que corregir

Encontrados al leer el código el 2026-11-23:

| # | Defecto | Evidencia | Efecto |
| --- | --- | --- | --- |
| D1 | El webhook está en `Route.ts` con mayúscula | `src/app/api/webhooks/Route.ts` | En Linux (Vercel) la ruta no existe: los pedidos nunca se marcan como pagados |
| D2 | `success_url` apunta a `/thank-you`, que no existe | `preview/actions.ts:74` | 404 después de pagar |
| D3 | El webhook no es idempotente: crea direcciones nuevas en cada reenvío | `Route.ts:41-68` | Datos duplicados si Stripe reintenta |
| D4 | Cualquier error devuelve 500, también una firma inválida | `Route.ts:72-77` | Stripe reintenta eventos que nunca serán válidos |
| D5 | El checkout reutiliza un pedido aunque ya esté pagado | `preview/actions.ts:43-52` | Se puede pagar dos veces el mismo pedido |
| D6 | Se crea un `Product` de Stripe en cada checkout | `preview/actions.ts:63-71` | Llena el catálogo de Stripe; basta con `price_data` en la línea |
| D7 | `amount` es `Float` en dólares | `schema.prisma:78` | Dinero en coma flotante |
| D8 | El webhook importa la clase `stripe` del paquete, no la instancia de `src/lib/stripe.ts` | `Route.ts:4,16` | Por verificar si `constructEvent` funciona así; usar la instancia configurada |

### 5.2 Pago correcto

- **Precio:** ya se calcula en el servidor desde la `Configuration`, nunca desde el navegador, y así se mantiene. Se extrae a una función pura `calculatePriceCents(configuration)` en `src/lib/pricing.ts`, reutilizada por el checkout, el panel y las pruebas.
- **Dinero en centavos:** `Order.amount` (Float) pasa a `amountCents` (Int) con una migración. Neon parte con una base de datos nueva, así que no hay datos que convertir.
- **Checkout** (`createCheckoutSession`):
  - Reutiliza solo un pedido **no pagado** del mismo usuario y configuración. Si ya está pagado, crea uno nuevo.
  - Usa `price_data` en la línea, sin crear `Product`.
  - Solo tarjeta (`payment_method_types: ['card']`).
  - Países de envío: `CL`, `US` y `DE`.
- **Webhook** (`src/app/api/webhooks/route.ts`, en minúscula):
  - Usa la instancia de `src/lib/stripe.ts`. Firma ausente o inválida → **400**.
  - Evento `checkout.session.completed`: en **una transacción**, `updateMany({ where: { id: orderId, isPaid: false } })` marca el pedido como pagado; las direcciones se crean solo si esa actualización afectó una fila. Si afectó 0, el evento ya se procesó: **200** sin cambios.
  - Metadatos ausentes o pedido inexistente → registrar el problema y responder **200**, para que Stripe no reintente un evento inválido para siempre.
  - Errores inesperados (por ejemplo, la base de datos) → **500**, para que Stripe reintente.
  - Otros tipos de evento → **200** sin cambios.
- **Página de gracias** (`src/app/thank-you/page.tsx`):
  - Exige sesión y que el pedido sea del usuario; si no lo es, 404.
  - Mientras el webhook no llegue, muestra "confirmando tu pago" y consulta el estado cada pocos segundos con TanStack Query, mediante una acción del servidor `getPaymentStatus(orderId)` que aplica la misma comprobación de propietario.
  - Cuando está pagado, muestra un resumen: imagen, modelo, material, acabado, precio y dirección.

### 5.3 Panel de administración (`/dashboard`)

**Quién entra** (autorización siempre en el servidor, en la página y en cada acción):

| Usuario | Condición | Ve | Puede cambiar el estado de |
| --- | --- | --- | --- |
| Administrador real | email = `ADMIN_EMAIL` | Todos los pedidos | Todos |
| Visitante de la demo | `DEMO_MODE=true` y sesión iniciada | Pedidos de ejemplo + los suyos | **Solo los suyos** |
| Otro caso | — | 404 | — |

La regla vive en una función pura `canViewDashboard(user, env)` / `canUpdateOrder(user, order, env)` en `src/lib/authz.ts`, probada de forma unitaria.

**Datos de ejemplo:** el campo nuevo `Order.isSample` (Boolean, por defecto `false`) marca unos 8 pedidos cargados por `prisma db seed`, con usuarios y configuraciones ficticios e imágenes estáticas de `public/`. Se ven en el panel, pero ninguna acción los modifica.

**Contenido:**
- **Métricas:** ingresos de los últimos 7 y 30 días (solo pedidos pagados) y cantidad de pedidos por estado.
- **Tabla de pedidos pagados:** fecha, cliente (email), modelo, total y estado. Un selector de estado (en preparación → enviado → entregado, que corresponden a `awaiting_shipment` → `shipped` → `fulfilled`) se muestra solo donde está permitido.
- En `DEMO_MODE`, un aviso explica que es una demo y qué puede hacer el visitante.

**Navegación:** el enlace "Panel" de la barra aparece solo si `canViewDashboard` lo permite. Eso es comodidad: la seguridad está en el servidor.

### 5.4 Calidad

| Nivel | Qué cubre | Herramienta |
| --- | --- | --- |
| Unitarias | `calculatePriceCents`, validadores de opciones y `authz` (todas las filas de la tabla 5.3) | Vitest |
| Integración (PostgreSQL real en Docker) | Webhook: firma válida → pagado y direcciones; **mismo evento dos veces → un solo juego de direcciones**; firma inválida → 400; metadatos ausentes → 200 sin cambios. Checkout: no reutiliza un pedido pagado. Acción de estado: el visitante no puede cambiar un pedido de ejemplo ni uno ajeno | Vitest + Testcontainers; eventos firmados con `stripe.webhooks.generateTestHeaderString` |
| End-to-end | Portada, subida de imagen, diseño y previsualización hasta el aviso de inicio de sesión | Playwright |
| CI | lint, tipos, unitarias + integración y build, en cada push y pull request | GitHub Actions |

El login real de Kinde **no** se automatiza en end-to-end (decisión mía, sección 7): los flujos con sesión se prueban en integración, llamando a las acciones y rutas con un usuario simulado.

### 5.5 Presentación y despliegue

- **Dependencias:** solo alinear `eslint-config-next` con Next 15 y `@types/react`/`@types/react-dom` con React 18. Sin migraciones grandes.
- **`.env.example`** con todas las variables y valores ficticios, más `DEMO_MODE`.
- **Portada en modo demo:** un aviso visible con la tarjeta de prueba de Stripe (`4242 4242 4242 4242`) y el enlace al panel.
- **README bilingüe** (`README.md` en inglés y `README.es.md`): qué es, demo, capturas, arquitectura (diagrama del flujo de pago y webhook), decisiones (idempotencia, centavos, autorización y modo demo), cómo ejecutarlo y probarlo, y créditos honestos ("basado inicialmente en un tutorial; lo propio es…").
- **Despliegue:** Vercel + Neon, con variables en Vercel, webhook de Stripe en modo prueba apuntando a `https://<subdominio>/api/webhooks`, URLs de Kinde actualizadas y migraciones + seed en Neon. Los pasos manuales con cuentas los hace el propietario, guiado por Claude Code.

## 6. Orden de entrega (para el plan)

1. Pago correcto (5.2) + dinero en centavos + base de pruebas (Vitest, Testcontainers y CI).
2. Panel de administración (5.3) + seed.
3. Presentación: aviso de demo, end-to-end, README, `.env.example` y dependencias.
4. Despliegue en Vercel + Neon (con el propietario).

Los bloques 2 y 3 podrían ir en paralelo si el plan separa sus archivos. El bloque 1 va primero porque los demás dependen del esquema y de las pruebas.

## 7. Decisiones de Claude Code (por revisar)

- Dinero en centavos (`amountCents` Int) y migración sin conversión, porque la base de datos de Neon es nueva.
- Webhook idempotente por actualización condicional del pedido, sin tabla de eventos procesados.
- Solo tarjeta y países `CL`, `US` y `DE`.
- End-to-end sin login real de Kinde; los flujos con sesión, en integración.
- Pedidos de ejemplo con `isSample`, unos 8, con imágenes estáticas.
- README bilingüe, como flowdesk.
- Subdominio propuesto: `phonecase.alejandrosobarzo.cl` (lo confirma el propietario).
- Riesgo aceptado: en la demo pública cualquiera puede subir imágenes y crear configuraciones, lo que consume el plan gratuito de UploadThing y Neon. No se agregan límites en esta versión; se vigila el consumo y, si hace falta, se añade un límite en una iteración posterior.

## 8. Lo que queda a quien implementa

Diseño visual del panel dentro del estilo actual (Tailwind + componentes existentes), nombres internos, el intervalo exacto de consulta de la página de gracias y el contenido de los pedidos de ejemplo.
