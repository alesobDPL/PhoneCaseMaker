# Hoja de ruta · PhoneCaseMaker

[Volver al inicio](00-inicio.md)

Estado: **Aprobado** el 2026-11-25 por el propietario. Reconstruida en la migración al flujo de lotes a partir del [diseño](superpowers/specs/2026-11-23-portafolio-design.md) y el [plan](superpowers/plans/2026-11-23-portafolio.md) aprobados el 2026-11-23, y del historial de git. Dice **qué** se construye y en qué orden, sin detalle de implementación.

Las funcionalidades F1 a F5 comparten un solo spec y un solo plan (escritos antes de este flujo). Las siguientes tendrán su propio spec y plan justo antes de implementarse.

## Funcionalidades

| # | Funcionalidad | Depende de | Terminada cuando | Estado | Spec · Plan · Rama |
| --- | --- | --- | --- | --- | --- |
| F0 | Configurador base | — | Se sube una imagen, se ajusta sobre la funda, se eligen modelo, material y acabado y se llega a Stripe Checkout | en main | Previo a este flujo |
| F1 | Base: precio, migración, pruebas y CI | F0 | El precio se calcula en centavos y CI corre las pruebas en GitHub | en main | [spec](superpowers/specs/2026-11-23-portafolio-design.md) · [plan](superpowers/plans/2026-11-23-portafolio.md) Tareas 1–2 · `feat/e1-base` |
| F2 | Pago correcto | F1 | Un pago marca el pedido como pagado una sola vez, aun con eventos repetidos o inválidos, y el comprador ve la página de gracias | en main | plan Tareas 3–4 · `feat/e2-pago` |
| F3 | Panel de administración con modo demo | F1 | Un visitante puede probar el panel en la demo sin modificar datos de otros; sin modo demo, solo el administrador entra | en main | plan Tareas 5–6 · `feat/e3-panel` |
| F4 | Presentación | F2, F3 | Aviso de demo, pruebas end-to-end en CI y README bilingüe con capturas | en main | plan Tarea 7 · `feat/e4-presentacion` |
| F5 | Despliegue | F4 | La demo en línea muestra el aviso de demo y las páginas con datos, y una compra de prueba en Stripe marca el pedido como pagado | en main | plan Tarea 8 · `main` (sin Codex) · verificada en producción el 2026-11-25 (incluye E6) |
| F6 | Idiomas ES/EN (spec **Aprobado** 2026-11-25) | F5 | Toda la interfaz se ve en español por defecto y en inglés con el selector; la preferencia persiste; Stripe Checkout se abre en el idioma elegido | diseño | [spec](superpowers/specs/2026-11-25-idiomas-pedidos-multimoneda-design.md) |
| F7 | Mis pedidos (spec **Aprobado** 2026-11-25) | F5 | El comprador ve sus pedidos pagados con fecha, producto, total y estado de envío, y no puede ver los de otros | diseño | mismo spec |
| F8 | Multimoneda (spec **Aprobado** 2026-11-25) | F5 | El comprador elige la moneda; el precio mostrado, el cobrado por Stripe y el guardado en el pedido coinciden y se calculan en el servidor | diseño | mismo spec |

<!-- Estados: pendiente | diseño | plan | en curso | integrada | en main | descartada.
     "integrada": todos sus lotes están en la rama de la funcionalidad; "en main": solo tras el merge autorizado.
     Una funcionalidad activa a la vez (diseño, plan o en curso), salvo que el propietario apruebe otra cosa.
     Claude actualiza el Estado y los enlaces al cambiar de fase. -->

## Fuera del MVP

No objetivos del diseño: se registran, no se implementan ni se anticipan.

- Cambiar Kinde o UploadThing.
- Rediseñar la interfaz completa.
- Envíos reales, inventario y correos transaccionales.
- **Propuesto** 2026-11-25: multimoneda sale de esta lista (el propietario la autorizó como F8). F6–F8 activas a la vez con un solo spec y plan, excepción a "una funcionalidad activa" **aprobada** por el propietario el 2026-11-25, igual que el spec.
