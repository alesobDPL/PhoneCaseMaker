# PhoneCaseMaker

Configurador de fundas personalizadas: el usuario sube una imagen, la ajusta sobre la funda, elige modelo, material y acabado, y paga con Stripe. Proyecto de portafolio.

## Estado actual · actualizado 2026-11-27

- **Fase:** despliegue (F6–F8 integrado en `main` el 2026-11-27, merge 1d69aa9, sin push; falta la migración en producción)
- **Funcionalidad activa:** F6 Idiomas ES/EN, F7 "Mis pedidos" y F8 Multimoneda, juntas: [spec](superpowers/specs/2026-11-25-idiomas-pedidos-multimoneda-design.md) **Aprobado** el 2026-11-25; [plan](superpowers/plans/2026-11-25-idiomas-pedidos-multimoneda.md) **Aprobado** el 2026-11-25 (rama `feat/f6-f8-idiomas-pedidos-moneda`, punta 4b39a6a; [ADR-001](decisiones/ADR-001-idiomas-next-intl-prefijo-url.md), [ADR-002](decisiones/ADR-002-multimoneda-lista-fija-unidad-menor.md) y [ADR-003](decisiones/ADR-003-verificacion-de-sesion.md) aprobados). F5 Despliegue terminada (en `main`, verificada en producción el 2026-11-25).
- **Lote en curso:** 4 integrado (E19 aceptado el 2026-11-27, merge 4b39a6a en `f6-f8-base`). Pruebas del conjunto: typecheck, lint (2 advertencias previas), unit 99, integración 45 y e2e 39 (2 `fixme` del estado de error de Mis pedidos).
- **Último avance:** H3 (Reintentar de Mis pedidos no recuperaba la página) corregido con E19 e integrado. Antes: login real con Kinde y subida con UploadThing verificados en local; `ADMIN_EMAIL` quitado de producción.
- **Bloqueos:** ninguno. Nota: con `next start` en local UploadThing falla (no alcanza localhost); usar `next dev`.
- **Siguiente paso:**
  1. Revisión cerrada: Lighthouse (Mis pedidos 96), teclado, estado de error y H3 corregido (`privado/fases-y-pruebas/`).
  2. Compra de prueba (Stripe sandbox, tarjeta de prueba) hecha el 2026-11-27 en local, en EUR (13,00 €) y en CLP ($13.990): precio en vista previa, cobro en la moneda elegida, pedido en Mis pedidos y confirmación correctas. El webhook se reprodujo localmente firmado (no hay Stripe CLI), no es la entrega real de Stripe. Merge a `main` hecho (1d69aa9). Pendiente: aplicar la migración aditiva `20261125120000_order_currency` en producción (único pendiente según `migrate status`; el permiso de la sesión lo bloqueó, la aplica el propietario o se autoriza), y después push y despliegue con su sí.
  3. Después del merge, como encargos aparte: R2 (sesión de Stripe antigua tras cambiar de moneda; migración aditiva y ADR) y R6 (SEO: `hreflang`, `x-default`, `metadataBase`).
  4. E7 `onuploaderror` integrado en `main` (2026-11-25, sin push ni despliegue). Pendiente, con el sí del propietario: limpiar worktrees y ramas de E7 a E18 (quitar antes el enlace `node_modules` de cada worktree) y publicar E7.
  5. El enlace al tutorial del README **no se pondrá** (decisión del propietario).
- **Última bitácora:** `privado/bitacora/2026-11-27-1500-f6-f8-e19-reintentar-integrado.md` (privada).

| Encargo | Lote | Estado | Siguiente paso |
| --- | --- | --- | --- |
| E6 webhook-direccion | — | integrado, desplegado y verificado | — (worktree y rama ya eliminados) |
| E7 onuploaderror | — | integrado en main (48e5369), sin publicar | Limpiar worktree y rama; push y despliegue con el sí del propietario |
| E8 a E19 | 0 a 4 | integrados en la rama de la funcionalidad, pruebas del conjunto ok | — (limpiar worktrees tras el merge) |

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
