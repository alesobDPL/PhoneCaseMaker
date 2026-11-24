# Arquitectura

[Volver al inicio](../00-inicio.md)

Estado: **descripción del código existente** (2024-12). Cualquier cambio se registra como ADR en [decisiones/](../decisiones/README.md).

## Stack

Next.js 15 (App Router) + TypeScript, Tailwind y componentes Radix (estilo shadcn/ui), Prisma con PostgreSQL, Kinde para la autenticación, UploadThing para las imágenes, Stripe Checkout con webhook, y TanStack Query en el cliente.

## Flujo principal

| Paso | Ruta | Qué hace |
| --- | --- | --- |
| 1. Subir | `src/app/configure/upload` | Sube la imagen a UploadThing y crea una `Configuration` |
| 2. Diseñar | `src/app/configure/design` | Ajusta la imagen sobre la funda (`react-rnd`) y elige modelo, material, acabado y color (`src/validators`, `src/config/products.ts`) |
| 3. Previsualizar y pagar | `src/app/configure/preview` | Calcula el precio y crea la sesión de Stripe Checkout |
| 4. Confirmar | `src/app/api/webhooks` | El webhook de Stripe marca el `Order` como pagado y guarda las direcciones |
| Login | `src/app/api/auth`, `src/app/auth-callback` | Kinde; sincroniza el `User` en la base de datos |

## Datos (`prisma/schema.prisma`)

`Configuration`, `User`, `Order`, `ShippingAddress` y `BillingAddress`, más enums de modelo, material, acabado, color y estado del pedido.

## Observaciones iniciales (por validar en el brainstorming)

- Sin pruebas automatizadas ni CI.
- `ADMIN_EMAIL` existe en la configuración, pero no hay panel de administración.
- **Defecto probable:** Stripe redirige al terminar el pago a `/thank-you?orderId=…` (`src/app/configure/preview/actions.ts:74`), pero esa página no existe en `src/app`. El comprador terminaría en un 404.
- **Defecto probable:** el webhook está en `src/app/api/webhooks/Route.ts`, con mayúscula. Next.js solo reconoce `route.ts`; en Windows puede funcionar, pero en Linux (Vercel o un VPS) la ruta no existiría y los pedidos nunca se marcarían como pagados.
- `eslint-config-next` está en la versión 14 con Next 15, y React 18 convive con `@types/react` 19.
