# ADR-003 · Verificación de la sesión en el servidor

[Decisiones](README.md) · [Inicio](../00-inicio.md)

**Estado:** **Aprobado** (2026-11-25)

## Contexto

La autenticación usa Kinde mediante `@kinde-oss/kinde-auth-nextjs`. El inicio de sesión (callback de OAuth) valida los tokens contra el emisor, pero en la versión instalada la lectura posterior de la sesión en el servidor no verifica criptográficamente los tokens guardados en cookies. Los permisos de administración dependen de la identidad que devuelve esa lectura, así que el servidor no debe confiar en ella sin verificarla.

El propietario aprobó el 2026-11-25 tratarlo como encargo de seguridad prioritario antes del siguiente merge a `main`, fijar la versión exacta del SDK y prever cómo obtienen sesión las pruebas end-to-end cuando la verificación esté activa.

## Decisión

- Toda lectura de sesión en el servidor pasa por una única función propia, `getSessionUser()`, en `src/lib/auth/`.
- Esa función verifica la firma de los tokens con la clave pública del emisor (JWKS publicado por Kinde), además del emisor, la audiencia y la expiración, usando la biblioteca `jose` como dependencia directa con versión exacta. Si la verificación falla o el emisor no responde, no hay sesión (falla cerrada).
- El SDK de Kinde se mantiene para el flujo de login, logout y callback, fijado a una versión exacta. Una regla de lint impide volver a leer la sesión con el SDK fuera del módulo de autenticación.
- Las pruebas end-to-end obtienen sesión con un emisor local de pruebas (claves generadas al arrancar y JWKS servido en localhost), no con cookies sin firmar.

## Alternativas consideradas

- **Actualizar el SDK a la última versión:** salto grande, con dependencias nuevas y sin certeza de que la lectura de sesión verifique la firma; contradice fijar la versión aprobada.
- **Middleware de autenticación del SDK:** no verificaría por sí solo las lecturas que hacen las páginas y acciones, y añade otra pieza a la cadena de next-intl.
- **Sesión propia en base de datos:** robusta, pero cambia el modelo de autenticación y es desproporcionada para el problema.

## Consecuencias

- Una sola puerta de entrada para la identidad en el servidor, probada con claves locales y sin red.
- Cada verificación depende del JWKS del emisor; `jose` lo guarda en caché. Si el emisor no responde, los usuarios aparecen sin sesión.
- La versión fijada del SDK no renueva los tokens: al expirar el token de acceso el usuario debe volver a iniciar sesión. La renovación queda como posible trabajo futuro.
- Las pruebas de integración simulan `getSessionUser()` en lugar del SDK; las end-to-end necesitan el emisor local.
- Actualizar el SDK en el futuro exige revisar esta decisión.
