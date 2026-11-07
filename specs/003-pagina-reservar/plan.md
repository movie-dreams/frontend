# Plan de Arquitectura — Spec 003: Página «Reservar»

> **Estado**: Borrador para revisión
> **Spec base**: `specs/003-pagina-reservar/spec.md` (aprobada con observaciones QA)

---

## 1. Resumen Ejecutivo

**Qué se construye**: Una página single-page stepper (`ReservarPage`) accesible en dos rutas:
- `/reservar` — entrada general con **Paso 0** (selector de película) + flujo completo
- `/reservar/:movieId` — entrada desde detalle de película, salta directo al **Paso 1** (selector de showtime)

**Alcance**: 4 pasos en memoria (sin persistencia en URL): Película → Showtime → Asientos → Resumen/Confirmación. Reutiliza servicios, tipos y lógica existente; solo añade orquestación, hooks y componentes de UI nuevos.

**Estrategia**: Extraer lógica reutilizable de `FuncionAsientosPage` y `PeliculasDellatePage` a hooks/componentes puros, crear helpers de formato y cálculo, y orquestar todo en `ReservarPage` con stepper controlado por `useState`/`useReducer`.

---

## 2. Arquitectura de la Feature

### 2.1 Capas (respeta `pantalla → servicio → lib/http → config/env`)

```
src/
├── lib/
│   ├── reserva-calculos.ts      # NUEVO: helpers puros de totales/redondeo
│   └── showtime-format.ts       # NUEVO: helpers puros de formateo fecha/hora
├── hooks/
│   ├── useMovieWithShowtimes.ts # NUEVO: carga película + funciones (extraído de PeliculasDellatePage)
│   ├── useSeatSelection.ts      # NUEVO: estado + lógica selección asientos (extraído de FuncionAsientosPage)
│   └── useReservaStepper.ts     # NUEVO: orquestación de 4 pasos, navegación, limpieza
├── components/reserva/
│   ├── MovieSelector.tsx        # Paso 0: grid de películas con badge «X funciones»
│   ├── ShowtimeSelector.tsx     # Paso 1: tarjetas agrupadas por fecha, ordenadas por hora
│   ├── SeatMap.tsx              # Paso 2: mapa reutilizable (extraído de FuncionAsientosPage)
│   ├── ReservaResumen.tsx       # Paso 3: panel lateral/inferior con datos + botón confirmar
│   └── ReservaExito.tsx         # Pantalla de éxito (sin modal, según D-05)
├── pages/
│   └── ReservarPage.tsx         # Componente principal: orquesta stepper, renderiza paso actual
└── routing/
    └── app-routing-setup.tsx    # MODIFICAR: añadir rutas /reservar y /reservar/:movieId con RequireAuth
```

### 2.2 Flujo de Datos (Single-Page Stepper)

```
┌─────────────────────────────────────────────────────────────────┐
│                      ReservarPage (estado)                      │
│  step: 0 | 1 | 2 | 3                                            │
│  movieId?: number                                               │
│  showtimeId?: number                                            │
│  funcion?: Funcion                                              │
│  elegidos: number[]                                             │
│  reservationCode?: string                                       │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
   ┌─────────────┐    ┌───────────────┐    ┌──────────────┐
   │  Paso 0     │    │   Paso 1      │    │   Paso 2     │
   │ MovieSelector│    │ShowtimeSelector│    │   SeatMap    │
   │ (solo /reservar)    │ (agrupa x fecha)  │  (useSeatSelection)  │
   └─────────────┘    └───────────────┘    └──────────────┘
          │                    │                    │
          └────────────────────┴────────────────────┘
                                │
                                ▼
                       ┌────────────────┐
                       │   Paso 3       │
                       │ ReservaResumen │◄── usa reserva-calculos.ts
                       │ ReservaExito   │    showtime-format.ts
                       └────────────────┘
```

### 2.3 Decisiones de Deep Modules (Philosophy of Software Design)

