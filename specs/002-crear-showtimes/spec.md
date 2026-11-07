# Spec 002 — Página para crear nuevas funciones (showtimes)

**Estado: borrador**

## Contexto y objetivo

Actualmente el catálogo de películas y el listado de funciones se pueden consultar en la cartelera pública, pero no existe una pantalla de **gestión de funciones** para el personal autorizado (Administrador y Gerente) donde puedan ver todas las funciones existentes en formato tabla, crear nuevas, editar o eliminar.

El objetivo es habilitar:
1. Un **listado de funciones (gestión)** en la pestaña "Funciones" del menú lateral, accesible solo para Administrador y Gerente, que muestre todas las funciones en formato tabla con acciones.
2. Una **pantalla completa para crear nuevas funciones** (showtimes) con validaciones, accesible desde el botón "Crear función" en dicho listado.

El alta, edición y eliminación de funciones solo debe estar disponible para el personal autorizado (Administrador y Gerente). El resto de personas (visitantes anónimos y clientes) no deben poder acceder a la gestión de funciones.

## Usuarios

- **Administrador**: responsable de la cartelera; puede listar, crear, editar y eliminar funciones.
- **Gerente**: responsable de la cartelera; puede listar, crear, editar y eliminar funciones.
- **Cliente**: usuario autenticado que solo consulta/compra en la cartelera pública; **no** accede a la gestión de funciones.
- **Visitante anónimo**: navega el catálogo público (cartelera); **no** accede a la gestión de funciones.

## Historias de usuario

- HU-1. Como Administrador, quiero crear una nueva función seleccionando película, sala, fecha y horarios para incorporarla a la cartelera.
- HU-2. Como Gerente, quiero crear una nueva función seleccionando película, sala, fecha y horarios para incorporarla a la cartelera.
- HU-3. Como Administrador o Gerente, quiero llegar a la pantalla de creación de función desde el listado de funciones mediante un botón visible, para iniciar el registro sin pasos intermedios.
- HU-4. Como responsable de la cartelera, quiero que el sistema me avise cuando un dato obligatorio falta o es inválido, para corregirlo antes de guardar.
- HU-5. Como Administrador o Gerente, quiero poder cancelar el registro en cualquier momento y volver al listado sin dejar datos a medias.
- **HU-6. Como Administrador o Gerente, quiero ver un listado de todas las funciones en formato tabla (con película, sala, fecha, hora inicio, hora fin, precio, estado y acciones) para gestionar la cartelera completa desde un solo lugar.**

## Definiciones

- **Función (Showtime)**: registro de una proyección de película compuesta por película, sala, fecha, hora de inicio, hora de fin, precio y estado.
- **Roles autorizados**: «Administrador» (ADMIN) y «Gerente» (MANAGER). Son los únicos que pueden acceder a la gestión de funciones (listar, crear, editar, eliminar). «Cliente» es el rol de consulta/compra en la cartelera pública.
- **Cartelera pública**: la pantalla pública (`/cartelera`) que muestra las funciones disponibles para clientes; no es la gestión de funciones.
- **Gestión de funciones**: la pantalla privada (`/funciones`) que lista todas las funciones en tabla con acciones de crear, editar, eliminar; solo para Administrador y Gerente.
- **Estado PROGRAMADA**: indica si la función está programada y disponible para la venta.
- **Película**: registro del catálogo al que pertenece la función.
- **Sala**: espacio físico donde se proyecta la función.

## Requisitos funcionales

### Listado de funciones (gestión) — pestaña "Funciones" (/funciones)

- **RF-18**: CUANDO una persona con rol Administrador o Gerente accede a la pestaña "Funciones" en el menú lateral, EL SISTEMA muestra la pantalla de gestión de funciones en la ruta `/funciones`.
- **RF-19**: MIENTRAS la persona autorizada visualiza el listado de funciones (gestión), EL SISTEMA presenta una tabla con columnas: Película, Sala, Fecha, Hora inicio, Hora fin, Precio, Estado, Acciones.
- **RF-20**: CUANDO la tabla de funciones se carga, EL SISTEMA obtiene los datos mediante `GET /showtimes` (con paginación) y muestra todas las funciones, no solo las de una película.
- **RF-21**: CUANDO una persona con rol Administrador o Gerente visualiza el listado de funciones (gestión), EL SISTEMA muestra un botón principal "Crear función" para agregar una nueva función.
- **RF-22**: CUANDO la persona autorizada activa el botón "Crear función" en el listado de gestión, EL SISTEMA la lleva a la pantalla de creación de función en `/funciones/nueva`.
- **RF-23**: MIENTRAS una persona no tiene rol Administrador o Gerente, EL SISTEMA no muestra la pestaña "Funciones" en el menú lateral ni permite el acceso a `/funciones`.

