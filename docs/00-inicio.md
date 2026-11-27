# PhoneCaseMaker

Configurador de fundas personalizadas: el usuario sube una imagen, la ajusta sobre la funda, elige modelo, material y acabado, y paga con Stripe. Proyecto de portafolio.

## Estado actual · actualizado 2026-11-27

- **Fase:** revisión (F6–F8, lote 2 integrado; faltan las comprobaciones de cierre)
- **Funcionalidad activa:** F6 Idiomas ES/EN, F7 "Mis pedidos" y F8 Multimoneda, juntas: [spec](superpowers/specs/2026-11-25-idiomas-pedidos-multimoneda-design.md) **Aprobado** el 2026-11-25; [plan](superpowers/plans/2026-11-25-idiomas-pedidos-multimoneda.md) **Aprobado** el 2026-11-25 (rama `feat/f6-f8-idiomas-pedidos-moneda`; [ADR-001](decisiones/ADR-001-idiomas-next-intl-prefijo-url.md), [ADR-002](decisiones/ADR-002-multimoneda-lista-fija-unidad-menor.md) y [ADR-003](decisiones/ADR-003-verificacion-de-sesion.md) aprobados). F5 Despliegue terminada (en `main`, verificada en producción el 2026-11-25).
- **Lote en curso:** 2 integrado entero (E13 a E17) en la rama de la funcionalidad, punta 832e9b5. Pruebas del conjunto: unit 99, integración 45, build, e2e 37 (2 `fixme` del estado de error de Mis pedidos). Capturas: matriz de 84 en `test-results/capturas/` (sin versionar) y 4 del README en `docs/assets/`.
- **Último avance:** E15 pasó por una ronda de corrección (defectos de las propias pruebas) y quedó integrado. La verificación de sesión del servidor (E16, ADR-003) está integrada.
- **Bloqueos:** ninguno para seguir. Medida provisional: el propietario quita `ADMIN_EMAIL` del entorno de producción hasta el merge (lo hace él). Antes del merge, el propietario prueba un login real con Kinde en un entorno de prueba (H2 de E16).
- **Siguiente paso:**
  1. Revisión final de la rama por Opus (en curso); informe en `privado/fases-y-pruebas/revision-final-f6-f8-idiomas-pedidos-moneda.md`. Sus hallazgos bloqueantes se vuelven encargos de corrección.
  2. Cierre del lote 2 (Claude): captura manual del estado de error de Mis pedidos, prueba con teclado en Mis pedidos y Lighthouse de accesibilidad >=95 (si el propietario lo autoriza con `npx`, sin instalar nada en el proyecto).
  3. Con el propietario: compra real de prueba en EUR y CLP, migración aditiva al desplegar, login real con Kinde, y merge a `main` con su sí.
  4. E7 `onUploadError` integrado en `main` (2026-11-25, sin push ni despliegue). Pendiente, con el sí del propietario: limpiar worktrees y ramas de E7 a E17, y publicar E7.
  5. El enlace al tutorial del README **no se pondrá** (decisión del propietario).
- **Última bitácora:** `privado/bitacora/2026-11-25-2345-f6-f8-lote-2-seguridad-de-sesion.md` (privada).

| Encargo | Lote | Estado | Siguiente paso |
| --- | --- | --- | --- |
| E6 webhook-direccion | — | integrado, desplegado y verificado | — (worktree y rama ya eliminados) |
| E7 onuploaderror | — | integrado en main (48e5369), sin publicar | Limpiar worktree y rama; push y despliegue con el sí del propietario |
| E8 a E12 | 0 y 1 | integrados en la rama de la funcionalidad | — |
| E13, E14, E16, E17 | 2 | integrados, pruebas del conjunto ok | — |
| E15 e2e-capturas | 2 | integrado (3b0fbfa), pruebas del conjunto ok | — |

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
