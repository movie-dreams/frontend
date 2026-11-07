# Plan 002 — Página para crear nuevas funciones (showtimes)

**Estado: borrador**

## Filosofía de diseño: Módulos profundos (Deep Modules)

Bajo la metodología *skill sdd* y los principios de "A Philosophy of Software Design", este plan diseña módulos con interfaces extremadamente simples que ocultan mucha funcionalidad e información interna. Se aplican los siguientes principios:

- **Ocultación de información (Information Hiding):** Cada módulo esconde su implementación y estructuras de datos para evitar la fuga de información. La pantalla no necesita saber cómo se validan los horarios o se construye la petición HTTP.
- **Interfaz simple y general:** Los módulos tienen una interfaz mínimamente compleja pero cubren un propósito generalemente reutilizable (crear función, listar funciones, formatear fecha). La generalidad oculta mejores los detalles específicos.
- **Empujar la especialización hacia abajo:** Los detalles de validación de formato (regex de hora, formato de fecha), cálculos de conflicto y mapeo de enum de estado se empujan hacia los helpers puros en `src/lib/`, manteniendo la pantalla y el servicio limpios.

## Estructura de tareas (máximo 12)

Las siguientes tareas están ordenadas cronológicamente para la implementación del listado de gestión de funciones y la pantalla de crear función. Cada tarea declara explícitamente sus dependencias para permitir paralelización segura.

### T1: Definir esquema de formulario Zod (validación en cliente)
- **Descripción:** Crear el esquema de validación en `src/lib/funcion-schema.ts` usando Zod, reutilizando la regex para `startTime` y `endTime`, y validando `price` con máximo 2 decimales. Exportar `FuncionFormValues` tipo TypeScript.
- **Criterio de éxito (Hecho cuando):** El esquema Zod valida correctamente un objeto con `movieId`, `roomId`, `date`, `startTime`, `endTime`, `price`, `status`. Los tipos `FuncionFormValues` y `CrearFuncionForm` están exportados y tipados.
- **Depende de:** Ninguna (tarea foundation, puede iniciarse en paralelo con T2 y T3).

### T2: Crear componente de formulario de crear función
- **Descripción:** Desarrollar `src/pages/funcion/forms/funcion-creacion-form.tsx` con los campos: Película (select cargado del servicio `sala.service.ts` o `pelicula.service.ts`), Sala (select), Fecha (input tipo text con máscara YYYY-MM-DD), Hora de inicio (input tipo text con máscara HH:mm:ss), Hora de fin (input tipo text con máscara HH:mm:ss), Precio (input number), Estado (select con PROGRAMADA/CANCELADA/FINALIZADA).
- **Criterio de éxito (Hecho cuando):** El componente renderiza todos los campos con sus etiquetas en español, usa `Formik` o `react-hook-form` con el esquema Zod de T1 para validación en tiempo real, y todos los campos están deshabilitados hasta que hay una sesión válida.
- **Depende de:** T1 (necesita el esquema Zod y tipos exportados).

### T3: Crear servicio de creación de función (wrapper para POST /showtimes)
- **Descripción:** En `src/services/funcion.service.ts`, asegurar que el método `crear` esté correctamente tipado y funcione con el DTO `CrearFuncion`. Si es necesario, crear un wrapper `crearFuncion` que prepare el cuerpo de la petición considerando las validaciones del backend (formato de fecha/hora, conflictos). El servicio ya tiene el método `crear` implementado (ver spec 001), se reutiliza o levemente adapta.
- **Criterio de éxito (Hecho cuando):** `funcionService.crear(funcion: CrearFuncion)` retorna `Promise<Funcion>` y la petición HTTP POST a `/showtimes` se realiza con el token adjuntado correctamente. Manejo de error HTTP 409 (conflicto) que se propaga como error estructurado.
- **Depende de:** Ninguna (servicio ya existe, tarea de readecuación menor).

### T4: Crear guard de rol para pantalla de gestión y creación
- **Descripción:** Desarrollar o verificar el guard `RequireRole` que restringe el acceso a las pantallas `/funciones` (listado gestión) y `/funciones/nueva` (creación) a los roles `Administrador` y `Gerente`. Seguir el patrón de `src/routing/app-routing-setup.tsx` de la feature 001. El guard debe verificar el token `cine_token` en `localStorage` y los roles del usuario.
- **Criterio de éxito (Hecho cuando):** Acceder a `/funciones` o `/funciones/nueva` sin sesión o con rol `Cliente` redirige al listado público o login; acceso con `Administrador` o `Gerente` permite la carga de las pantallas.
- **Depende de:** T3 (necesita el servicio que consumirá el endpoint).

### T5: Crear pantalla de listado de funciones (gestión) — FuncionesPage
- **Descripción:** Desarrollar `src/pages/funciones/funciones-page.tsx` que muestra una tabla de gestión con columnas: Película, Sala, Fecha, Hora inicio, Hora fin, Precio, Estado, Acciones. Usa `funcionService.listar(page, perPage)` para obtener datos paginados. Incluye paginación (controles siguiente/anterior), botón "Crear función" en la cabecera, y en la columna Acciones botones placeholder para Editar y Eliminar (futuro).
- **Criterio de éxito (Hecho cuando):** La pantalla se monta en `/funciones`, muestra tabla con datos reales del backend, paginación funciona, botón "Crear función" navega a `/funciones/nueva`, y el acceso está restringido a Admin/Gerente.
- **Depende de:** T3, T4 (servicio y guard).

