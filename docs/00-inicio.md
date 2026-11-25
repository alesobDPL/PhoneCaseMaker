# PhoneCaseMaker

Configurador de fundas personalizadas: el usuario sube una imagen, la ajusta sobre la funda, elige modelo, material y acabado, y paga con Stripe. Proyecto de portafolio.

## Estado actual · actualizado 2026-11-25

- **Fase:** despliegue
- **Funcionalidad activa:** F5 Despliegue (spec: [portafolio](superpowers/specs/2026-11-23-portafolio-design.md) · plan: [portafolio](superpowers/plans/2026-11-23-portafolio.md) Tarea 8 · rama: `main`, sin encargo a Codex)
- **Lote en curso:** —
- **Último avance:** la demo en producción funciona de punta a punta: subida de imágenes (se corrigió una variable de entorno mal formada), login con Kinde (callbacks de producción agregados) y compra de prueba con Stripe. El webhook marca el pedido como pagado una sola vez.
- **Bloqueos:** ninguno. E6 (el webhook guarda la dirección de envío de `collected_information.shipping_details`) está en `main` y desplegado en producción (2026-11-25); falta confirmarlo con una compra de prueba.
- **Siguiente paso:**
  1. E6: repetir la compra de prueba y confirmar que el pedido guarda las direcciones de envío y facturación.
  2. Encargo `onUploadError` para que un fallo de subida muestre un aviso.
  3. Tomar las capturas y cerrar los TODO del README.
- **Última bitácora:** `privado/bitacora/2026-11-25-1606-webhook-subida-compra-prueba.md` (privada).

| Encargo | Lote | Estado | Siguiente paso |
| --- | --- | --- | --- |
| E6 webhook-direccion | — | integrado y desplegado | Propietario: repetir la compra de prueba |

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
