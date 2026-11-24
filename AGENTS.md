# Instrucciones para agentes de IA

PhoneCaseMaker se desarrolla con agentes de IA bajo dirección y aprobación humana. Las instrucciones específicas de Claude Code están en [CLAUDE.md](CLAUDE.md); ambos archivos deben mantenerse coherentes.

## Roles

- **Propietario:** elige entre alternativas importantes, aprueba el diseño y después el plan, acepta cada entrega y autoriza fusiones, despliegues y cambios de infraestructura. La revisión de un agente no sustituye su aprobación.
- **Claude Code:** arquitecto. Propone y documenta el diseño, elabora el plan, prepara los encargos y revisa la implementación. No escribe código de aplicación.
- **Codex:** implementa las tareas del encargo recibido, escribe código y pruebas, depura y corrige los hallazgos de la revisión. Puede decidir detalles de implementación dentro de lo aprobado. Le entrega cuentas a Claude Code, que revisa y le informa al propietario.

## Dónde está la información

- Estado actual y mapa: [docs/00-inicio.md](docs/00-inicio.md).
- Diseños aprobados: [docs/superpowers/specs/](docs/superpowers/specs/README.md).
- Planes aprobados: [docs/superpowers/plans/](docs/superpowers/plans/README.md).
- Decisiones de arquitectura: [docs/decisiones/](docs/decisiones/README.md).
- Criterios de desarrollo: [docs/arquitectura/criterios-desarrollo.md](docs/arquitectura/criterios-desarrollo.md).

## Reglas para Codex

Codex le rinde cuentas a Claude Code. El encargo es la fuente de verdad: no añadir nada que no esté en él.

1. **Antes de empezar:** ejecutar la sección *Antes de empezar* del encargo (rama y SHA base). Si algo no coincide, detenerse y reportar.
2. **Solo los archivos permitidos** por el encargo: otros trabajadores pueden estar en paralelo. Trabajar solo en el worktree y la rama del encargo, nunca en `main`. No fusionar, no hacer push y no desplegar.
3. **Test primero:** seguir los pasos en orden. Cada test se escribe y se ejecuta, y se ve fallar antes de implementar; después se ejecuta y se ve pasar.
4. **Ante un fallo, buscar la causa antes de cambiar código.** Si al segundo intento no se resuelve, detenerse y reportar lo observado.
5. **Nada está terminado sin evidencia:** ejecutar todas las verificaciones del encargo y copiar su resultado en la entrega.
6. **No editar la documentación de Claude Code:** `docs/00-inicio.md`, `docs/decisiones/`, `docs/arquitectura/` ni `docs/superpowers/`. Si algo de ella parece incorrecto, indicarlo en la entrega.
7. Ante una ambigüedad que exija cambiar la arquitectura, una interfaz o el alcance: preguntar, no decidir.
8. Identificadores de código en inglés; mensajes y entrega en español. No versionar secretos: `.env.example` lleva solo valores ficticios.

## Entrega a Claude Code

Hacer commit en la rama del encargo y responder con:

- Commit (SHA) y rama.
- Archivos cambiados.
- Verificaciones ejecutadas, con su resultado.
- Lo que no se pudo verificar y por qué.
- Dudas, riesgos o desviaciones del encargo.

## Comandos

Desde la raíz, con npm. Las variables necesarias están en `docs/arquitectura/README.md` (stack) y se documentarán en `.env.example` cuando el plan lo cree.

| Acción | Comando |
| --- | --- |
| Instalar | `npm install` (ejecuta `prisma generate`) |
| Desarrollo | `npm run dev` |
| Compilar | `npm run build` |
| Lint | `npm run lint` |
| Tipos | `npx tsc --noEmit` |
| Pruebas | Pendiente: no hay pruebas todavía; las define el plan |
