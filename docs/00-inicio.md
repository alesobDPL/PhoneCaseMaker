# PhoneCaseMaker

Configurador de fundas personalizadas: el usuario sube una imagen, la ajusta sobre la funda, elige modelo, material y acabado, y paga con Stripe. Proyecto de portafolio.

## Estado actual · actualizado 2026-11-25

- **Fase:** implementación (F6–F8, lote 2)
- **Funcionalidad activa:** F6 Idiomas ES/EN, F7 "Mis pedidos" y F8 Multimoneda, juntas: [spec](superpowers/specs/2026-11-25-idiomas-pedidos-multimoneda-design.md) **Aprobado** el 2026-11-25; [plan](superpowers/plans/2026-11-25-idiomas-pedidos-multimoneda.md) **Aprobado** el 2026-11-25 (rama `feat/f6-f8-idiomas-pedidos-moneda`; [ADR-001](decisiones/ADR-001-idiomas-next-intl-prefijo-url.md), [ADR-002](decisiones/ADR-002-multimoneda-lista-fija-unidad-menor.md) y [ADR-003](decisiones/ADR-003-verificacion-de-sesion.md) aprobados). F5 Despliegue terminada (en `main`, verificada en producción el 2026-11-25).
- **Lote en curso:** 2. E13 y E14 integrados en la rama de la funcionalidad (punta a70f6a3; pruebas del conjunto: unit 75, integración 45, build, e2e 21). E16 (verificación de sesión en el servidor, ADR-003) y E17 (nombre accesible del botón de cierre del modal) lanzados a Codex. E15 (e2e y capturas) en borrador, se lanza tras integrar E16 y E17.
- **Último avance:** Opus redactó E16 y E17; Sonnet auditó y aceptó E13 y E14. Se decidió verificar la firma de los tokens de sesión en el servidor (ADR-003), con `jose` y el SDK de Kinde fijado en 2.4.6.
- **Bloqueos:** ninguno. El propietario quita `ADMIN_EMAIL` del entorno de producción como medida provisional hasta el merge (lo hace él).
- **Siguiente paso:**
  1. Recoger y auditar E16 y E17 (aviso al terminar Codex). En E16, Claude ejecuta la comprobación local con cookies falsificadas, solo en local y con valores ficticios.
  2. Integrar E16 y E17 a mano en el worktree `f6-f8-base` (el proyecto raíz sigue en `main`) y correr las pruebas del conjunto.
  3. Comprobar el borrador de E15 contra la rama integrada, marcarlo `listo` y lanzarlo.
  4. Al cerrar el lote 2: Lighthouse de accesibilidad >=95 y prueba con teclado en Mis pedidos, compra real de prueba en EUR y CLP, revisión de las capturas de cinco estados, migración aditiva al desplegar, revisión final de la rama por Opus y merge a `main` con el sí del propietario.
  5. E7 `onUploadError` integrado en `main` (2026-11-25, sin push ni despliegue). Pendiente, con el sí del propietario: limpiar worktrees y ramas de E7 a E14, y publicar E7.
  6. El enlace al tutorial del README **no se pondrá** (decisión del propietario).
- **Última bitácora:** `privado/bitacora/2026-11-25-2345-f6-f8-lote-2-seguridad-de-sesion.md` (privada).

| Encargo | Lote | Estado | Siguiente paso |
| --- | --- | --- | --- |
| E6 webhook-direccion | — | integrado, desplegado y verificado | — (worktree y rama ya eliminados) |
| E7 onuploaderror | — | integrado en main (48e5369), sin publicar | Limpiar worktree y rama; push y despliegue con el sí del propietario |
| E8 base-dinero, E9 base-idiomas | 0 | integrados en la rama de la funcionalidad | — |
| E10 cobro-multimoneda, E11 mis-pedidos, E12 configurador | 1 | integrados en la rama de la funcionalidad | — |
| E13 portada-comunes | 2 | integrado (1d065c5), pruebas del conjunto ok | — |
| E14 resumen-panel | 2 | integrado (a70f6a3), pruebas del conjunto ok | — |
| E16 verificar-sesion | 2 | lanzado a Codex | Recoger, auditar y comprobar en local |
| E17 dialog-close | 2 | lanzado a Codex | Recoger y auditar |
| E15 e2e-capturas | 2 | borrador (se lanza tras E16 y E17) | Comprobar, marcar `listo` y lanzar |

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
