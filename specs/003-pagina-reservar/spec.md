# Spec 003 — Página «Reservar»: flujo completo de reserva de entradas

**Estado: aprobada**

---

## 1. Contexto y objetivo

Movie Dreams ya dispone de dos páginas que cubren parcialmente la reserva:

- **`PeliculasDellatePage` (`/peliculas/:id`)**: muestra la película y sus *showtimes* (funciones), y cada tarjeta de función enlaza a…
- **`FuncionAsientosPage` (`/funciones/:id`)**: mapa de asientos de **una** función concreta con botón «Reservar».

El problema es que el usuario debe saber de antemano qué función quiere y acceder a su URL directa. No existe un punto de entrada único donde el cliente elija **película → fecha/hora → asientos → confirmación** en un solo flujo guiado.

**Objetivo**: crear la página **`ReservarPage`** accesible en dos rutas:
- **`/reservar`** — punto de entrada general: muestra selector de película (Paso 0) y luego continúa al flujo completo.
- **`/reservar/:movieId`** — punto de entrada desde detalle de película: salta directo al selector de showtimes (Paso 1).

Ambas rutas usan el mismo componente **single-page stepper** (estado en memoria, sin persistencia en URL) que orquesta 4 pasos:
1. **Paso 0** (solo en `/reservar`): Selector de película.
2. **Paso 1**: Selector de showtime (agrupado por fecha, ordenado por hora).
3. **Paso 2**: Mapa de asientos (reutilizando lógica de `FuncionAsientosPage`).
4. **Paso 3**: Resumen y confirmación (botón directo «Confirmar reserva»).

Se reutilizan servicios y tipos existentes; solo se añade la orquestación y componentes de UI necesarios.

---

## 2. Usuarios

| Rol | Acceso | Notas |
|-----|--------|-------|
| **Cliente** (autenticado) | ✅ Completo | Usuario final que compra entradas. Debe tener sesión activa (`cine_token`). |
| Administrador / Gerente | ✅ Completo | Pueden usar la página como cualquier cliente (no tienen flujo administrativo aquí). |
| Anónimo | 🚫 Bloqueado | Redirigido a login con `next=/reservar` o `next=/reservar/:movieId`. |

El backend valida roles `ADMIN | MANAGER | CLIENT` en `POST /reservations`; el frontend **debe** exigir autenticación antes de permitir el paso de confirmación.

---

## 3. Historias de usuario

| ID | Historia |
|----|----------|
| **HU-00** | Como **cliente autenticado**, quiero entrar a `/reservar` y ver el catálogo de películas con funciones disponibles para elegir una y empezar mi reserva. |
| **HU-01** | Como **cliente autenticado**, quiero entrar a `/reservar/:movieId` (desde el detalle de película) y ver los *showtimes* disponibles de esa película agrupados por fecha, para elegir la función que prefiera. |
| **HU-02** | Al elegir un *showtime*, quiero ver el mapa de asientos de esa función (reutilizando la vista de `FuncionAsientosPage`) para seleccionar mis butacas. |
| **HU-03** | Quiero un **resumen lateral / inferior** siempre visible con: película, fecha/hora, sala, asientos elegidos, precio unitario y total. |
| **HU-04** | Quiero poder **cambiar de showtime** en cualquier momento antes de confirmar; al hacerlo, la selección de asientos se reinicia. |
| **HU-05** | Al pulsar «Confirmar reserva», el sistema envía la reserva al backend y me muestra el código de reserva (`reservationCode`) con opción de volver al catálogo. |
| **HU-06** | Si la reserva falla por **conflicto de asientos** (ya ocupados en otra reserva), quiero un mensaje claro (*toast*) y la posibilidad de volver a elegir butacas sin perder el showtime (mapa recargado silenciosamente). |
| **HU-07** | Si no estoy autenticado y llego a la página, soy redirigido a login y, tras entrar, vuelvo al mismo punto del flujo. |

---

## 4. Definiciones

