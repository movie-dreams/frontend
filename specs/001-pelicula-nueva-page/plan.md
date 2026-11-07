# Plan 001 — Página para agregar nuevas películas

Spec: `specs/001-pelicula-nueva-page/spec.md` (aprobada)

## Estrategia de pruebas (test-first, antes de cualquier cambio de código)

Método de verificación del proyecto: **MCP de Playwright** (login `gguzman` /
`123456`) más `npm run typecheck` y `npm run lint` (`npm run build` opcional).
No hay tests unitarios ni runner: **prohibido** plantear criterios con un runner
inexistente. Cada criterio se observa en la UI. Antes de escribir código de
negocio se recorren estos bloques y se dejan **en rojo** por la razón correcta
(las pantallas/validaciones aún no existen); después se implementa hasta ponerlos
en verde.

### Bloque A — Acceso, botón y navegación (RF-1, RF-2, RF-3, RF-4)

| Paso | Acción con el MCP de Playwright | Resultado esperado |
| --- | --- | --- |
| A1 | Abrir `/peliculas` sin sesión | **No** aparece el botón «Agregar película» |
| A2 | Navegar directo a `/peliculas/nueva` sin sesión | Redirige a `/auth/signin?next=%2Fpeliculas%2Fnueva` |
| A3 | Iniciar sesión con `gguzman` / `123456` y volver a `/peliculas` | Aparece el botón **principal** (paleta de la app) |
| A4 | Clic en el botón | Se abre la pantalla de alta con el formulario |
| A5 | (Si hay credenciales de un `Cliente`) iniciar sesión como Cliente y abrir `/peliculas` y `/peliculas/nueva` | No ve el botón y el acceso directo lo devuelve a `/` |

> Dependencia de prueba: A3/A4 requieren que `gguzman` tenga rol **Administrador**
> o **Gerente**. A5 requiere credenciales de un usuario con rol **Cliente**
> (ver «Riesgos»). Si no existen, se documenta como caso no cubierto por UI.

### Bloque B — Validaciones de campos (RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11)

| Paso | Acción | Resultado esperado |
| --- | --- | --- |
| B1 | Enviar el formulario vacío | Mensajes de Título, Sinopsis y duración obligatorios; no se envía |
| B2 | Título de 100 caracteres válido → enviar datos válidos | Sin error de longitud |
| B3 | Título de 101 caracteres | Mensaje «máximo 100 caracteres»; no se envía |
| B4 | Duración `0` y luego `1` | `0` → error «al menos 1 minuto»; `1` → sin error |
| B5 | Título/Sinopsis con solo espacios | Mensajes de obligatorio |
| B6 | Fecha de estreno = ayer | Error «no anterior a hoy» |
| B7 | Fecha de estreno = hoy / futura / vacía | Sin error |
| B8 | Rellenar solo Título, Sinopsis y duración (fecha, estado e imágenes vacíos) | El envío está permitido (estado se crea activa) |

### Bloque C — Imágenes (RF-14, RF-15, RF-16, RF-17)

| Paso | Acción | Resultado esperado |
| --- | --- | --- |
| C1 | Adjuntar 5 imágenes válidas | Se aceptan las 5 y se previsualizan |
| C2 | Adjuntar una 6.ª | Se rechaza e informa el límite de 5 |
| C3 | Adjuntar una imagen > 5 MiB | Se rechaza e informa el máximo de 5 MiB |
| C4 | Adjuntar `.gif` (o `.bmp`) | Se rechaza e informa los formatos permitidos |
| C5 | Adjuntar `.jpg`, `.jpeg`, `.png`, `.webp` dentro de límites | Se aceptan |

### Bloque D — Envío, éxito, cancelar y fallo (RF-12, RF-13, RF-18, RF-19, RF-20, RF-21)