### T6: Crear pantalla de crear función (FuncionNuevaPage)
- **Descripción:** Desarrollar `src/pages/funciones/funcion-nueva-page.tsx` que compone el `FuncionCreacionForm` de T2, integra el `funcionService.crear` de T3, y maneja los estados: inicial, enviando, éxito, error, cancelado. Al éxito, navega al listado de funciones (gestión) `/funciones` con aviso genérico. Al cancelar, vuelve al listado sin crear.
- **Criterio de éxito (Hecho cuando):** La pantalla se monta correctamente, el formulario se envía vía `http.post` al backend, y tras éxito o error el estado de la UI es consistente (datos conservados en error, aviso en éxito).
- **Depende de:** T2, T3, T4 (componentes, servicio y guard).

### T7: Integrar pantallas en enrutamiento y menú lateral
- **Descripción:** 
  1. Modificar `src/routing/app-routing-setup.tsx` para agregar las rutas privadas `/funciones` (listado gestión) y `/funciones/nueva` (creación) con el guard `RequireRole(['Administrador', 'Gerente'])`.
  2. Modificar `src/config/menu.config.tsx`: cambiar la entrada "Funciones" para que apunte a `/funciones` (en lugar de `/cartelera`) y añadir `roles: ['Administrador', 'Gerente']`.
- **Criterio de éxito (Hecho cuando):** 
  - Las rutas `/funciones` y `/funciones/nueva` están registradas y protegidas.
  - La pestaña "Funciones" en el menú lateral aparece solo para Admin/Gerente y navega a `/funciones`.
  - El botón "Crear función" en el listado navega a `/funciones/nueva`.
- **Depende de:** T4, T5, T6 (guard, listado y pantalla de creación definidos).

### T8: Implementar validación de conflicto de horario en pantalla
- **Descripción:** Agregar lógica en el envío del formulario (en T6) que confíe en la validación del backend y muestre mensaje amigable al recibir HTTP 409. El servicio T3 ya maneja el error 409 y lo propaga como `HttpError` con status 409.
- **Criterio de éxito (Hecho cuando):** Si ya existe una función no cancelada en la misma película, sala, fecha y horario, el formulario muestra un mensaje: "Ya existe una función programada en este horario para la película seleccionada". El formulario no se envía hasta que el usuario corrige la selección.
- **Depende de:** T6 (necesita la pantalla de creación).

### T9: Estilos y consistencia visual
- **Descripción:** Aplicar los estilos existentes de la aplicación (Radix UI, Tailwind 4, paleta Metronic v9.2.0 depurada). El formulario y la tabla deben reutilizar componentes existentes: `Input`, `Select`, `Button variant="primary"`, `Form`, `Table`, `Pagination` de la feature 001. Los mensajes de error deben presentarse en español con claridad.
- **Criterio de éxito (Hecho cuando):** La pantalla de listado y creación tienen apariencia coherente con el resto de la aplicación, los componentes son los definidos en la feature 001 y no se introducen nuevos componentes de diseño sin necesidad.
- **Depende de:** T5, T6, T7 (pantallas integradas y enrutamiento definido).

### T10: Criterios de prueba observables (Playwright)
- **Descripción:** Definir los criterios de prueba observables en la UI que validarán cada RF y RNF. No son tests unitarios, sino pasos de verificación manual o automatizados con Playwright MCP (login `gguzman` / `123456`). Los criterios incluyen:
  - Admin ve pestaña "Funciones" y accede a listado gestión.
  - Cliente no ve pestaña "Funciones" y es redirigido.
  - Listado muestra tabla con columnas correctas y datos reales.
  - Paginación funciona.
  - Botón "Crear función" visible en listado y navega a creación.
  - Formulario impide envío con campos vacíos/inválidos.
  - Formulario permite envío con todos los campos correctos.
  - Creación exitosa navega de vuelta al listado con aviso.
  - Cancelación devuelve al listado sin crear.
  - Conflicto de horario muestra mensaje.
- **Criterio de éxito (Hecho cuando):** Los criterios de prueba están definidos y serán validados con el MCP de Playwright antes de marcar la spec como aprobada.
- **Depende de:** T5, T6, T7, T8 (pantallas completas y flujos definidos).

### T11: Typecheck, lint y build final
- **Descripción:** Ejecutar `npm run typecheck`, `npm run lint` y `npm run build` para asegurar que no hay errores de tipos, convenciones de código o fallos de build. Corregir cualquier advertencia antes de cerrar la spec.
- **Criterio de éxito (Hecho cuando):** Los tres comandos terminan sin errores (`exit code 0`).
- **Depende de:** T5, T6, T7, T8, T9 (todo el código escrito debe pasar los checks).

## Resumen ejecutivo

Se planificaron 11 tareas bajo la filosofía de módulos profundos, donde la complejidad de validación y lógica de negocio se oculta detrás de interfaces simples (esquema Zod, servicio API, guard de rol). Las tareas están diseñadas para permitir paralelización (T1, T2, T3 pueden iniciar independientemente) y dependencias claras que evitan carreras de condiciones.

**Nuevas tareas vs plan anterior:**
- T5: **Nueva** - Crear pantalla de listado de funciones (gestión) `FuncionesPage`
- T7: **Ampliada** - Incluye enrutamiento de ambas pantallas y actualización del menú lateral
- T10: **Ampliada** - Incluye criterios para el listado de gestión

La verificación final se realizará con el MCP de Playwright y los checks de toolchain (`typecheck`, `lint`, `build`).