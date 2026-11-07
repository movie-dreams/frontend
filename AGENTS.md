---
description: Contexto global y forma de trabajar para Movie Dreams.
alwaysApply: true
---

# Movie Dreams

Frontend del producto **Movie Dreams**: aplicación para comprar entradas de una
película. Consume la API REST del backend **`cinema`** (NestJS), ubicado en
`/mnt/Data/backend-web-architecture/cinema` y **desarrollado por otra persona**:
este repo es solo el frontend y el backend no se modifica.

## Stack y estructura

- React 19 + TypeScript 5.8 + Vite 6 + Tailwind 4 + Radix UI sobre la plantilla
  Metronic v9.2.0 (ya depurada). Toolchain oficial y fijo: no se cambia sin
  aprobación.
- Flujo en capas: `pantalla → servicio → lib/http → config/env`. Las pantallas
  nunca llaman a axios ni escriben URLs.
- Archivos clave:
  - `src/config/env.ts` — único lugar que toca `import.meta.env`.
  - `src/lib/http.ts` — único archivo con axios; adjunta el token a las peticiones.
  - `src/lib/storage.ts` — acceso a `localStorage`.
  - `src/lib/*` — helpers puros (fechas y tiempo incluidos).
  - `src/services/*.service.ts` — rutas y llamadas de cada recurso.
  - `src/types/*.ts` — forma de los datos de cada módulo.
  - `src/pages/**` — pantallas; solo piden datos y los pintan.

## Convenciones

- **Código en inglés**: identificadores, tipos, funciones y comentarios técnicos.
- **Interfaz y documentación en español**: UI, JSDoc, `MEMORY.md`, este archivo y
  `docs/constitution.md`.
- Para referirse al id usa `id` en código y «identificador» en interfaz y
  documentación; **nunca** el término `code` en naming propio.

## Datos y Persistencia

- El estado de sesión vive en `localStorage` bajo la clave `cine_token`
  (`src/lib/storage.ts`) y se envía por HTTP mediante el interceptor de
  `src/lib/http.ts`.
- **Compatibilidad hacia atrás**: nunca renombrar `cine_token` ni cambiar la
  forma del dato guardado sin aprobación explícita.

## Fechas y tiempo

- Todo se maneja en **hora local** del cine; no se convierte a UTC.
- El parseo y el formateo de fechas y horas se centralizan en un **helper puro**
  que recibe la fecha (o `hoy`) como parámetro. Nada de fechas dispersas en las
  pantallas.

## Forma de trabajar

- Usa la **skill sdd** para todo el ciclo de vida: capturar requerimientos
  funcionales, definir los no funcionales, planificar los cambios, implementar,
  verificar y cerrar con un resumen.
- **Pruebas antes que cambios (test-first)**: al planificar, primero define las
  pruebas que validarán cada criterio —pasos concretos con el **MCP de
  Playwright** (login `gguzman` / `123456`)— y solo después describe los cambios
  de código. El plan no se redacta ni se aprueba sin criterios de prueba
  definidos. No son tests unitarios ni un runner: la prueba es el criterio
  observable en la UI, según el Principio 4.
- Lee `AGENTS.md`, `docs/constitution.md`, `MEMORY.md` y la spec activa
  (`specs/NNN-*/spec.md`) antes de tocar código.
- Eres dueño de `MEMORY.md`: actualízalo en cada ciclo para transmitir el
  contexto entre sesiones.
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Si te bloqueas, prueba hasta **3 soluciones distintas**; si persiste,
  comunícamelo para que yo decida.
- Al terminar, dame un resumen con los cambios clave y cualquier decisión a
  revisar.
- Nota de rutas sdd: donde la skill dice `.cursor/constitution.md` y
  `.cursor/MEMORY.md`, en este repo son `docs/constitution.md` y `MEMORY.md`.

## Límites

- ✅ **Siempre**: leer `AGENTS.md`, `docs/constitution.md`, `MEMORY.md` y la spec
  activa; ejecutar `npm run typecheck` y `npm run lint` antes de cerrar;
  actualizar `MEMORY.md`.
- ⚠ **Pregunta antes**: añadir dependencias, cambiar el esquema de
  `localStorage` o el formato de datos, crear specs nuevas. Si un cambio requiere
  tocar el backend, notifícalo y pídelo como requerimientos funcionales.
- 🚫 **Nunca**: modificar el backend `cinema`
  (`/mnt/Data/backend-web-architecture/cinema`); añadir funcionalidades no
  pedidas; hardcodear URLs fuera de `config/env` y `lib/http`.

## Verificación

- No hay tests unitarios. Cada criterio se valida con el **MCP de Playwright**
  (login: usuario `gguzman` / contraseña `123456`).
- Comandos: `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run build`.