### Creación de función (pantalla `/funciones/nueva`)

- **RF-1**: CUANDO una persona con rol Administrador o Gerente visualiza el listado de funciones (gestión), EL SISTEMA muestra un botón principal (con la paleta de colores de la aplicación) para agregar una nueva función.
- **RF-2**: CUANDO la persona autorizada activa el botón de agregar función, EL SISTEMA la lleva a la pantalla de creación de función.
- **RF-3**: MIENTRAS una persona no tiene rol Administrador o Gerente, EL SISTEMA no muestra el botón de agregar función en el listado.
- **RF-4**: SI una persona sin rol Administrador o Gerente intenta acceder directamente a la pantalla de creación, ENTONCES EL SISTEMA le impide el acceso y no registra ninguna función.
- **RF-5**: MIENTRAS la pantalla de creación de función está abierta, EL SISTEMA presenta un formulario con los campos: Película, Sala, Fecha, Hora de inicio, Hora de fin, Precio, Estado.
- **RF-6**: SI el campo Película está vacío o no es un identificador válido, ENTONCES EL SISTEMA impide enviar el formulario y muestra un mensaje indicando que la Película es obligatoria.
- **RF-7**: SI el campo Sala está vacío o no es un identificador válido, ENTONCES EL SISTEMA impide enviar el formulario y muestra un mensaje indicando que la Sala es obligatoria.
- **RF-8**: SI el campo Fecha está vacío, no es una fecha válida en formato YYYY-MM-DD, o es una fecha anterior a hoy, ENTONCES EL SISTEMA impide enviar el formulario y muestra un mensaje indicando que la Fecha es obligatoria y debe ser hoy o futura.
- **RF-9**: SI el campo Hora de inicio no coincide con el formato HH:mm:ss (regex: /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/) o está vacío, ENTONCES EL SISTEMA impide enviar el formulario y muestra un mensaje indicando que la Hora de inicio es obligatoria y debe tener el formato HH:mm:ss.
- **RF-10**: SI el campo Hora de fin no coincide con el formato HH:mm:ss, está vacío, o es anterior o igual a la Hora de inicio del mismo día, ENTONCES EL SISTEMA impide enviar el formulario y muestra un mensaje indicando que la Hora de fin es obligatoria y debe ser posterior a la Hora de inicio.
- **RF-11**: SI el campo Precio está vacío, no es un número positivo, o tiene más de 2 decimales, ENTONCES EL SISTEMA impide enviar el formulario y muestra un mensaje indicando que el Precio es obligatorio y debe tener como máximo 2 decimales.
- **RF-12**: SI el campo Estado no se especifica, EL SISTEMA establece el valor por defecto PROGRAMADA. SI se especifica, debe ser uno de los valores válidos (PROGRAMADA, CANCELADA, FINALIZADA).
- **RF-13**: EL SISTEMA valida que la combinación de Película + Sala + Fecha + Hora de inicio no esté ocupada por otra función no cancelada; SI hay conflicto, ENTONCES EL SISTEMA impide enviar el formulario y muestra un mensaje indicando que ya existe una función en ese horario.
- **RF-14**: CUANDO la persona autorizada envía un formulario con datos válidos, EL SISTEMA registra la función mediante la operación de creación (/showtimes) del servicio.
- **RF-15**: SI el registro de la función falla por cualquier motivo (error de red o rechazo del servidor, incluidos datos inválidos o conflicto de horario), ENTONCES EL SISTEMA muestra el motivo del error sin descartar los datos ya introducidos en el formulario.
- **RF-16**: CUANDO el registro de la función finaliza con éxito, EL SISTEMA lleva a la persona de vuelta al listado de funciones (gestión) con un aviso de éxito genérico. Si la función está activa, además ya aparece en el listado.
- **RF-17**: CUANDO la persona autorizada cancela el formulario, EL SISTEMA la lleva de vuelta al listado de funciones (gestión) sin crear ninguna función.

## Requisitos no funcionales

