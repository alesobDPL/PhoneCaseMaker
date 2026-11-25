# Instrucciones para agentes de IA

PhoneCaseMaker se desarrolla con agentes de IA bajo dirección y aprobación humana. Las instrucciones de Claude Code están en [CLAUDE.md](CLAUDE.md); ambos archivos deben mantenerse coherentes.

## Roles

- **Propietario:** elige entre alternativas importantes, aprueba el diseño y el plan, acepta o devuelve cada entrega y autoriza merges a `main`, despliegues y cambios de infraestructura. La revisión de un agente no sustituye su aprobación.
- **Claude Code:** arquitecto. Diseña, planifica, prepara los encargos, lanza a Codex, audita las entregas e integra los lotes aceptados en la rama de la funcionalidad. No escribe código de aplicación.
- **Codex:** implementa el encargo recibido con código y pruebas, depura y corrige los hallazgos. Decide detalles de implementación dentro de lo aprobado. Rinde cuentas a Claude Code.

## Dónde está la información

- Estado y mapa: [docs/00-inicio.md](docs/00-inicio.md). Hoja de ruta: [docs/hoja-de-ruta.md](docs/hoja-de-ruta.md).
- Diseños: [docs/superpowers/specs/](docs/superpowers/specs/README.md). Planes: [docs/superpowers/plans/](docs/superpowers/plans/README.md).
- Decisiones: [docs/decisiones/](docs/decisiones/README.md). Arquitectura: [docs/arquitectura/](docs/arquitectura/README.md). Criterios: [docs/arquitectura/criterios-desarrollo.md](docs/arquitectura/criterios-desarrollo.md).

## Reglas para Codex

El encargo es la fuente de verdad: no añadir nada que no esté en él.

1. **Ya estás en tu worktree y tu rama.** No crees ramas ni worktrees, no hagas merge, rebase, push ni despliegues. Pueden estar trabajando otros Codex en paralelo en otras ramas.
2. **Solo los archivos permitidos.** Si necesitas tocar otro, detente y explícalo en `dudas`.
3. **Lee solo las lecturas del encargo** y el código que necesites para el paso en curso.
4. **Test primero:** escribe el test, míralo fallar, implementa, míralo pasar.
5. **No hagas commit ni cambies el estado de git** (tu sandbox no puede escribir en `.git`): deja tus cambios en la carpeta. El script de Claude los registra en un commit de tu rama al terminar cada ejecución, también si se corta, así que nada se pierde.
6. **Ante un fallo, busca la causa antes de cambiar código.** Si al segundo intento no se resuelve, detente y repórtalo.
7. **Nada está terminado sin evidencia:** ejecuta todas las verificaciones exigidas antes de entregar.
8. **No edites `docs/`.** Si algo de la documentación parece incorrecto, indícalo en `dudas`.
9. Ante una ambigüedad que obligue a cambiar la arquitectura, una interfaz o el alcance: pregunta en `dudas`, no decidas.
10. **Interfaz:** usa solo los tokens y componentes definidos en el spec, y cubre con pruebas de capturas las pantallas y estados que pida el encargo. No decidas el diseño.
11. Identificadores de código y textos de interfaz en inglés; mensajes y entrega en español. `.env.example` lleva solo valores ficticios; nunca versiones secretos.
12. Dinero siempre en centavos enteros y autorización siempre en el servidor (ver *Global Constraints* del plan vigente).

## Entrega

Tu último mensaje es solo el JSON de entrega (el esquema lo envía Claude): commit (vacío), rama, estado (`completo`, `parcial` o `bloqueado`), archivos cambiados, pasos completados, verificaciones (comando, `ok`/`fallo`/`no_ejecutado` y una línea de detalle), lo no verificado, las desviaciones y las dudas. **Sin logs ni salidas completas**: una línea por verificación.

## Comandos

Desde la raíz, con npm. Las variables necesarias están en `.env.example`.

| Acción | Comando |
| --- | --- |
| Instalar | `npm install` (ejecuta `prisma generate`) |
| Desarrollo | `npm run dev` |
| Compilar | `npm run build` |
| Pruebas unitarias | `npm run test:unit` |
| Pruebas de integración | `npm run test:integration` (requiere Docker: Testcontainers) |
| Pruebas end-to-end | `npm run test:e2e` |
| Pruebas (un archivo) | `npx vitest run <ruta>` · `npx playwright test <ruta>` |
| Pruebas visuales (capturas) | `npm run screenshots` |
| Lint | `npm run lint` |
| Tipos | `npm run typecheck` |
