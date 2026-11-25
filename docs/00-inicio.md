# PhoneCaseMaker

Configurador de fundas personalizadas: el usuario sube una imagen, la ajusta sobre la funda, elige modelo, material y acabado, y paga con Stripe. Proyecto de portafolio.

## Estado actual · actualizado 2026-11-25

- **Fase:** despliegue (E5, en curso).
- **Último avance:** la demo está en producción en Vercel + Neon, en el subdominio del propietario. La base está migrada y sembrada. Next.js subió a 15.5.29 para corregir avisos de seguridad (`e63e9dd`) y el seed admite bases remotas (`7b41af0`). `main` ya está en el remoto.
- **Encargos:** E1 a E4 aceptados y en `main`. E5 lo ejecuta Claude Code con el propietario, sin encargo a Codex.
- **Bloqueos:** falta recargar una variable de entorno en Vercel y redesplegar. Hasta entonces no se ven el aviso de demo ni las páginas que leen la base. El webhook de Stripe (modo prueba) aún no está configurado.
- **Siguiente paso:**
  1. Recargar la variable y redesplegar.
  2. Verificar el aviso de demo y las páginas con base de datos.
  3. Configurar el webhook de Stripe y hacer una compra de prueba.
  4. Tomar las capturas y cerrar los TODO del README.
- **Última bitácora:** `privado/bitacora/2026-11-25-1226-despliegue-vercel.md` (privada).

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