| Paso | Acción | Resultado esperado |
| --- | --- | --- |
| D1 | Enviar datos válidos con Título en minúsculas | Se registra vía el servicio; **aviso de éxito genérico** y vuelve a `/peliculas`; la película aparece en el listado (activa) |
| D2 | Inspeccionar el cuerpo enviado (pestaña de red del MCP) | El Título va **tal cual** (minúsculas); `isActive` va presente por defecto |
| D3 | Crear con «activo» desmarcado | Vuelve al listado con aviso de éxito; la película **no** aparece en el catálogo público |
| D4 | Pulsar «Cancelar» | Vuelve al listado sin ninguna petición de creación |
| D5 | Provocar un fallo (detener el backend o forzar 400/413) | Se muestra el **motivo** del error y el formulario **conserva** los datos |

### Bloque E — Estático

- `npm run typecheck` → sin errores.
- `npm run lint` → sin errores (el script aplica `--fix`).
- `npm run build` → opcional, compila.

Cobertura: A mitiga RF-1/2/3/4; B mitiga RF-5/6/7/8/9/10/11; C mitiga
RF-14/15/16/17; D mitiga RF-12/13/18/19/20/21.

---

## Estructura (archivos nuevos y modificados)

### Nuevos

- **`src/lib/pelicula-imagenes.ts`** — funciones **puras** de validación de
  imágenes (cantidad, tamaño, formato) y constantes de límites. No toca DOM ni
  red: recibe archivos y opciones y devuelve aceptadas + motivos de rechazo.
- **`src/lib/pelicula-fecha.ts`** — función **pura** que valida la fecha de
  estreno recibiendo **«hoy»** como parámetro (nunca `new Date()` interno).
- **`src/pages/peliculas/forms/pelicula-schema.ts`** — factoría de esquema de
  validación del formulario (recibe «hoy») y tipo de los valores del formulario.
  Responsabilidad: reglas de obligatoriedad, longitud de Título, duración ≥ 1 y
  fecha; nada de presentación.
- **`src/pages/peliculas/forms/pelicula-imagenes-field.tsx`** — campo de imágenes
  del formulario: envuelve `ImageInput` (selección y arrastrar y soltar) y añade
  las previsualizaciones con opción de quitar y el aviso del motivo de cada
  imagen rechazada. Responsabilidad: control del formulario; no conoce la
  pantalla ni el servicio.
- **`src/pages/peliculas/pelicula-nueva-page.tsx`** — pantalla de alta.
  Responsabilidad: montar el formulario, el input de imágenes, el envío al
  servicio, el aviso de éxito y el aviso de error. No escribe URLs ni llama a
  axios directamente.

### Modificados

- **`src/pages/peliculas/peliculas-page.tsx`** — añade el **botón principal**
  «Agregar película» (visible solo para Administrador/Gerente) y consume el aviso
  de éxito que llega al volver desde la pantalla de alta.
- **`src/routing/app-routing-setup.tsx`** — registra la ruta **privada**
  `/peliculas/nueva` dentro de `RequireAuth` + `Demo1Layout` +
  `RequireRole(['Administrador','Gerente'])`.

### Sin cambios (se reutilizan tal cual)

- **`src/services/pelicula.service.ts`** — `crearPelicula(pelicula, imagenes)` ya
  construye `FormData` (campos de texto + campo `images`) y hace la petición.
- **`src/types/pelicula.ts`** — `CrearPelicula` ya expone `title`, `synopsis?`,
  `durationMinutes`, `releaseDate?`, `isActive?`.
- **`src/components/image-input/`** — `ImageInput` (selector + arrastrar y soltar
  + previsualización) se reutiliza como selector de imágenes.
- **`src/auth/require-role.tsx`**, **`src/auth/require-auth.tsx`**,
  **`src/components/ui/button.tsx`** (`variant="primary"`),
  **`src/components/ui/sonner.tsx`** (`toast`), **`Container`**.

## Determinismo (funciones puras)

1. **Validación de fecha de estreno** (`src/lib/pelicula-fecha.ts`) — recibe el
   valor escrito y **«hoy»**; sin leer el reloj por dentro; compara en hora local.