| Término | Significado |
|---------|-------------|
| **Showtime / Función** | Entidad `Funcion` (id, movieId, roomId, date, startTime, endTime, price, status). |
| **Asiento** | Entidad `Asiento` con flag `available?: boolean` (viene de `GET /billboard/showtimes/:id/seats`). |
| **Reserva** | Agregado que agrupa `clientId`, `showtimeId`, `reservationCode`, `status`, `total`, `details[]`. |
| **Código de reserva** | String generado en frontend: `RES-{showtimeId}-{timestampBase36}` (ver `reservaService.generarCodigo`). |
| **Paso** | Cada fase del asistente: 0) Película (solo en `/reservar`), 1) Showtime, 2) Asientos, 3) Resumen/Confirmación. |
| **Hora local** | Todas las fechas/horas se muestran y manipulan en la zona horaria del cine (sin conversión a UTC). |

---

## 5. Requisitos funcionales (RF) — Formato EARS

### 5.0 Paso 0 — Selector de película (solo en `/reservar`)

| RF | Requisito |
|----|-----------|
| **RF-01** | **CUANDO** un usuario navega a `/reservar` **ENTONCES** el sistema carga el catálogo de películas que tienen al menos una función programada (`status = PROGRAMADA`) mediante `peliculaService.listar()` + `carteleraService.listarFunciones()` por película. |
| **RF-02** | **CADA** tarjeta de película muestra: título, imagen (poster), y badge «X funciones disponibles». |
| **RF-03** | **CUANDO** el usuario hace clic en una película **ENTONCES** navega internamente al Paso 1 con ese `movieId` (sin recarga de página, single-page stepper). |
| **RF-04** | **SI** no hay películas con funciones programadas **ENTONCES** se muestra mensaje «No hay películas con funciones disponibles» y enlace «Volver al catálogo». |

### 5.1 Navegación y entrada

| RF | Requisito |
|----|-----------|
| **RF-05** | **CUANDO** un usuario navega a `/reservar/:movieId` **ENTONCES** el sistema salta directo al Paso 1 y carga la película y sus funciones activas (`status = PROGRAMADA`) mediante `carteleraService.listarFunciones(movieId)`. |
| **RF-06** | **SI** la película no existe o no tiene funciones programadas **ENTONCES** se muestra mensaje «No hay funciones disponibles para esta película» y enlace «Volver al catálogo». |
| **RF-07** | **CUANDO** el usuario no está autenticado **ENTONCES** se redirige a `/auth/signin?next=/reservar` o `/auth/signin?next=/reservar/:movieId` (guard `RequireAuth` en la ruta). |

### 5.2 Paso 1 — Selector de showtime

| RF | Requisito |
|----|-----------|
| **RF-08** | **CUANDO** se muestran las funciones **ENTONCES** se agrupan por fecha local (día) y dentro de cada día se ordenan por `startTime` ascendente. |
| **RF-09** | **CADA** tarjeta de función muestra: hora de inicio, sala (`room`), tipo de sala (`roomType`), precio unitario. |
| **RF-10** | **SI** una función tiene 0 asientos disponibles **ENTONCES** la tarjeta muestra «Completa» y no es clicable. |
| **RF-11** | **CUANDO** el usuario hace clic en una función **ENTONCES** esa función queda seleccionada, se avanza al Paso 2 y se carga el mapa de asientos con `carteleraService.asientosDeFuncion(showtimeId)`. |
| **RF-12** | **SI** el usuario ya tenía asientos seleccionados en otro showtime **ENTONCES** la selección se limpia al cambiar de función. |

### 5.3 Paso 2 — Mapa de asientos

| RF | Requisito |
|----|-----------|
| **RF-13** | **CUANDO** se entra al Paso 2 **ENTONCES** se renderiza el mapa de asientos agrupado por fila (`row`), ordenado por número, igual que `FuncionAsientosPage`. |
| **RF-14** | **CADA** asiento muestra su número; los estados visuales son: **Libre** (clicable), **Elegido** (seleccionado por el usuario), **Ocupado** (`available === false`, deshabilitado). |
| **RF-15** | **CUANDO** el usuario clica un asiento libre **ENTONCES** alterna su estado (añade/quita de `elegidos`). |
| **RF-16** | **CUANDO** hay al menos un asiento elegido **ENTONCES** el botón «Continuar al resumen» se habilita. |
| **RF-17** | **SI** la carga de asientos falla **ENTONCES** se muestra error y botón «Reintentar». |

