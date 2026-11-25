# Planes de implementación

[Volver al inicio](../../00-inicio.md)

Planes creados con `superpowers:writing-plans` a partir de un diseño aprobado. Nombre: `YYYY-MM-DD-<tema>.md`. Cada plan enlaza su diseño e indica su estado (Propuesto o Aprobado, con fecha). Un plan Propuesto no autoriza implementar.

Cada tarea indica los archivos que crea o modifica. Además, el plan termina con una tabla de **lotes**:

| Lote | Tareas | Archivos que tocan | Depende de |
| --- | --- | --- | --- |
| 0 | Interfaces, tipos, esquemas y rutas compartidas | `…` | — |
| 1 | T2 · T3 · T4 (hasta 3, sin archivos en común) | uno distinto por tarea | Lote 0 |
| 2 | … | … | Lote 1 |

- El **lote 0** existe solo si hay archivos o contratos compartidos: se resuelve antes de lanzar en paralelo.
- Dentro de un lote, ninguna tarea comparte archivos ni depende de otra. Máximo 3 encargos a la vez.
- Una tarea puede ser un encargo, o varias tareas pequeñas del mismo archivo pueden ir en un solo encargo.

El plan [2026-11-23-portafolio.md](2026-11-23-portafolio.md) es anterior a este formato: su tabla *Encargos y paralelismo* cumple la misma función.
