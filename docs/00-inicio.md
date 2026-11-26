# PhoneCaseMaker

Configurador de fundas personalizadas: el usuario sube una imagen, la ajusta sobre la funda, elige modelo, material y acabado, y paga con Stripe. Proyecto de portafolio.

## Estado actual · actualizado 2026-11-25

- **Fase:** implementación (F6–F8, lote 0)
- **Funcionalidad activa:** F6 Idiomas ES/EN, F7 "Mis pedidos" y F8 Multimoneda, juntas: [spec](superpowers/specs/2026-11-25-idiomas-pedidos-multimoneda-design.md) **Aprobado** el 2026-11-25; [plan](superpowers/plans/2026-11-25-idiomas-pedidos-multimoneda.md) **Aprobado** el 2026-11-25 (rama `feat/f6-f8-idiomas-pedidos-moneda`; ADR-001 y 002 aprobados). F5 Despliegue quedó terminada (en `main`, verificada en producción el 2026-11-25).
- **Lote en curso:** 2 en preparación (el lote 1 está integrado en la rama de la funcionalidad)
- **Último avance:** la demo en producción funciona de punta a punta: subida de imágenes (se corrigió una variable de entorno mal formada), login con Kinde (callbacks de producción agregados) y compra de prueba con Stripe. El webhook marca el pedido como pagado una sola vez.
- **Bloqueos:** ninguno. E6 (el webhook guarda la dirección de envío de `collected_information.shipping_details`) está en `main`, desplegado y verificado en producción con una segunda compra de prueba (2026-11-25): el pedido quedó pagado con dirección de envío y de facturación.
- **Siguiente paso:**
  1. Lote 2 (F portada y comunes, G resumen y panel, H pruebas y capturas): Opus redacta los encargos (e13 a e15); Sonnet los comprueba y los lanza en paralelo. Al cerrarlo: revisión final de la rama por Opus, prueba de compra real y merge a `main` con el sí del propietario.
  2. Lotes 0 y 1 cerrados: E8 y E9, y E10 (f52b08e), E11 (9ad3c48) y E12 (a3408f8), integrados en `feat/f6-f8-idiomas-pedidos-moneda`; unit 81, integración 44 y e2e 18/18.
  3. E7 `onUploadError` integrado en `main` (2026-11-25, sin push ni despliegue). Pendiente, con el sí del propietario: limpiar su worktree y rama, y publicarlo.
  4. El enlace al tutorial del README **no se pondrá** (decisión del propietario).
- **Última bitácora:** `privado/bitacora/2026-11-25-1606-webhook-subida-compra-prueba.md` (privada).

| Encargo | Lote | Estado | Siguiente paso |
| --- | --- | --- | --- |
| E6 webhook-direccion | — | integrado, desplegado y verificado | — (worktree y rama ya eliminados) |
| E7 onuploaderror | — | integrado en main (48e5369), sin publicar | Limpiar worktree y rama; push y despliegue con el sí del propietario |
| E10 cobro-multimoneda | 1 | integrado en la rama de la funcionalidad | — |
| E11 mis-pedidos | 1 | integrado en la rama de la funcionalidad | — |
| E12 configurador | 1 | integrado en la rama de la funcionalidad | — |
| E8 base-dinero | 0 | integrado en la rama de la funcionalidad (501a61b) | — |
| E9 base-idiomas | 0 | integrado en la rama de la funcionalidad (2ac4a09) | — |

E1 a E4 están integrados en `main`; E6 también (2026-11-25), ya publicado.

<!-- Fases: descubrimiento | diseño | plan | implementación | revisión | despliegue | terminado.
     Este bloque es el índice; el detalle de cada encargo vive en su Seguimiento (docs/privado/encargos/).
     Mantenerlo en unas 20 líneas. Repo público: sin datos sensibles aquí. -->

## Mapa de la documentación

| Carpeta | Contenido | ¿Va a GitHub? |
| --- | --- | --- |
| [hoja-de-ruta.md](hoja-de-ruta.md) | Funcionalidades en orden, con su estado: cuánto falta para terminar | Sí |
| [arquitectura/](arquitectura/README.md) | Arquitectura actual y [criterios de desarrollo](arquitectura/criterios-desarrollo.md) | Sí |
| [decisiones/](decisiones/README.md) | Un ADR por decisión de arquitectura | Sí |
| [superpowers/specs/](superpowers/specs/README.md) | Diseños (brainstorming) | Sí |
| [superpowers/plans/](superpowers/plans/README.md) | Planes de implementación con lotes (writing-plans) | Sí |
| [privado/](privado/README.md) | Bitácora, encargos y sus ejecuciones, servicios externos y producto | No: repo git propio |

## Estado de las decisiones

- **Pendiente:** no hay decisión; no usarla como requisito.
- **Propuesto:** alternativa presentada, sin aprobación.
- **Aprobado:** acuerdo explícito del propietario, con fecha y contexto.
