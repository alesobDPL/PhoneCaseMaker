# PhoneCaseMaker

Configurador de fundas personalizadas: el usuario sube una imagen, la ajusta sobre la funda, elige modelo, material y acabado, y paga con Stripe. Proyecto de portafolio.

## Estado actual · actualizado 2026-11-27

- **Fase:** terminado en producción (F6–F8 en `main` y desplegado el 2026-11-27; verificación pública básica hecha)
- **Funcionalidad activa:** ninguna. F6 Idiomas ES/EN, F7 "Mis pedidos" y F8 Multimoneda terminadas: [spec](superpowers/specs/2026-11-25-idiomas-pedidos-multimoneda-design.md) y [plan](superpowers/plans/2026-11-25-idiomas-pedidos-multimoneda.md) **Aprobados** el 2026-11-25; [ADR-001](decisiones/ADR-001-idiomas-next-intl-prefijo-url.md), [ADR-002](decisiones/ADR-002-multimoneda-lista-fija-unidad-menor.md) y [ADR-003](decisiones/ADR-003-verificacion-de-sesion.md) aprobados.
- **Lote en curso:** ninguno. Pruebas del conjunto antes del merge: typecheck, lint (2 advertencias previas), unit 99, integración 45 y e2e 39 (2 `fixme` del estado de error de Mis pedidos).
- **Último avance:** compras de prueba en EUR y CLP (sandbox, webhook reproducido en local); merge a `main` (1d69aa9); migración `20261125120000_order_currency` aplicada en producción; push de `main` (cbb98ee) y despliegue en Vercel correcto; `/es`, `/en`, `/es/orders` (redirige al login sin datos) y `/es/configure/upload` responden en producción. Worktrees y ramas E7 a E19 eliminados.
- **Bloqueos:** ninguno. Nota: con `next start` en local UploadThing falla (no alcanza localhost); usar `next dev`.
- **Siguiente paso:**
  1. Opcional: compra de prueba en producción solo con el sí del propietario y claves de prueba; hoy el webhook real de Stripe en producción no se ha ejercitado con F6–F8.
  2. Encargos `listo`, sin lanzar: E20 (R2: un pedido no cambia de moneda ni monto; sin migración; requiere aprobar [ADR-004](decisiones/ADR-004-pedido-inmutable-en-monto-y-moneda.md), **Propuesto**) y E21 (R6: SEO `hreflang`, `x-default`, `metadataBase`). Ejecutor recomendado: Sonnet en ambos. Lanzar con Claude en vez de Codex exige el sí del propietario.
  3. El enlace al tutorial del README **no se pondrá** (decisión del propietario).
- **Última bitácora:** `privado/bitacora/2026-11-27-1500-f6-f8-e19-reintentar-integrado.md` (privada).

| Encargo | Lote | Estado | Siguiente paso |
| --- | --- | --- | --- |
| E6 webhook-direccion | — | integrado, desplegado y verificado | — (worktree y rama ya eliminados) |
| E7 onuploaderror | — | integrado en main y desplegado | — (worktree y rama eliminados) |
| E8 a E19 | 0 a 4 | integrados en `main` (merge 1d69aa9) y desplegados | — (worktrees y ramas eliminados) |
| E20 pedido-por-moneda | — | listo | Propietario: aprobar ADR-004 y ordenar lanzar |
| E21 seo-hreflang | — | listo | Propietario: ordenar lanzar |

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
