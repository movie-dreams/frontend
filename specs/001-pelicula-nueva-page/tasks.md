# Tareas 001 — Página para agregar nuevas películas

Orden por dependencia. Máximo 10 tareas. Formato: `- [ ] **Tn. descripción.** RF-x`
y `Hecho cuando: …`. La matriz de dependencias indica qué puede ejecutarse en
paralelo.

## Paralelización

- **Ola 1 (paralelizables):** T1 ‖ T2.
- **Ola 2 (paralelizables, tras la Ola 1):** T3 ‖ T4.
- **Ola 3 (secuencial):** T5 → T6 → T7 → T8 → T9.

- [x] **T1. Función pura de validación de la fecha de estreno.** RF-11
  - Hecho cuando: existe la función pura que recibe el valor de fecha y «hoy» y
    devuelve válida/inválida; acepta vacío, fecha de hoy y futura, y rechaza
    formato inválido, fecha inexistente (p. ej. 30/02) y fecha anterior a hoy.
  - `[Depende de: Ninguna]`

- [x] **T2. Funciones puras de validación de imágenes.** RF-14, RF-15, RF-16, RF-17
  - Hecho cuando: existen las funciones puras y las constantes (máx. 5 imágenes,
    5 MiB por imagen, formatos .jpg/.jpeg/.png/.webp) que, dado un lote de
    archivos y unas opciones, devuelven las aceptadas y el motivo de cada rechazo
    (cantidad, tamaño, formato).
  - `[Depende de: Ninguna]`

- [x] **T3. Esquema de validación del formulario (con «hoy»).** RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13
  - Hecho cuando: existe la factoría de esquema `getMovieFormSchema(today)` y el
    tipo de valores; el Título exige no vacío (tras trim) y ≤ 100 caracteres; la
    Sinopsis exige no vacía; la duración exige número ≥ 1; la fecha usa la función
    de T1; y estado por defecto activo. Los mensajes están en español.
  - `[Depende de: T1]`

- [x] **T4. Control de imágenes de la pantalla (reutilizando el selector existente).** RF-5, RF-14, RF-15, RF-16, RF-17
  - Hecho cuando: la pantalla integra el selector múltiple existente, muestra
    previsualizaciones con opción de quitar, y al seleccionar aplica las funciones
    de T2 rechazando y avisando el motivo por cada imagen no conforme (cantidad,
    tamaño, formato).
  - `[Depende de: T2]`

- [x] **T5. Formulario y envío a la operación de creación.** RF-5, RF-10, RF-13, RF-18, RF-19
  - Hecho cuando: el formulario usa el esquema de T3 y el control de T4; al enviar
    valores válidos llama al servicio con Título tal cual (sin transformar) e
    `isActive` por defecto; y ante cualquier fallo del servicio muestra el motivo
    **conservando** los datos introducidos.
  - `[Depende de: T3, T4]`

- [x] **T6. Éxito, aviso genérico y cancelación.** RF-20, RF-21
  - Hecho cuando: al guardar con éxito se vuelve al listado con un aviso de éxito
    genérico (marca de navegación consumida una vez); y «Cancelar» vuelve al
    listado sin registrar ninguna película.
  - `[Depende de: T5]`

- [x] **T7. Ruta privada protegida por rol.** RF-2, RF-4
  - Hecho cuando: existe la ruta de alta dentro de la sesión privada con
    `RequireAuth` + rol Administrador/Gerente; sin sesión redirige al ingreso
    guardando `next`, y con rol no autorizado no permite el acceso ni el registro.
  - `[Depende de: T6]`

- [x] **T8. Botón principal en el listado público, visible solo por rol.** RF-1, RF-3
  - Hecho cuando: el listado muestra un botón principal (paleta de la app) que
    lleva a la pantalla de alta, **solo** para Administrador/Gerente; un visitante
    anónimo o un Cliente no lo ven, con independencia del estado del listado.
  - `[Depende de: T7]`

- [x] **T9. Verificación integral con el MCP de Playwright + estático.** RF-1..RF-21
  - Hecho cuando: se recorren en verde los bloques A–D del plan con el MCP de
    Playwright (login `gguzman` / `123456`) y pasan `npm run typecheck` y
    `npm run lint` (y `npm run build` si se desea).
  - `[Depende de: T8]`