2. **Validación de imágenes** (`src/lib/pelicula-imagenes.ts`) — `isImageValid`
   y `analyzeSelection` reciben los archivos y las opciones (máximo de cantidad,
   bytes y formatos permitidos) y devuelven un resultado determinista.
   Identificadores en inglés (Principio 6).
3. **Esquema del formulario** (`src/pages/peliculas/forms/pelicula-schema.ts`) —
   factoría `getMovieFormSchema(today)` que inyecta «hoy» a la validación de
   fecha, igual que `getSigninSchema` en el módulo de acceso.

## Algoritmos (pseudocódigo)

### Validación de la fecha de estreno

```
isReleaseDateValid(value: string, today: Date): boolean
    # La fecha es opcional: vacía se acepta (no se envía).
    si value está vacía: devolver VÁLIDA
    si value no casa con ^\d{4}-\d{2}-\d{2}$: devolver INVÁLIDA (formato)
    (anio, mes, dia) = descomponer(value)
    fecha = Date local(anio, mes - 1, dia)
    si componentes(fecha) != (anio, mes, dia): devolver INVÁLIDA (no existe)
    hoyTexto = componer 'YYYY-MM-DD' con componentes locales de today
    si value < hoyTexto: devolver INVÁLIDA (anterior a hoy)
    devolver VÁLIDA
```

### Validación del lote de imágenes

```
constantes: MAX_IMAGE_COUNT=5, MAX_IMAGE_BYTES=5*1024*1024,
            ALLOWED_IMAGE_FORMATS=['jpg','jpeg','png','webp']

funcion isImageValid(image, limits):
    si image.size > limits.maxBytes: devolver rechazo('size')
    extension = última parte de image.name tras '.', en minúsculas
    si extension no está en limits.allowedFormats: devolver rechazo('format')
    devolver aceptada

funcion analyzeSelection(existing, incoming, limits):
    accepted = []
    rejected = []
    for image en incoming:
        si existing.length + accepted.length >= limits.maxCount:
            rejected.push(image, 'count'); continuar
        reason = isImageValid(image, limits)
        si reason: rejected.push(image, reason)
        si no: accepted.push(image)
    devolver { accepted, rejected }
```

### Envío del formulario

```
funcion alEnviar(valores):
    # valores ya validados por el esquema (hoy inyectado)
    peticion = {
        title: valores.title,             # tal cual, sin transformar
        synopsis: valores.synopsis,
        durationMinutes: valores.durationMinutes,
        releaseDate: valores.releaseDate o omitido,
        isActive: valores.isActive        # por defecto true
    }
    intentar:
        crearPelicula(peticion, imagenes)     # servicio → lib/http
        mostrar aviso de éxito genérico
        navegar a /peliculas con marca de éxito
    capturar error:
        mostrar motivo (Alert) sin limpiar el formulario
```

## Diseño de la interfaz (mockup textual)

### Botón en el listado público (`/peliculas`)

```
┌──────────────────────────────────────────────────────────┐
│  Película                        [ + Agregar película ]   │  ← Button variant="primary"
├──────────────────────────────────────────────────────────┤
│  grid de afiches …                                        │
└──────────────────────────────────────────────────────────┘
```

- El botón se ubica en la cabecera del listado (misma fila del título), alineado
  a la derecha.
- Solo se renderiza si `tieneRol('Administrador','Gerente')`. Se muestra con
  independencia del estado del listado (cargando, error, vacío).
- Es principal: `variant="primary"` (paleta de la app).

### Pantalla de alta (`/peliculas/nueva`)

```
┌──────────────────────────────────────────────────────────┐
│  Agregar película                                          │
│  Completa los datos de la nueva película.                 │
│                                                            │
│  [Alert destructive si el servicio falla]                 │
│                                                            │
│  Título *            [_______________________________]     │
│  Sinopsis *          [_______________________________]     │
│                      [                              ]      │
│  Duración (min) *    [______]     Fecha de estreno [__/__/__]│
│  Activa              [ ● on ]                              │
│                                                            │
│  Imágenes (opcional, hasta 5)   [ Seleccionar imágenes ]   │
│  ┌────┐ ┌────┐ ┌────┐   … previsualizaciones con quitar   │
│  └────┘ └────┘ └────┘                                      │
│  (mensaje de cada imagen rechazada)                        │
│                                                            │
│  [ Guardar ]  [ Cancelar ]                                 │
└──────────────────────────────────────────────────────────┘
```