- **RNF-1**: La pantalla de creación y el listado de gestión reutilizan el diseño, componentes y paleta de colores ya existentes en la aplicación; no introducen un lenguaje visual nuevo.
- **RNF-2**: La interfaz, los textos de validación y los mensajes de error se presentan en español.
- **RNF-3**: Los mensajes de error (falta de datos obligatorios, formato inválido, conflicto de horario) indican con claridad qué corregir.
- **RNF-4**: La validación de los campos obligatorios y de los formatos es inmediata en la pantalla, antes de enviar la solicitud al servicio.
- **RNF-5**: La operación está sujeta a la autenticación y a la autorización por rol existentes; sin una sesión válida y un rol autorizado no se crea ninguna función.
- **RNF-6**: Las fechas y horas se manejan en hora local del cine; no se convierte a UTC.
- **RNF-7**: El formulario respeta el límite de 2 decimales máximo para el campo Precio; si el usuario ingresa más, el sistema redondea o rechaza los extras.
- **RNF-8**: La tabla de listado de gestión usa paginación del backend (`page`, `perPage`) para manejar volúmenes grandes de funciones.

## Formato de datos

### CrearFuncion (entrada al servicio / POST /showtimes)

| Campo | Tipo | Descripción | Obligatorio | Validaciones |
|-------|------|-------------|-----------|-------------|
| movieId | number | Identificador de la película | Sí | Debe ser un número entero positivo; debe existir en el catálogo de películas |
| roomId | number | Identificador de la sala | Sí | Debe ser un número entero positivo; debe existir en el catálogo de salas |
| date | string | Fecha en formato YYYY-MM-DD (hora local) | Sí | Formato YYYY-MM-DD; no puede ser anterior a hoy |
| startTime | string | Hora de inicio en formato HH:mm:ss | Sí | Regex: /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/; no puede ser vacío |
| endTime | string | Hora de fin en formato HH:mm:ss | Sí | Regex: /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/; debe ser posterior a startTime mismo día |
| price | number | Precio con como máximo 2 decimales | Sí | Número positivo; máximo 2 decimales; debe ser > 0 |
| status | string (opcional) | Estado de la función | No | Valor por defecto: PROGRAMADA; si se provee, debe ser PROGRAMADA, CANCELADA o FINALIZADA |

### Funcion (respuesta del servicio / GET /showtimes/:id)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | number | Identificador único de la función |
| movieId | number | Identificador de la película |
| movie? | string | Título de la película (en listados públicos) |
| roomId | number | Identificador de la sala |
| room? | string | Nombre de la sala (en listados públicos) |
| roomType? | string | Tipo de sala (en listados públicos) |
| date | string | Fecha en formato YYYY-MM-DD |
| startTime | string | Hora de inicio en formato HH:mm:ss |
| endTime | string | Hora de fin en formato HH:mm:ss |
| price | number | Precio de la función |
| status | string | Estado de la función (PROGRAMADA, CANCELADA, FINALIZADA) |

## Validaciones requeridas (ejecución en cliente)

1. **Validación de película**: El campo Película debe seleccionarse de una lista cargada del backend; valor vacío o inválido impide el envío.
2. **Validación de sala**: El campo Sala debe seleccionarse de una lista cargada del backend; valor vacío o inválido impide el envío.
3. **Validación de fecha**: Debe ser un string con formato YYYY-MM-DD; fechas anteriores a hoy son rechazadas; fecha vacía no se envía (el backend podría asignar hoy o rechazar).
4. **Validación de hora de inicio**: Debe cumplir la regex /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/; hora vacía impide el envío.
5. **Validación de hora de fin**: Debe cumplir la regex; debe ser estrictamente posterior a la hora de inicio (mismo día); hora vacía impide el envío.
6. **Validación de precio**: Debe ser un número > 0 con máximo 2 decimales; valores negativos, cero o con más de 2 decimales impiden el envío.
7. **Validación de conflicto**: El sistema consulta al backend (POST /showtimes) y maneja el error de conflicto (HTTP 409) mostrando mensaje amigable.

## Roles de acceso

- **Acceso permitido (gestión)**: Los roles `Administrador` y `Gerente` pueden acceder a `/funciones` (listado gestión), `/funciones/nueva` (creación), y futuras `/funciones/:id/editar` y eliminación.
- **Acceso denegado**: Los roles `Cliente` y `Visitante anónimo` no ven la pestaña "Funciones" en el menú lateral y son redirigidos al intentar acceder a `/funciones` o `/funciones/nueva`.
- **Autenticación**: Es obligatoria una sesión válida (token `cine_token` en `localStorage`) para que el interceptor HTTP (`src/lib/http.ts`) adjunte el header `Authorization: Bearer <token>` a toda petición.

## Dependencias con features existentes