### 5.4 Paso 3 — Resumen y confirmación

| RF | Requisito |
|----|-----------|
| **RF-18** | **CUANDO** se avanza al Paso 3 **ENTONCES** se muestra un panel con: título de la película, fecha/hora, sala, lista de asientos elegidos (formato «Fila N°»), precio unitario, total. |
| **RF-19** | **CUANDO** el usuario pulsa «Confirmar reserva» **ENTONCES** se invoca `reservaService.crear()` con payload `CrearReserva` construido a partir de: `clientId` (usuario actual), `showtimeId`, `reservationCode` (generado), `status: 'PENDIENTE'`, `total`, `details[]` (`seatId`, `price`). |
| **RF-20** | **SI** la reserva se crea con éxito **ENTONCES** se muestra modal/pantalla de éxito con el `reservationCode` y botón «Volver al catálogo» (`/peliculas`). |
| **RF-21** | **SI** el backend responde error 409 (conflicto de asientos) **ENTONCES** se muestra mensaje *toast* «Algunos asientos ya no están disponibles», se vuelve al Paso 2 conservando el showtime, y se recarga el mapa de asientos para reflejar la ocupación real. |
| **RF-22** | **SI** ocurre otro error de red/servidor **ENTONCES** se muestra mensaje genérico «No se pudo completar la reserva» y botón «Reintentar» en el Paso 3. |

### 5.5 Navegación entre pasos

| RF | Requisito |
|----|-----------|
| **RF-23** | **CUANDO** el usuario está en Paso 1, 2 o 3 **ENTONCES** hay un control visible («Cambiar función» / «Volver») que permite regresar al paso anterior sin perder el showtime seleccionado (pero sí limpiando asientos si cambia de función en Paso 1). |
| **RF-24** | **CUANDO** el usuario está en Paso 1 (llegado desde `/reservar`) **ENTONCES** hay un control «Cambiar película» que vuelve al Paso 0. |
| **RF-25** | **SI** el usuario recarga el navegador en cualquier paso **ENTONCES** el estado se reinicia al Paso 0 (en `/reservar`) o Paso 1 (en `/reservar/:movieId`) — sin persistencia en URL (decisión D-07 = B). |

---

## 6. Requisitos no funcionales (RNF)

| RNF | Descripción |
|-----|-------------|
| **RNF-01** | **Rendimiento**: la carga inicial (película + funciones) < 1.5 s en red 3G; carga de asientos al cambiar showtime < 800 ms. |
| **RNF-02** | **Accesibilidad**: mapa de asientos navegable por teclado (Tab / Flechas / Enter), `aria-label` en cada butaca con fila y número, contraste AA. |
| **RNF-03** | **Responsive**: mapa de asientos usable en móvil (≥ 320 px) con scroll horizontal por fila; resumen colapsable en móvil; selector de película (Paso 0) en grid responsivo. |
| **RNF-04** | **Seguridad**: token `cine_token` enviado automáticamente por interceptor `lib/http.ts`; ninguna URL ni credencial hardcodeada en la página. |
| **RNF-05** | **Consistencia visual**: usa componentes `Container`, `Button`, tipografía y colores del sistema Metronic/Tailwind ya establecidos. |
| **RNF-06** | **Internacionalización preparación**: textos de UI en español, pero claves de mensaje externalizables para futuro i18n. |
| **RNF-07** | **Single-page stepper**: navegación entre pasos sin recarga de página; estado en memoria React (useState/useReducer); no hay deep-linking a pasos intermedios. |

---

## 7. Formato de datos — Payloads y mapeo

### 7.1 Entrada: `CrearReserva` (enviado a `POST /reservations`)

