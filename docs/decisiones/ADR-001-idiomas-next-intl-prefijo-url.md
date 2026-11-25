# ADR-001 · Idiomas con next-intl y prefijo en la URL

[Decisiones](README.md) · [Inicio](../00-inicio.md)

**Estado:** Propuesto (diseño aprobado el 2026-11-25; este ADR está pendiente de aprobación)

## Contexto

La tienda tiene que mostrarse en español y en inglés (F6, [spec](../superpowers/specs/2026-11-25-idiomas-pedidos-multimoneda-design.md)). El idioma tiene que poder compartirse en un enlace, recordarse entre visitas y aplicarse también en Stripe Checkout y en las URL de vuelta. Las rutas `api/**` (Kinde, UploadThing y el webhook de Stripe) no pueden cambiar. Varios encargos de Codex traducen pantallas en paralelo, así que dos de ellos no pueden editar el mismo archivo de mensajes.

## Decisión

Usar `next-intl` 4 con el segmento `src/app/[locale]/` y `localePrefix: 'always'`. Los idiomas son `es` (por defecto) y `en`. El idioma se elige en este orden: la cookie `NEXT_LOCALE`, luego `Accept-Language`, luego `es`.

El `middleware.ts` se salta `api`, `_next`, `_vercel` y las rutas con extensión. Los textos viven solo en `messages/{es,en}/<espacio>.json`, con un espacio por área (`common`, `home`, `configure`, `orders`, `thank-you`, `dashboard`). Cada archivo tiene un único encargo dueño por lote.

## Alternativas consideradas

- **Idioma sin prefijo, solo por cookie:** las URL quedan como están. A cambio, los enlaces no indican el idioma, los buscadores no ven dos versiones y la caché tiene que variar por cookie.
- **Prefijo solo en el idioma no predeterminado (`as-needed`):** las URL en español quedan más cortas, pero hay dos formas de cada ruta y la redirección es menos predecible. Se descarta por simplicidad.
- **Biblioteca propia o `react-i18next`:** habría que construir a mano el enrutado, el middleware y la carga en componentes de servidor, que next-intl ya resuelve para el App Router.
- **Un único archivo de mensajes por idioma:** es más simple, pero los encargos paralelos chocarían en el mismo archivo.

## Consecuencias

- Todas las páginas pasan a `src/app/[locale]/`. Las URL sin prefijo se redirigen a `/es/...`, así que los enlaces antiguos siguen funcionando.
- Aparece una dependencia nueva (`next-intl`) y un middleware. Un matcher mal escrito podría romper los webhooks; lo cubre una prueba de extremo a extremo.
- Los enlaces internos usan el `Link` de `@/i18n/navigation`.
- Ningún texto visible se escribe en los componentes (AGENTS.md, regla 11). Una prueba exige que los dos idiomas tengan las mismas claves.
- Añadir un tercer idioma consiste en sumarlo a `routing.ts` y crear sus archivos de mensajes.
