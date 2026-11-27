# ADR-004 · Un pedido no cambia de monto ni de moneda después de crearse

[Decisiones](README.md) · [Inicio](../00-inicio.md)

**Estado:** Propuesto (2026-11-27). Modifica la decisión D4 del [spec de F6–F8](../superpowers/specs/2026-11-25-idiomas-pedidos-multimoneda-design.md) en lo que toca a reutilizar pedidos sin pagar. Complementa [ADR-002](ADR-002-multimoneda-lista-fija-unidad-menor.md), que no cambia.

## Contexto

Al pagar, `createCheckoutSession` reutiliza el pedido sin pagar del mismo usuario y configuración y, según D4, le actualiza `amountCents` y `currency` antes de crear la sesión de Stripe. El webhook solo marca pagado un pedido si el monto y la moneda de la sesión coinciden con los del pedido (ADR-002).

Si el comprador abre Checkout en una moneda, cambia de moneda y lo abre otra vez, el pedido queda con la segunda. Si después paga la primera sesión, que sigue abierta en Stripe, hay cobro pero el pedido no queda pagado y hay que conciliarlo a mano. Lo mismo pasa si cambia la lista de precios entre dos sesiones. Nunca se marca pagado un monto incorrecto: el problema es operativo.

## Decisión

Un pedido conserva el monto y la moneda con que se creó. Al pagar se reutiliza un pedido sin pagar solo si su moneda y su monto coinciden con el precio calculado en ese momento; si no, se crea un pedido nuevo. Cada sesión de Stripe apunta así a un pedido que ya no cambia, y el webhook la acepta.

## Alternativas consideradas

- **Guardar el id de la sesión de Stripe en el pedido** (columna nueva, migración aditiva) y validar contra él en el webhook: detecta la sesión antigua, pero el cobro de esa sesión sigue sin pedido pagado. Añade migración sin resolver el caso.
- **Guardar el id de la sesión y expirar la anterior en Stripe** al crear una nueva: evita el cobro antiguo, pero añade migración, una llamada más a Stripe y un fallo posible a mitad del proceso. Queda como mejora futura si hiciera falta.
- **Mantener D4 y conciliar a mano:** sin cambios de código, pero con trabajo manual en cada caso.

## Consecuencias

- **Sin migración:** no cambia el esquema.
- **Pedidos sin pagar:** puede haber varios por usuario y configuración (uno por moneda o por precio). No se ven en Mis pedidos ni en el panel, que solo muestran pedidos pagados. Limpiarlos queda fuera de esta decisión.
- **Doble pago:** si el comprador paga dos sesiones abiertas en monedas distintas, quedan dos pedidos pagados, visibles y reembolsables, en lugar de un cobro sin pedido.
- **Pruebas:** la prueba de integración que esperaba la actualización del pedido se sustituye por las de cambio de moneda y de precio.
