# PhoneCaseMaker

Configurador de fundas personalizadas: el usuario sube una imagen, la ajusta sobre la funda, elige modelo, material y acabado, y paga con Stripe. Proyecto de portafolio.

## Estado actual · actualizado 2026-11-23

- **Fase:** implementación.
- **Último avance:** [diseño](superpowers/specs/2026-11-23-portafolio-design.md) y [plan](superpowers/plans/2026-11-23-portafolio.md) aprobados el 2026-11-23: pago correcto, panel con modo demo, pruebas y CI, y despliegue en Vercel + Neon.
- **Encargos:** E1, E2 y E3 aceptados e integrados en `main` local (`a7c9115`, sin push): pago idempotente, página de gracias y panel con modo demo. Pasan 12 pruebas unitarias y 28 de integración. E4 (presentación) en curso.
- **Bloqueos:** ninguno. Las cuentas de los servicios externos se revisan en E5.
- **Siguiente paso:** revisar E4 (aviso de demo, end-to-end, README y CI end-to-end); después E5, el despliegue con el propietario.
- **Última bitácora:** `privado/bitacora/2026-11-23-2313-adopcion-proyecto-ordenado.md` (privada).

<!-- Fases: descubrimiento | diseño | plan | implementación | revisión | despliegue | terminado.
     Mantener este bloque en unas 15 líneas. Repo público: sin datos sensibles aquí. -->

## Mapa de la documentación

| Carpeta | Contenido | ¿Va a GitHub? |
| --- | --- | --- |
| [arquitectura/](arquitectura/README.md) | Arquitectura actual y [criterios de desarrollo](arquitectura/criterios-desarrollo.md) | Sí |
| [decisiones/](decisiones/README.md) | Un ADR por decisión de arquitectura | Sí |
| [superpowers/specs/](superpowers/specs/README.md) | Diseños (brainstorming) | Sí |
| [superpowers/plans/](superpowers/plans/README.md) | Planes de implementación | Sí |
| `privado/` | Bitácora, encargos, servicios externos y producto | No: repo git propio |

## Estado de las decisiones

- **Pendiente:** no hay decisión; no usarla como requisito.
- **Propuesto:** alternativa presentada, sin aprobación.
- **Aprobado:** acuerdo explícito del propietario, con fecha y contexto.