```ts
interface CrearReserva {
  clientId: number;           // user.id del usuario autenticado
  showtimeId: number;         // funcion.id seleccionada
  reservationCode: string;    // reservaService.generarCodigo(showtimeId)
  status: 'PENDIENTE';        // fijo en creación
  total: number;              // elegidos.length * funcion.price (máx. 2 decimales)
  details: Array<{
    seatId: number;           // asiento.id
    price: number;            // funcion.price (precio unitario)
  }>;
}
```

### 7.2 Salida exitosa: `ReservaCreada`

```ts
interface ReservaCreada {
  reservation: {
    id: number;
    clientId: number;
    showtimeId: number;
    reservationDate: string;   // ISO local generado por backend
    reservationCode: string;   // igual al enviado
    status: 'PENDIENTE';
    total: number;
    details: Array<{ id, reservationId, seatId, price }>;
  };
  details: Array<{ id, reservationId, seatId, price }>;
}
```

### 7.3 Error 409 — Conflicto de asientos

El backend devuelve `409 Conflict` con cuerpo:
```json
{ "statusCode": 409, "message": "Asientos ocupados: 12, 15", "error": "Conflict" }
```
El frontend debe parsear `message` o `response.data.message` y mostrar lista de `seatId` afectados.

---

## 8. Validaciones requeridas

| Lado | Validación |
|------|------------|
| **Cliente** | - Al menos un asiento seleccionado antes de avanzar al Paso 3 (RF-11).<br>- `total` calculado como `elegidos.length * funcion.price` con 2 decimales (helper puro `calcularTotal`).<br>- `reservationCode` generado por `reservaService.generarCodigo` (no editable). |
| **Servidor** (ya implementado) | - Función existe y `status !== 'CANCELADA'`.<br>- Sala activa.<br>- Asientos existen, están activos, pertenecen a la sala.<br>- Asientos no están en otra reserva de la misma función.<br>- `total` coincide con suma de `details[].price` (máx. 2 decimales). |

---

## 9. Roles de acceso

- Ruta protegida con `RequireAuth` (redirige a login si no autenticado).
- Dentro de la página, `useAuth()` provee `isAuthenticated`, `user.id`, `user.roles`.
- El botón «Confirmar reserva» solo se habilita si `isAuthenticated === true` (aunque la ruta ya lo garantiza, defensa en profundidad).

---

## 10. Dependencias con features existentes

| Componente / Servicio | Reutilización | Cambios necesarios |
|-----------------------|---------------|---------------------|
| `peliculaService.listar()` | ✅ Sin cambios | Usado en Paso 0 para listar películas con funciones |
| `carteleraService.listarFunciones(movieId)` | ✅ Sin cambios | Usado en Paso 0 (por película) y Paso 1 |
| `carteleraService.asientosDeFuncion(showtimeId)` | ✅ Sin cambios | — |
| `reservaService.crear()` | ✅ Sin cambios | — |
| `reservaService.generarCodigo()` | ✅ Sin cambios | — |
| `FuncionAsientosPage` (lógica de mapa) | 🔄 **Extraer** a componente reutilizable `SeatMap` + hook `useSeatSelection` | Nuevo archivo `src/components/reserva/seat-map.tsx` y `src/hooks/useSeatSelection.ts` |
| `PeliculasDellatePage` (carga de película + funciones) | 🔄 **Extraer** hook `useMovieWithShowtimes(movieId)` | Nuevo hook en `src/hooks/useMovieWithShowtimes.ts` |
| `RequireAuth` / `RequireRole` | ✅ Sin cambios | Añadir rutas `/reservar` y `/reservar/:movieId` en `app-routing-setup.tsx` |
| Helpers de fecha/hora (`src/lib/fecha.ts` o similar) | ✅ Si existen; si no, crear `src/lib/showtime-format.ts` | Formatear `date + startTime` para UI |
| Tipos `Funcion`, `Asiento`, `CrearReserva`, `DetalleReservaPayload`, `Pelicula` | ✅ Sin cambios | — |

---

## 11. Casos límite