- **Service existente**: `src/services/funcion.service.ts` ya tiene los métodos CRUD completados (`crear`, `listar`, `obtener`, `actualizar`, `eliminar`) consumiendo los endpoints `/showtimes`. No se requiere crear nuevo servicio.
- **Tipos existentes**: `src/types/cartelera.ts` ya define `CrearFuncion`, `Funcion`, `EstadoFuncion`. Se reutilizan sin modificar.
- **HTTP y auth**: El servicio http (`src/lib/http.ts`) ya adjunta el token de sesión de `localStorage` bajo clave `cine_token`. No se requieren cambios en la capa de red.
- **Validación de fechas**: Se recomienda reutilizar el helper puro en `src/lib/` para parseo y formateo de fechas en hora local, siguiendo el patrón de la feature 001 (película nueva).
- **Rutas privadas**: La pantalla de listado (`/funciones`) y creación (`/funciones/nueva`) deberán protegerse con los guards de rol existentes (`RequireAuth` + `RequireRole(['Administrador', 'Gerente'])`), siguiendo el patrón de la feature 001.
- **Backend**: La API ya expone los endpoints necesarios en `/showtimes` y `/billboard/showtimes`. No se modifica el backend.
- **Menú lateral**: La entrada "Funciones" en `src/config/menu.config.tsx` ya existe y apunta a `/cartelera`; se debe cambiar a `/funciones` y añadir restricción de roles `['Administrador', 'Gerente']`.

## Casos límite

- Película seleccionada inválida o vacía.
- Sala seleccionada inválida o vacía.
- Fecha anterior a hoy (rechazada), fecha de hoy (permitida), fecha vacía (no se envía o comportamiento por defecto del backend).
- Hora de inicio fuera del formato HH:mm:ss (rechazada).
- Hora de fin igual o anterior a la hora de inicio (rechazada).
- Precio negativo, cero, o con más de 2 decimales (rechazado).
- Conflito de horario (misma película, sala, fecha y hora superpuesta con función distinta de CANCELADA) (rechazado con mensaje).
- Estado especificado inválido (cualquier string que no sea PROGRAMADA, CANCELADA, FINALIZADA) (rechazado, se usa valor por defecto).
- Cancelar el formulario sin crear ninguna función.
- Fallo del servicio al registrar la función (error de red o rechazo del servidor).
- Acceso directo a la pantalla de creación sin sesión iniciada.
- Acceso directo a la pantalla de creación con rol Cliente.
- Listado vacío (sin funciones creadas aún): la tabla muestra mensaje "No hay funciones registradas".
- Paginación: si hay más funciones que `perPage`, controles de paginación funcionan.

## Criterios de finalización

- Un Administrador y un Gerente ven la pestaña "Funciones" en el menú lateral y acceden al listado de gestión en `/funciones`.
- Un Cliente y un visitante anónimo no ven la pestaña "Funciones" y no pueden acceder a `/funciones` ni `/funciones/nueva`.
- El listado de gestión muestra una tabla con columnas: Película, Sala, Fecha, Hora inicio, Hora fin, Precio, Estado, Acciones.
- El botón "Crear función" aparece en el listado de gestión solo para Administrador/Gerente y navega a `/funciones/nueva`.
- El formulario de creación impide el envío cuando Película, Sala, Fecha, Hora de inicio, Hora de fin, Precio no son válidos (según RF-6 a RF-12), y lo permite cuando todos los campos son correctos.
- La fecha, si se rellena, es válida y no anterior a hoy; si se deja vacía, no se envía (o se comporta según regla de negocio).
- El precio, si es inválido (negativo, cero, >2 decimales), impide el envío; si es válido, se envía.
- Cuando no se especifica el estado, la función se crea con estado PROGRAMADA.
- El formulario respeta la validación de conflicto de horario (misma película, sala, fecha y hora), mostrando mensaje si ya existe una función no cancelada.
- Al guardar con éxito, la persona vuelve al listado de funciones (gestión) con un aviso de éxito; si la función está activa, ya aparece en el listado.
- Cancelar el formulario devuelve al listado de gestión sin crear ninguna función.
- Ante cualquier fallo del servicio, el formulario conserva los datos introducidos y muestra el motivo.
- La verificación con el MCP de Playwright (login `gguzman` / `123456`) confirma que los flujos de listado, creación exitosa, error y cancelación funcionan correctamente en la UI.
- `npm run typecheck` y `npm run lint` aprueban sin errores.
- `npm run build` completa exitosamente.

## Dudas abiertas

- No quedan dudas pendientes. Se definió el comportamiento completo del listado de gestión, formulario y validaciones basado en el DTO del backend y los tipos frontend existentes.