| Módulo | Interfaz Simple (Profunda) | Información Ocultada |
|--------|----------------------------|----------------------|
| `useReservaStepper` | `{ step, goNext, goBack, reset, canGoNext }` | Lógica de transiciones, validaciones por paso, limpieza de `elegidos` al cambiar showtime |
| `useSeatSelection` | `{ elegidos, alternar, limpiar, total, nombresElegidos }` | Agrupación por fila, ordenamiento, estados visuales, mapeo `Asiento[]` → UI |
| `useMovieWithShowtimes` | `{ pelicula, funciones, cargando, error }` | Carga paralela, filtrado `status=PROGRAMADA`, manejo de errores |
| `reserva-calculos.ts` | `calcularTotal(elegidos, price)`, `redondearTotal(total)` | Regla de negocio: `total = elegidos.length * price`, redondeo 2 decimales |
| `showtime-format.ts` | `formatearShowtime(date, startTime)`, `formatearFecha(date)` | Locale ES, zona horaria local, formato «Lun 20 Oct, 19:30» / «Lunes 20 de Octubre» |

> **Evita módulos superficiales**: No se exportan getters/setters internos ni métodos que solo delegan. Cada hook/helper tiene **una responsabilidad cohesiva** y oculta su implementación.

---

## 3. Decisiones Técnicas Clave (Spec + QA)

| # | Decisión | Fundamento |
|---|----------|------------|
| **D-01** | Rutas: `/reservar` (Paso 0) + `/reservar/:movieId` (Paso 1) | Spec aprobada |
| **D-02** | Single-page stepper, estado en memoria, sin deep-linking | Spec D-02 = A; D-07 = B (recarga reinicia) |
| **D-03** | Paso 0 solo en `/reservar`; `/reservar/:movieId` salta a Paso 1 | Spec D-03 = B |
| **D-04** | Cambio de showtime permitido siempre (botón «Cambiar función») | Spec D-04 = A; limpia `elegidos` (RF-12) |
| **D-05** | **Sin modal**: botón «Confirmar reserva» directo en Paso 3; éxito = **pantalla/panel** (no modal) | Spec D-05 = B + QA obs. 3 |
| **D-06** | Conflicto 409 → toast + vuelta a Paso 2 + recarga silenciosa mapa | Spec D-06 = A |
| **D-07** | No persistencia en URL; recarga = Paso 0 o 1 según ruta | Spec D-07 = B |
| **D-08** | Sin límite frontend de asientos; backend valida | Spec D-08 = B |
| **QA-1** | `peliculaService.listarPeliculas()` (no `listar()`) | Método real del servicio |
| **QA-2** | `carteleraService.listarFunciones(movieId)` para filtrar | Método real con param opcional |
| **QA-3** | Helper `reserva-calculos.ts`: `calcularTotal`, `redondearTotal` | Cálculo puro, determinista, testeable |
| **QA-4** | Helper `showtime-format.ts`: `formatearShowtime`, `formatearFecha` | Formateo centralizado, hora local |
| **QA-5** | Hook `useAuth` para `user.id`, `user.roles` | Ya existe en `AuthContext` |
| **QA-6** | Mantener `PeliculasDellatePage` (typo real en export) | Compatibilidad hacia atrás |

---

## 4. Mapeo RF → Componentes/Archivos

| RF | Componente / Archivo | Notas |
|----|----------------------|-------|
| RF-01..RF-04 | `MovieSelector.tsx` + `useMovieWithShowtimes.ts` (Paso 0) | `listarPeliculas()` + `listarFunciones(movieId)` por película |
| RF-05..RF-07 | `ReservarPage` (routing + guard) + `RequireAuth` | Rutas + redirección login |
| RF-08..RF-12 | `ShowtimeSelector.tsx` + `useMovieWithShowtimes.ts` (Paso 1) | Agrupación por fecha, orden por hora, badge «Completa» |
| RF-13..RF-17 | `SeatMap.tsx` + `useSeatSelection.ts` (Paso 2) | Reutiliza lógica `FuncionAsientosPage` |
| RF-18 | `ReservaResumen.tsx` (Paso 3) | Panel con todos los datos |
| RF-19..RF-22 | `ReservaResumen.tsx` + `useReservaStepper.ts` + `reservaService` | Confirmación, éxito, 409, errores |
| RF-23..RF-25 | `useReservaStepper.ts` + botones navegación en cada paso | Navegación bidireccional, recarga reinicia |

---

## 5. Estrategia de Verificación (Test-First)

**Método**: MCP Playwright (login `gguzman` / `123456`) + `npm run typecheck` + `npm run lint` + `npm run build`.
**No hay tests unitarios**. Cada criterio C-01..C-16 de la spec se valida observando la UI.

### Matriz de Verificación por Tarea