| Caso | Comportamiento esperado |
|------|-------------------------|
| **Usuario recarga en Paso 1/2/3** | Estado se reinicia: en `/reservar` vuelve a Paso 0; en `/reservar/:movieId` vuelve a Paso 1 (decisión D-07 = B). |
| **Sesión expira durante selección** | Al confirmar, interceptor 401 → redirige a login con `next` conservando URL completa. |
| **Cambio de showtime en Paso 3** | Limpia `elegidos`, vuelve a Paso 1 (botón «Cambiar función» visible). |
| **Asientos agotados (0 disponibles)** | Tarjeta de función muestra «Completa» y no es clicable; si el usuario ya estaba en esa función, mensaje «Ya no hay asientos libres» y botón «Elegir otra función». |
| **Precio con más de 2 decimales** | Helper `redondearTotal(total)` trunca/redondea a 2 decimales antes de enviar. |
| **Usuario selecciona > 8 asientos** (límite negocio no explícito) | Por ahora sin límite duro; si backend impone, error 400 se maneja como RF-22. |
| **Navegador «Atrás» tras éxito** | No se permite volver al formulario con botón atrás (`history.replace` en éxito). |
| **Entrada directa a `/reservar` sin películas con funciones** | Muestra mensaje «No hay películas con funciones disponibles» (RF-04). |

---

## 12. Criterios de finalización (Checklist verificable con Playwright MCP)

> **Nota**: Todos los criterios se validan con **MCP de Playwright** (login `gguzman` / `123456`) + `npm run typecheck` + `npm run lint` + `npm run build`. No hay tests unitarios.

| ID | Criterio | Pasos Playwright (resumen) |
|----|----------|----------------------------|
| **C-01** | **Acceso autenticado a `/reservar`**: cliente logueado ve selector de películas con funciones. | 1. Login `gguzman`/`123456`.<br>2. Navegar a `/reservar`.<br>3. Verificar tarjetas de película con badge «X funciones disponibles». |
| **C-02** | **Acceso autenticado a `/reservar/:movieId`**: salta directo a selector de showtimes. | 1. Login `gguzman`/`123456`.<br>2. Navegar a `/reservar/1`.<br>3. Verificar tarjetas de showtime renderizadas (Paso 1). |
| **C-03** | **Acceso anónimo**: usuario sin sesión es redirigido a login con `next`. | 1. Limpiar `localStorage` (`cine_token`).<br>2. Navegar a `/reservar`.<br>3. Verificar URL `/auth/signin?next=/reservar`. |
| **C-04** | **Paso 0 → Paso 1**: clic en película avanza a showtimes de esa película. | 1. Login + `/reservar`.<br>2. Clic en primera película.<br>3. Verificar showtimes de esa película (Paso 1). |
| **C-05** | **Selector de showtime**: funciones agrupadas por fecha, ordenadas por hora. | 1. En Paso 1, verificar agrupación visual por día y orden horario. |
| **C-06** | **Selección de showtime → mapa de asientos**: clic en función carga asientos y avanza paso. | 1. En Paso 1, clic en primera función.<br>2. Verificar mapa de asientos renderizado (filas, números, estados). |
| **C-07** | **Selección de asientos**: clic alterna estado; resumen actualiza contador y total. | 1. En mapa, clic en 2 asientos libres.<br>2. Verificar badge «2 butacas» y total = 2 × precio. |
| **C-08** | **Cambio de showtime limpia selección**: al elegir otra función, asientos previos se deselectionan. | 1. Seleccionar 1 asiento en función A.<br>2. Volver a selector (Paso 1) y elegir función B.<br>3. Verificar que `elegidos = []`. |
| **C-09** | **Resumen en Paso 3**: muestra película, fecha/hora, sala, asientos, precio, total. | 1. Seleccionar asientos → «Continuar».<br>2. Verificar todos los campos del resumen presentes y correctos. |
| **C-10** | **Confirmación exitosa**: crea reserva y muestra `reservationCode`. | 1. En resumen, clic «Confirmar reserva».<br>2. Verificar modal/pantalla con código `RES-...`.<br>3. Botón «Volver al catálogo» navega a `/peliculas`. |
| **C-11** | **Conflicto 409**: backend rechaza por asientos ocupados → *toast* + vuelta a mapa recargado. | *Requiere setup de datos*:<br>1. Crear reserva previa ocupando asientos X, Y (script o manual).<br>2. En nuevo flujo, seleccionar X, Y → confirmar.<br>3. Verificar *toast* error y mapa recargado con X, Y marcados «Ocupado». |
| **C-12** | **Teclado en mapa**: navegación con Tab/Flechas/Enter selecciona asientos. | 1. En mapa, Tab al primer asiento libre.<br>2. Enter → seleccionado.<br>3. Flecha derecha → siguiente asiento. |
| **C-13** | **Responsive móvil**: mapa usable en 375px; resumen colapsable; Paso 0 en grid. | 1. `page.setViewportSize({width: 375, height: 667})`.<br>2. Verificar scroll horizontal en filas, resumen toggle, grid Paso 0. |
| **C-14** | **Navegación entre pasos**: botones «Cambiar función»/«Volver»/«Cambiar película» funcionan. | 1. Paso 2 → «Cambiar función» → Paso 1.<br>2. Paso 1 (desde `/reservar`) → «Cambiar película» → Paso 0.<br>3. Verificar limpieza de asientos al cambiar showtime. |
| **C-15** | **Recarga reinicia estado**: F5 en Paso 2/3 vuelve a Paso 0 o 1 según ruta. | 1. Avanzar a Paso 2.<br>2. `page.reload()`.<br>3. Verificar Paso 0 (`/reservar`) o Paso 1 (`/reservar/:movieId`). |
| **C-16** | **Typecheck / Lint / Build** en verde. | `npm run typecheck && npm run lint && npm run build` → exit 0. |

