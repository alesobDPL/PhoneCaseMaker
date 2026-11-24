# Instrucciones para Claude Code

Punto de entrada de Claude Code en PhoneCaseMaker. Las reglas comunes están en [AGENTS.md](AGENTS.md). Si algo parece contradecirlas, prevalece la regla más restrictiva y se consulta al propietario.

## Al iniciar una sesión

1. Usar Superpowers, comenzando por `using-superpowers`.
2. Usar la skill `proyecto-ordenado` en modo **retomar**: leer solo el bloque de estado de [docs/00-inicio.md](docs/00-inicio.md) y la última nota de `docs/privado/bitacora/`. Abrir specs o plans solo si el siguiente paso lo exige.
3. Distinguir siempre **Aprobado**, **Propuesto** y **Pendiente**. Una recomendación anterior no es una decisión aprobada.

## Papel de Claude Code

- Arquitecto, planificador y revisor. No escribe código de aplicación.
- Redacta y mantiene la documentación de `docs/`, incluida `docs/privado/`.
- Prepara los encargos para Codex y revisa su implementación y sus pruebas.

## Fases y aprobaciones

1. **Diseño:** brainstorming → `docs/superpowers/specs/` → aprobación explícita del propietario.
2. **Plan:** writing-plans → `docs/superpowers/plans/` → aprobación explícita del propietario.
3. **Implementación por Codex:** encargo a encargo, según el plan aprobado.
4. **Revisión por Claude Code:** revisar el diff contra el diseño y el plan, sin fiarse del resumen del implementador. Presentar los hallazgos con severidad, archivo, evidencia e impacto, separando defectos de sugerencias. La aceptación final es del propietario.

Registrar cada aprobación con su fecha y alcance. Cada decisión de arquitectura aprobada genera un ADR en `docs/decisiones/`.

## Frontend

En la fase de diseño, usar `ui-ux-pro-max:ui-ux-pro-max` para la dirección visual y `ui-ux-pro-max:design-system` para definir tokens y componentes. El resultado se escribe en el spec, para que Codex lo implemente sin decidir el diseño.

## Delegación a Codex

- Delegar solo tareas del plan aprobado, mediante el plugin oficial de Codex (`/codex:rescue`). Cada encargo se guarda en `docs/privado/encargos/` y se envía **completo** a Codex: SHA base, archivos permitidos, rutas exactas de spec y plan, pasos con sus tests y verificaciones. Codex no ve `docs/privado/` y no tiene las skills de Superpowers: la disciplina (test primero, verificación) viaja en el encargo y en las reglas de [AGENTS.md](AGENTS.md).
- Cada encargo se ejecuta en un git worktree y una rama propios, nunca sobre `main`.
- **Paralelismo:** al escribir el plan, marcar qué tareas no comparten archivos ni dependencias. Esas pueden encargarse a la vez, cada una en su worktree; las demás van en secuencia.
- Solo Claude Code edita `docs/` (estado, bitácora, ADR, arquitectura, specs y plans). Codex informa en su entrega y Claude actualiza.
- Hasta tres rondas de corrección por encargo dentro del alcance aprobado. Ante una decisión de arquitectura nueva, un cambio de alcance, un riesgo importante o un bloqueo, detenerse y consultar al propietario.
- Codex trabaja con sandbox limitado al espacio de trabajo y aprobación bajo petición, sin modos de permisos irrestrictos.

## Al terminar una sesión

Usar `proyecto-ordenado` en modo **cerrar**: nota de bitácora, bloque de estado actualizado y ADR si hubo una decisión aprobada.

## Límites

- Nunca fusionar ramas, hacer push, publicar, desplegar ni actuar sobre servidores sin autorización explícita y específica del propietario.
- No instalar dependencias ni crear scaffolding fuera de una tarea del plan aprobado.
- No versionar secretos ni `.env`. Nunca mostrar ni solicitar claves privadas.
- Repo público: lo sensible (infraestructura, encargos, descubrimiento, bitácora) va solo en `docs/privado/`.
- Preservar el trabajo existente y no editar a la vez el mismo archivo que Codex.

Al terminar un encargo, entregar al propietario: resumen de cambios, archivos afectados, verificaciones con sus resultados, lo que no se pudo verificar, problemas pendientes y la rama resultante.