| Tarea | Criterios Playwright (C-XX) | Comandos CI |
|-------|----------------------------|-------------|
| T1: Helpers puros | C-16 (typecheck/lint/build) | `typecheck`, `lint`, `build` |
| T2: Hooks base | C-16 | `typecheck`, `lint`, `build` |
| T3: MovieSelector (Paso 0) | C-01, C-04 | Playwright + CI |
| T4: ShowtimeSelector (Paso 1) | C-02, C-05, C-06 | Playwright + CI |
| T5: SeatMap + useSeatSelection (Paso 2) | C-06, C-07, C-08, C-12, C-13 | Playwright + CI |
| T6: ReservaResumen + ReservaExito (Paso 3) | C-09, C-10, C-11 | Playwright + CI |
| T7: useReservaStepper + ReservarPage | C-03, C-14, C-15 | Playwright + CI |
| T8: Rutas + RequireAuth | C-01, C-02, C-03 | Playwright + CI |
| T9: Integración PeliculasDellatePage (opcional) | Mejora UX | Playwright + CI |
| T10: Verificación final completa | C-01..C-16 | Playwright + CI |

---

## 6. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Conflicto 409 en confirmación** | Media | Alto | Tarea T6: implementar `catch` específico para `HttpError.status === 409`, parsear `message`, mostrar toast (sonner), `goBackToStep(2)` + recargar asientos |
| **Recarga del navegador pierde estado** | Alta | Medio | Diseño intencional (D-07 = B). Documentar en UX: «Al recargar se reinicia el flujo». |
| **Accesibilidad mapa de asientos (teclado)** | Media | Alto | Tarea T5: `SeatMap` usa `<button>` nativo, `aria-label="Fila A, Butaca 5"`, `tabIndex`, navegación Arrow keys via `onKeyDown` |
| **Responsive móvil (mapa + resumen)** | Media | Medio | Tarea T5/T6: CSS Grid/Flex con `overflow-x-auto` en filas; `ReservaResumen` colapsable en `<md` con `Sheet` (Radix) |
| **Sesión expira durante flujo** | Baja | Alto | Interceptor `lib/http.ts` ya maneja 401 → redirect login con `next`. Verificar en T7. |
| **Typo `PeliculasDellatePage` rompe import** | Baja | Bajo | Usar nombre real del export; no renombrar (QA-6). |

---

## 7. Criterios de Aceptación del Plan (Checklist antes de aprobar tasks)

- [ ] Todos los RF de la spec tienen al menos un componente/hook asignado
- [ ] Cada tarea tiene criterios de prueba Playwright concretos (pasos observables)
- [ ] Dependencias entre tareas forman un DAG válido (sin ciclos)
- [ ] Tareas sin dependencias marcadas `paralelizable: true`
- [ ] Helpers puros (`reserva-calculos.ts`, `showtime-format.ts`) sin dependencias de React
- [ ] No se añaden dependencias externas nuevas (solo Radix/Metronic/Tailwind existentes)
- [ ] Rutas protegidas con `RequireAuth` (no `RequireRole` — todos los roles autenticados acceden)
- [ ] Código en inglés, interfaz/documentación en español
- [ ] `id` en código, «identificador» en UI
- [ ] `MEMORY.md` actualizado al cerrar cada tarea (responsabilidad del implementador)

---

## 8. Estrategia de Paralelismo Detectada

| Grupo | Tareas | Puede ejecutarse en paralelo |
|-------|--------|------------------------------|
| **Grupo A (Fundación)** | T1 (helpers), T2 (hooks base) | **Sí** — independientes entre sí |
| **Grupo B (Pasos UI)** | T3 (Paso 0), T4 (Paso 1) | **Sí** — dependen solo de Grupo A |
| **Grupo C (Core Reserva)** | T5 (Paso 2), T6 (Paso 3) | **Sí** — dependen de Grupo A + B |
| **Grupo D (Orquestación)** | T7 (Stepper + Page), T8 (Rutas) | **Secuencial** — T7 requiere T3..T6; T8 independiente pero mejor al final |
| **Grupo E (Pulido)** | T9 (Mejora opcional), T10 (Verificación final) | T9 paralela a T10; T10 al final obligatoriamente |

> **Total estimado**: 10 tareas atómicas. Paralelismo máximo: 2-3 tareas simultáneas en Grupos A, B, C.