---

## 13. Decisiones tomadas (resueltas en sesión de clarificación)

| # | Decisión | Valor elegido | Impacto en la spec |
|---|----------|---------------|-------------------|
| **D-01** | Ruta final | **A) `/reservar/:movieId`** | Dos rutas: `/reservar` (Paso 0) y `/reservar/:movieId` (Paso 1 directo) |
| **D-02** | Arquitectura de pasos | **A) Single-page stepper** | Estado en memoria React; navegación entre pasos sin recarga; no deep-linking a pasos intermedios |
| **D-03** | Origen del usuario | **B) También desde home/listado general** | Añadido Paso 0 «Elegir película» en `/reservar`; `/reservar/:movieId` salta a Paso 1 |
| **D-04** | Cambio de showtime | **A) Permitido siempre** | Botón «Cambiar función» visible en Pasos 1, 2 y 3; limpia selección de asientos |
| **D-05** | Confirmación explícita | **B) Botón directo** | Sin modal extra; botón «Confirmar reserva» en el panel de resumen (Paso 3) |
| **D-06** | Manejo de conflicto 409 | **A) Toast + recarga silenciosa** | *Toast* con mensaje; vuelta a Paso 2; mapa recargado con ocupación actualizada |
| **D-07** | Persistencia en URL | **B) No** | Estado solo en memoria; recarga = Paso 0 (`/reservar`) o Paso 1 (`/reservar/:movieId`) |
| **D-08** | Límite de asientos | **B) Sin límite frontend** | Backend valida; error 400 se maneja como error genérico (RF-22) |

---

## 14. Referencias técnicas

- Backend `reservation.controller.ts`: `POST /reservations` (roles `ADMIN | MANAGER | CLIENT`).
- `CreateReservationDto`: `clientId`, `showtimeId`, `reservationCode`, `status`, `total`, `details: ReservationSeatDetailDto[]`.
- Validaciones backend: función existe y no cancelada, sala activa, asientos existen/activos/pertenecen a la sala, no ocupados en otra reserva de la misma función.
- Frontend actual: `FuncionAsientosPage` (mapa + reserva básica), `PeliculasDellatePage` (listado showtimes), `carteleraService`, `reservaService`, `useAuth`, guards `RequireAuth`/`RequireRole`.

---

**Fin de la spec**. Todas las dudas resueltas. Spec **aprobada** → listo para generar `plan.md` + `tasks.md` con `@planner`.