- Estructura: campos con `Form/FormField/FormItem/FormLabel/FormMessage` y
  `Input`/`Textarea`; estado con un control de activo; botonera al pie con
  «Guardar» (`variant="primary"`, deshabilitado mientras procesa) y «Cancelar»
  (`variant="outline"`).
- Imágenes: zona de selección reutilizando `ImageInput` (`multiple`,
  `acceptType`), con previsualizaciones y opción de quitar cada una. La
  validación de cantidad/tamaño/formato se aplica al seleccionar y bloquea el
  lote no conforme mostrando el motivo.

## Justificación de decisiones

- **Reutilizar `ImageInput` en lugar de un input propio.** `ImageInput` ya ofrece
  selección, arrastrar y soltar y previsualización (RNF-1). *Alternativa
  descartada:* un input `type="file"` propio (más control pero reimplementa
  previsualización y arrastre) o añadir una dependencia de subida
  (*prohibido*, Principio 1). Limitación detectada: `ImageInput` declara
  `maxNumber`/`acceptType` pero **no aplica el límite** en su implementación, por
  eso la cantidad, el tamaño y el formato se validan con funciones puras propias.
- **Ruta en el área privada (`RequireAuth` + `Demo1Layout` + `RequireRole`).**
  Reutiliza los guards existentes y su patrón (RequireRole se monta dentro de
  RequireAuth). El acceso directo sin sesión cae en `/auth/signin?next=…` y con
  rol no autorizado en `/`. *Alternativa descartada:* colgar la ruta dentro de
  `PublicoLayout` y anidar los guards ahí: rompe el patrón y expone el alta en el
  shell público.
- **Validaciones de negocio como funciones puras en `src/lib`.** Cumple el
  Principio 3 (lógica separada de interfaz) y permite razonar la regla «no
  anterior a hoy» inyectando «hoy», sin depender del reloj.
- **Aviso de éxito mediante el estado de navegación de React Router.** Se navega
  a `/peliculas` con una marca de éxito que el listado consume una vez con
  `toast.success` (genérico). *Alternativa descartada:* parámetro en la URL
  (ensucia la barra y sobrevive a recargas) o variable global mutable (oculta el
  flujo y no se limpia sola).
- **Formulario con `react-hook-form` + `zod` + `@hookform/resolvers`.** Ya están
  en el proyecto (patrón de `signin`). *Alternativa descartada:* estado manual con
  `useState`, que duplica validaciones y mensajes de error.
- **`isActive` por defecto activo en el formulario.** El valor por defecto se fija
  en los valores iniciales del formulario y se envía siempre, de modo que el
  comportamiento no depende del backend.

## Riesgos y supuestos

- Se asume que `gguzman` / `123456` tiene rol **Administrador** o **Gerente**
  (necesario para A3/A4/D). Si no, hay que aportar credenciales de un rol
  autorizado.
- Para A5 (rol `Cliente`) hacen falta credenciales de un usuario Cliente; si no
  existen, ese caso no se cubre por UI y se documenta.
- El aviso de éxito de una película creada **inactiva** no puede confirmarse por
  presencia en el listado (el catálogo solo muestra activas); se confirma por la
  respuesta de red (201) observada con el MCP. Hoy ese caso no llega a darse (ver
  la limitación conocida del backend más abajo).
- **Limitación conocida (verificada 2026-10-18).** El backend ajeno guarda toda
  película creada por multipart como **activa**: con `enableImplicitConversion`
  ignora `isActive=false`. El frontend envía `isActive=false` correctamente. Se
  acepta como limitación conocida y se reporta como requerimiento funcional al
  dueño del backend; la observación del caso «inactiva» de la spec queda
  supeditada a ese arreglo.
