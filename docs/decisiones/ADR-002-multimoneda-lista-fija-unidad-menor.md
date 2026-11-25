# ADR-002 · Multimoneda con lista fija de precios y montos en unidad menor

[Decisiones](README.md) · [Inicio](../00-inicio.md)

**Estado:** Propuesto (diseño aprobado el 2026-11-25; este ADR está pendiente de aprobación)

## Contexto

El comprador tiene que poder pagar en USD, EUR o CLP (F8, [spec](../superpowers/specs/2026-11-25-idiomas-pedidos-multimoneda-design.md)). Hoy el precio solo existe en USD, en centavos (`amountCents`), y la moneda está fija en el cobro. El CLP no tiene decimales. El precio tiene que calcularse en el servidor y no puede depender de servicios externos.

## Decisión

- **Precios:** cada moneda tiene su lista fija de precios en `src/config/products.ts`, sin tasas de cambio. Los montos se guardan en la unidad menor de cada moneda: 100 por unidad en USD y EUR, 1 en CLP.
- **Cálculo y formato:** un único cálculo, `calculatePrice(configuration, currency)`, y un único formateador, `formatMoney(amount, currency, locale)`.
- **Preferencia:** la moneda elegida se guarda en la cookie `CURRENCY` y se valida en el servidor. Si no es válida o no existe, se usa USD.
- **Pedidos:** se añade `Order.currency` con valor por defecto `'usd'`. `amountCents` conserva su nombre y pasa a significar "unidad menor de `currency`".
- **Webhook:** solo marca un pedido como pagado si el monto y la moneda de Stripe coinciden con los del pedido.

## Alternativas consideradas

- **Convertir desde USD con una tasa externa:** los precios cambiarían a diario, terminarían en cifras poco redondas y dependerían de un servicio externo. Se descarta.
- **Precios en Stripe (objetos Price por moneda):** obliga a mantener los precios fuera del código y a sincronizarlos. El precio se calcula a partir de la configuración, así que encaja mejor calcularlo en el servidor.
- **Guardar montos decimales:** abre la puerta a errores de redondeo y no coincide con lo que espera Stripe.
- **Renombrar `amountCents` a `amountMinor`:** es más exacto, pero toca la migración, la semilla, las pruebas y todas las consultas sin ganar en comportamiento. Basta con documentarlo en el esquema.

## Consecuencias

- **Base de datos:** la migración solo añade la columna; los pedidos existentes quedan en USD.
- **Ingresos del panel:** se agrupan por moneda y no se suman entre monedas. La meta semanal cuenta solo USD.
- **Precios:** cambiarlos significa editar el código y desplegar. Cada nueva moneda exige definir sus precios y su mínimo de cobro en Stripe.
- **Divisiones por 100:** cualquier división por 100 fuera de `src/lib/money.ts` es un error. El caso del CLP (cobrar `13990`, no `1399000`) está cubierto por pruebas.
