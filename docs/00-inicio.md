# PhoneCaseMaker

Configurador de fundas personalizadas: el usuario sube una imagen, la ajusta sobre la funda, elige modelo, material y acabado, y paga con Stripe. Proyecto de portafolio.

## Estado actual · actualizado 2026-11-27

- **Fase:** revisión (F6–F8: lotes 0 a 3 integrados; cierre de la revisión con el propietario)
- **Funcionalidad activa:** F6 Idiomas ES/EN, F7 "Mis pedidos" y F8 Multimoneda, juntas: [spec](superpowers/specs/2026-11-25-idiomas-pedidos-multimoneda-design.md) **Aprobado** el 2026-11-25; [plan](superpowers/plans/2026-11-25-idiomas-pedidos-multimoneda.md) **Aprobado** el 2026-11-25 (rama `feat/f6-f8-idiomas-pedidos-moneda`, punta 0be10e9; [ADR-001](decisiones/ADR-001-idiomas-next-intl-prefijo-url.md), [ADR-002](decisiones/ADR-002-multimoneda-lista-fija-unidad-menor.md) y [ADR-003](decisiones/ADR-003-verificacion-de-sesion.md) aprobados). F5 Despliegue terminada (en `main`, verificada en producción el 2026-11-25).
- **Lote en curso:** 3 integrado (E18 aceptado el 2026-11-27, merge 0be10e9 en `f6-f8-base`). Pruebas del conjunto: typecheck, lint (2 advertencias previas), unit 99, integración 45, build y e2e 39 (2 `fixme` del estado de error de Mis pedidos).
- **Último avance:** el propietario hizo el login real con Kinde en local (`next dev`, localhost:3000): sesión, `/es/orders` (estado vacío) y subida con UploadThing funcionan. Condición H2 de E16 cumplida. `ADMIN_EMAIL` quitado de producción por el propietario.
- **Bloqueos:** ninguno. Nota: con `next start` en local UploadThing falla (no alcanza localhost); usar `next dev`.
- **Siguiente paso:**
  1. Cierre de la revisión: captura manual del estado de error de Mis pedidos (guardar en `privado/fases-y-pruebas/`), prueba con teclado en Mis pedidos y Lighthouse de accesibilidad >=95 (con `npx`, sin instalar nada en el proyecto, si el propietario lo autoriza).
  2. Con el propietario: compra real de prueba en EUR y CLP, migración aditiva al desplegar, y merge a `main` con su sí.
  3. Después del merge, como encargos aparte: R2 (sesión de Stripe antigua tras cambiar de moneda; migración aditiva y ADR) y R6 (SEO: `hreflang`, `x-default`, `metadataBase`).
  4. E7 `onuploaderror` integrado en `main` (2026-11-25, sin push ni despliegue). Pendiente, con el sí del propietario: limpiar worktrees y ramas de E7 a E18 (quitar antes el enlace `node_modules` de cada worktree) y publicar E7.
  5. El enlace al tutorial del README **no se pondrá** (decisión del propietario).
- **Última bitácora:** `privado/bitacora/2026-11-27-1200-f6-f8-revision-final-y-e18.md` (privada).

| Encargo | Lote | Estado | Siguiente paso |
| --- | --- | --- | --- |
| E6 webhook-direccion | — | integrado, desplegado y verificado | — (worktree y rama ya eliminados) |
| E7 onuploaderror | — | integrado en main (48e5369), sin publicar | Limpiar worktree y rama; push y despliegue con el sí del propietario |
| E8 a E18 | 0 a 3 | integrados en la rama de la funcionalidad, pruebas del conjunto ok | — (limpiar worktrees tras el merge) |

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
