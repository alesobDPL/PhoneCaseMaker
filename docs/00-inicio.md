# PhoneCaseMaker

Configurador de fundas personalizadas: el usuario sube una imagen, la ajusta sobre la funda, elige modelo, material y acabado, y paga con Stripe. Proyecto de portafolio.

## Estado actual · actualizado 2026-11-24

- **Fase:** despliegue.
- **Último avance:** [diseño](superpowers/specs/2026-11-23-portafolio-design.md) y [plan](superpowers/plans/2026-11-23-portafolio.md) aprobados el 2026-11-23: pago correcto, panel con modo demo, pruebas y CI, y despliegue en Vercel + Neon.
- **Encargos:** E1 a E4 aceptados e integrados en `main` local (`911efe6`, sin push): pago idempotente, página de gracias, panel con modo demo, aviso de demo, README bilingüe y CI. Pruebas: 12 unitarias, 28 de integración y 4 end-to-end.
- **Bloqueos:** ninguno.
- **Siguiente paso:** E5, el despliegue en Vercel + Neon con el propietario (cuentas, Stripe en modo prueba y subdominio), y después las capturas del panel y los TODO del README.
- **Última bitácora:** `privado/bitacora/2026-11-24-1118-implementacion-e1-e4.md` (privada).

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
