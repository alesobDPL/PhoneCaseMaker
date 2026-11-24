# Criterios de alcance, calidad y proceso

[Volver al inicio](../00-inicio.md)

Estado: **Propuesto** el 2026-11-23. Rige el proceso una vez aprobado; no aprueba ningún diseño ni plan.

## Alcance controlado

- Construir un MVP pequeño, funcional, mantenible y con calidad profesional, centrado en completar el flujo principal.
- Incluir solo las funcionalidades necesarias para ese flujo; evitar funcionalidades especulativas y sobreingeniería.
- Posponer excepciones poco frecuentes cuando exista una solución sencilla y segura. Simplificar el alcance no reduce los controles de calidad ni de seguridad.
- Documentar las funcionalidades futuras sin implementarlas ni anticipar sus mecanismos técnicos.

## Calidad de ingeniería

- Arquitectura clara y adecuada al tamaño del proyecto.
- Código limpio, organizado y tipado cuando corresponda.
- Validaciones en el frontend y en el backend.
- Autenticación y autorización correctamente implementadas.
- Manejo adecuado de errores y estados inesperados.
- Integridad de datos y seguridad frente a concurrencia cuando sea relevante.
- Pruebas automatizadas de las reglas de negocio críticas, y pruebas de integración y end-to-end de los flujos principales.
- Configuración segura y despliegue reproducible.

## Descubrimiento eficiente

- Priorizar las preguntas que pueden cambiar el alcance, la arquitectura o decisiones principales, preferentemente una por mensaje.
- Registrar los detalles menores, las excepciones y las funcionalidades futuras como Pendientes o Propuestas, y continuar.
- Ante alternativas relevantes, presentar ventajas, desventajas y una recomendación.

## Etapas

1. Brainstorming → diseño en `superpowers/specs/` → aprobación explícita.
2. writing-plans → plan en `superpowers/plans/` → aprobación explícita.
3. Implementación por Codex con TDD, depuración sistemática y verificación antes de declarar terminada una tarea.
4. Revisión de Claude Code y aceptación del propietario.
