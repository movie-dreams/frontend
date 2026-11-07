# Plan 002 — Página de registro de usuario

Spec: `specs/002-registro-usuario/spec.md` (aprobada).

Este plan no implementa código: define primero cómo se verificará cada requisito
y después la arquitectura, los archivos y las decisiones técnicas.

---

## 1. Estrategia de verificación (primero, test-first)

### 1.1 Entorno y comandos

- App: `npm run dev` (Vite; por defecto `http://localhost:5173`; usar el puerto
  que muestre la consola).
- API: `http://localhost:3000/api/v1` (`VITE_CINE_API_URL` del `.env`).
- Comprobaciones estáticas: `npm run typecheck`, `npm run lint`, `npm run build`.
- Verificación funcional: **MCP de Playwright**. Herramientas disponibles:
  `browser_navigate`, `browser_snapshot`, `browser_find`, `browser_type`,
  `browser_click`, `browser_press_key`, `browser_resize`, `browser_evaluate`,
  `browser_network_requests`, `browser_network_request`,
  `browser_take_screenshot`, `browser_wait_for` y
  `browser_run_code_unsafe`.
- Para simular red/errores se usa `browser_run_code_unsafe` con `page.route`
  (no existe `browser_route`).
- **Nota de fiabilidad**: en este entorno el click del MCP resultó inerte en
  varias ocasiones (ver `MEMORY.md`). Si `browser_click` no dispara el envío, se
  usa `browser_evaluate` con `form.requestSubmit()` o el click DOM, y se deja
  constancia en el reporte.
- Cada bloque se ejecuta con la sesión limpia (`localStorage.removeItem(
  'cine_token')`) salvo que el propio bloque indique lo contrario.

### 1.2 Datos de prueba

- Cuenta antigua: `gguzman` / `123456` (roles Administrador + Cliente).
- Correo único por ejecución: `registro.<timestamp>@example.com`, generado en el
  navegador con `Date.now()`.
- Contraseña de prueba: `Clave12345` (10 caracteres).
- Límites:
  - Correo normalizado de 255: `'a'.repeat(243) + '@example.com'`.
  - Correo normalizado de 256: `'a'.repeat(244) + '@example.com'`.
  - Correo de 256 con espacios exteriores que normaliza a 255:
    `' ' + 'a'.repeat(243) + '@example.com' + ' '`.
  - Contraseña de 5, 6, 100 y 101: `'A'.repeat(n)`.
- Duplicado: se reutiliza el correo creado en el bloque B (o se crea uno dentro
  del bloque C).

### 1.3 Bloques de prueba

#### Bloque A — Validaciones locales y campos

- **Objetivo**: comprobar que el formulario impide el envío con datos inválidos y
  que no genera ninguna petición de registro.
- **Pasos**:
  1. Limpiar `cine_token`, navegar a `/auth/signup`.
  2. Comprobar con snapshot que existen exactamente los campos «Correo»,
     «Contraseña», «Repite la contraseña» y el enlace a iniciar sesión.
  3. Enviar vacío y comprobar los tres mensajes de obligatoriedad.
  4. Correo `ana@` → mensaje de formato inválido.
  5. Correo de solo espacios → mensaje de obligatoriedad.
  6. Correo de 255 normalizado → no debe aparecer el error de máximo; 256 → sí.
  7. Repetir con espacios exteriores (256 que normaliza a 255) → sin error.
  8. Contraseña de 5 → error de rango; 6 → sin error; 100 → sin error; 101 →
     error de rango.
  9. Confirmación vacía → error; confirmación distinta → «no coinciden».
  10. En cada envío inválido, revisar `browser_network_requests` y confirmar que
      no hay ninguna petición a `/users`.
- **Herramientas**: `browser_navigate`, `browser_snapshot`, `browser_find`,
  `browser_type`, `browser_click`/`browser_evaluate`, `browser_wait_for`,
  `browser_network_requests`, `browser_take_screenshot`.
- **Resultado esperado**: mensajes en español junto a cada campo; ningún
  `POST /users`; el botón sigue disponible tras corregir.
- **Cubre**: RF-1, RF-8 a RF-16, RNF-4, RNF-8, RNF-10.
- **Evidencia**: captura del formulario con errores y lista de peticiones.

#### Bloque B — Registro exitoso, auto-login, sesión y destino

- **Objetivo**: recorrido completo registro → sesión iniciada → `/peliculas`.
- **Pasos**:
  1. Limpiar `cine_token` y abrir `/auth/signup?next=/peliculas/nueva` (para
     comprobar que el registro ignora `next`).
  2. Escribir el correo único con mayúsculas y espacios exteriores y la
     contraseña de prueba; enviar.
  3. Esperar la URL `/peliculas` y comprobar que **no** se navegó a `next`.
  4. Con `browser_network_requests`, verificar `POST /users` 201 y
     `POST /auth/login` 200; con `browser_network_request`, inspeccionar el body
     de `/users`: solo `email` y `password`, correo normalizado (trim +
     minúsculas) y sin `confirmPassword`.
  5. Con `browser_evaluate`, comprobar que `localStorage.getItem('cine_token')`
     tiene valor.
  6. Navegar a `/` (ruta privada) y comprobar que la identidad visible es el
     correo registrado.
  7. Recargar y comprobar que la sesión sigue activa (sigue la identidad y el
     token).
  8. Doble envío: con otra cuenta única, aplicar un retardo de ~1 s a
     `**/users` con `page.route` y hacer doble click en «Crear cuenta»; contar
     las peticiones y confirmar que solo hay un `POST /users`.
- **Herramientas**: `browser_navigate`, `browser_type`, `browser_click`,
  `browser_wait_for`, `browser_network_requests`, `browser_network_request`,
  `browser_evaluate`, `browser_run_code_unsafe`.
- **Resultado esperado**: cuenta creada, login automático, token guardado,
  identidad visible en `/`, sesión persistente tras recarga y un solo envío.
- **Cubre**: RF-17, RF-18, RF-19, RF-25, RNF-6, RNF-9.
- **Evidencia**: URL final, cuerpos de red, valor del token (sin exponerlo
  completo) y captura.

#### Bloque C — Correo duplicado

- **Objetivo**: verificar el trato del conflicto sin crear una segunda cuenta.
- **Pasos**:
  1. Limpiar `cine_token`, abrir `/auth/signup`.
  2. Enviar el correo creado en el bloque B (en mayúsculas) con otra contraseña.
  3. Comprobar el mensaje de correo ya registrado y la alerta general.
  4. Comprobar que el correo se conserva, que contraseña y confirmación quedaron
     vacías y que hay un enlace a iniciar sesión.
  5. En `browser_network_requests`: `POST /users` 409 y **ningún**
     `POST /auth/login`.
  6. Activar el enlace y comprobar que llega a `/auth/signin`.
- **Herramientas**: `browser_navigate`, `browser_type`, `browser_click`,
  `browser_snapshot`, `browser_network_requests`, `browser_evaluate`.
- **Resultado esperado**: mensaje claro, sin segunda cuenta, sin auto-login y con
  salida a iniciar sesión.
- **Cubre**: RF-20, RNF-3, RNF-8.

#### Bloque D — Red, timeout, 400 y 500 durante la creación

- **Objetivo**: comprobar los mensajes y la conservación de datos ante fallos.
- **Pasos**:
  1. Limpiar `cine_token` y abrir `/auth/signup`.
  2. **Red**: con `page.route('**/users', route => route.abort())`, enviar una
     cuenta única. Comprobar el mensaje de «no se pudo confirmar si la cuenta
     quedó creada», que los datos siguen escritos y que no hay `cine_token`.
  3. **500**: retirar la ruta anterior, aplicar
     `route.fulfill({ status: 500, body: ... })`, enviar otra cuenta única.
     Comprobar mensaje legible sin afirmar si la cuenta se creó, datos
     conservados y sin token.
  4. **400 del servicio**: `route.fulfill({ status: 400, body: { message:
     ['El correo no es válido'] } })`; comprobar mensaje legible, datos
     conservados y sin token.
  5. **Timeout**: repetir con `route.abort('timedout')` (mismo camino que la
     falta de respuesta) y comprobar el mensaje de no confirmación.
  6. Confirmar que en ningún caso se intentó navegar a `/peliculas`.
- **Herramientas**: `browser_run_code_unsafe` (`page.route`), `browser_type`,
  `browser_click`, `browser_snapshot`, `browser_evaluate`,
  `browser_network_requests`.
- **Resultado esperado**: mensajes diferenciados, datos conservados, sin sesión
  iniciada y sin navegación.
- **Cubre**: RF-21, RF-22, RF-23, RNF-3, RNF-8.

#### Bloque E — Cuenta creada y auto-login fallido

- **Objetivo**: verificar la precedencia de RF-24 y la imposibilidad de duplicar.
- **Pasos**:
  1. Limpiar `cine_token` y abrir `/auth/signup`.
  2. Con `page.route('**/auth/login', route => route.abort())`, enviar una cuenta
     única.
  3. Esperar a que `POST /users` responda 201 y a que falle el auto-login.
  4. Comprobar el aviso de «cuenta creada», que el formulario desapareció o está
     deshabilitado, que el correo se conserva, que las contraseñas quedaron
     vacías y que hay enlace a iniciar sesión.
  5. Comprobar que no existe `cine_token` y que no se repitió `POST /users`.
  6. Retirar la ruta de `/auth/login`, ir a iniciar sesión y entrar manualmente
     con el correo y la contraseña creados; comprobar que la cuenta existe.
- **Herramientas**: `browser_run_code_unsafe`, `browser_type`,
  `browser_click`, `browser_snapshot`, `browser_evaluate`,
  `browser_network_requests`.
- **Resultado esperado**: aviso de cuenta creada, sin sesión, sin reintento de
  registro y login manual posterior exitoso.
- **Cubre**: RF-24, RNF-3, RNF-8.

#### Bloque F — Login «Correo o usuario», enlaces y guard

- **Objetivo**: verificar credenciales nuevas y antiguas, enlaces y redirección.
- **Pasos**:
  1. Limpiar `cine_token` y abrir `/auth/signin`; comprobar la etiqueta «Correo o
     usuario» y la ayuda visible.
  2. Iniciar sesión con el correo del bloque B escrito en mayúsculas y con
     espacios; comprobar éxito y token.
  3. Cerrar sesión (limpiar `cine_token`), recargar y entrar con
     `gguzman` / `123456`; comprobar éxito (cuenta antigua).
  4. Con sesión de `gguzman`, abrir `/auth/signin?next=/personas` e iniciar
     sesión; comprobar que respeta `next`.
  5. Comprobar el enlace «¿No tienes cuenta? Regístrate» y, desde registro, el
     enlace «¿Ya tienes cuenta? Ingresa».
  6. Con sesión iniciada, navegar a `/auth/signup`; comprobar que redirige a
     `/peliculas` y que no se muestra el formulario.
  7. RF-2: el estado «comprobando sesión» no es observable de forma fiable porque
     la lectura del token es síncrona; se valida por revisión de código
     (`loading` inicia en `true` y la pantalla no renderiza el formulario hasta
     que termina). Se anota la limitación.
- **Herramientas**: `browser_navigate`, `browser_snapshot`, `browser_find`,
  `browser_type`, `browser_click`, `browser_evaluate`, `browser_wait_for`.
- **Resultado esperado**: ambos tipos de credencial funcionan, enlaces
  recíprocos y redirección de personas autenticadas.
- **Cubre**: RF-2 (por código), RF-3 a RF-7, RNF-5.

#### Bloque G — Responsive

- **Objetivo**: verificar que las pantallas son usables en móvil y escritorio.
- **Pasos**:
  1. Limpiar `cine_token`; `browser_resize` a 375×812; abrir `/auth/signup` y
     `/auth/signin`.
  2. Comprobar que las etiquetas y campos son visibles, que no hay desborde
     horizontal (`document.documentElement.scrollWidth <= window.innerWidth`) y
     que un error de validación se lee sin recortes.
  3. Repetir a 1440×900.
  4. Capturas de cada tamaño.
- **Herramientas**: `browser_resize`, `browser_navigate`, `browser_snapshot`,
  `browser_evaluate`, `browser_take_screenshot`.
- **Resultado esperado**: sin desbordes, campos y mensajes visibles y usables.
- **Cubre**: RNF-1, RNF-2, RNF-11.

### 1.4 Limpieza de datos de prueba

- Cada ejecución usa correos únicos para no chocar con cuentas existentes.
- Los identificadores creados se capturan de las respuestas de `POST /users`.
- Como utilidad **solo de verificación**, se puede llamar a `DELETE /users/:id`
  con `browser_run_code_unsafe` (`page.request.delete(...)`). Ese endpoint está
  público por el riesgo conocido del backend; la feature **no depende** de él.
  Si la limpieza falla, se dejan las cuentas de prueba y se anotan en el reporte.
- No se usa `DELETE` para probar la feature ni se incorpora a la aplicación.

---

## 2. Estructura de archivos

### Nuevos

| Archivo | Responsabilidad |
| --- | --- |
| `src/lib/credentials.ts` | Helpers puros `normalizeEmail` y `normalizeCredential`: recorte de espacios y minúsculas para correo; minúsculas solo si la credencial contiene `@`. Sin red, sin reloj. |
| `src/auth/forms/signup-schema.ts` | Esquema zod del registro: correo normalizado, formato, máximo 255; contraseña 6–100; confirmación obligatoria e igual. Mensajes en español. |

### Modificados

| Archivo | Cambio |
| --- | --- |
| `src/auth/pages/signup-page.tsx` | Reescritura: formulario correo/contraseña/confirmación, guard de sesión, envío, auto-login, errores, estado «cuenta creada» y enlaces. |
| `src/auth/pages/signin-page.tsx` | Etiqueta «Correo o usuario», ayuda visible, normalización de la credencial y enlace a registro; conserva `next`. |
| `src/auth/forms/signin-schema.ts` | Mensaje del campo a «Ingresa tu correo o usuario». |
| `src/types/seguridad.ts` | `CrearUsuario` pasa a `{ email, password }`; `ActualizarUsuario` se define aparte con `{ id?, username?, password? }`. |
| `src/services/usuario.service.ts` | Actualizar el comentario del contrato de `POST /users` (el cuerpo ya se envía tal cual); sin cambios de comportamiento. |
| `src/components/common/screen-loader.tsx` | Texto «Loading...» → «Cargando…» para cumplir el idioma de la interfaz. |
| `MEMORY.md` | Cierre del ciclo: decisiones, resultados y limitaciones. |

### Eliminado

| Archivo | Motivo |
| --- | --- |
| `src/auth/forms/signup-shema.ts` | Se reemplaza por `signup-schema.ts` (corrección de la errata). El import se actualiza en la pantalla. |

### Sin cambios (deliberado)

- `src/auth/auth-routes.tsx`: la ruta pública `signup` ya existe.
- `src/auth/providers/local-auth-provider.tsx`: `login` ya guarda `cine_token` y
  setea el usuario; se reutiliza.
- `src/services/auth.service.ts`: no se toca la clave ni la forma del token.
- `src/auth/layouts/branded.tsx`, `src/auth/require-auth.tsx`,
  `src/auth/require-role.tsx`: se reutilizan.
- Backend `cinema`: no se modifica.

---

## 3. Determinismo (helpers puros)

`src/lib/credentials.ts`:

```ts
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeCredential(value: string): string {
  const trimmed = value.trim();
  return trimmed.includes('@') ? trimmed.toLowerCase() : trimmed;
}
```

- `normalizeEmail`: recorta extremos y pasa a minúsculas. Se usa en el esquema
  zod y en el envío; el correo normalizado es el que se mide contra 255.
- `normalizeCredential`: recorta extremos; solo pasa a minúsculas si contiene
  `@`. Un nombre de usuario antiguo conserva mayúsculas y se envía tal cual
  (después del recorte).
- Ambas son deterministas, sin reloj, sin red y sin efectos secundarios.
- El auto-login **no** usa `normalizeCredential`: usa el `username` normalizado
  que devuelve el registro (RF-18).

---

## 4. Algoritmos

### 4.1 Guard de la pantalla de registro

```text
const { loading, isAuthenticated, login } = useAuth()

si loading -> mostrar ScreenLoader (sin formulario)
si isAuthenticated -> <Navigate to="/peliculas" replace />
si accountCreated -> mostrar aviso de cuenta creada (sin formulario)
en otro caso -> mostrar formulario
```

### 4.2 Envío del registro

```text
onSubmit({ email, password }):
  si submitting -> salir                    // evita doble envío
  submitting = true
  formError = null

  intentar:
    usuario = usuarioService.crear({ email, password })   // email ya normalizado
  capturar error:
    si HttpError.status === 409:
      conservar correo; limpiar password y confirmación
      formError = "Ese correo ya está registrado. Inicia sesión o usa otro correo."
    si HttpError.status === 400:
      formError = mensaje legible del servicio
      conservar todos los datos
    si error no es HttpError o status === undefined:   // red / timeout
      formError = "No pudimos confirmar si tu cuenta quedó creada..."
      conservar todos los datos
    si otro status (5xx/inesperado):
      formError = "No se pudo completar el registro..."
      conservar todos los datos
    submitting = false
    salir

  // La cuenta ya existe: cualquier fallo desde aquí es RF-24, no RF-22/23
  intentar:
    await login(usuario.username, password)
    navigate('/peliculas', { replace: true })
  capturar:
    accountCreated = usuario.username || email
    limpiar password y confirmación
    // el componente deja de renderizar el formulario
  finalmente:
    submitting = false
```

Notas:

- El guard de `submitting` + `disabled` del botón cubre RF-25.
- El correo que se conserva en 409 es el valor del formulario (normalizado).
- En el aviso de cuenta creada se muestra el correo y un enlace a
  `/auth/signin`; no se ofrece «reintentar registro».

### 4.3 Inicio de sesión

```text
onSubmit({ usuario, contrasena }):
  credencial = normalizeCredential(usuario)
  await login(credencial, contrasena)
  navigate(searchParams.get('next') || '/peliculas')
```

---

## 5. Diseño de la interfaz

### Registro (`/auth/signup`, layout `BrandedLayout`, Card 400 px)

- Título «Crear cuenta» y subtítulo «Regístrate para reservar tus butacas».
- Campo **Correo**: `type="email"`, `autoComplete="email"`, etiqueta «Correo».
- Campo **Contraseña**: `type="password"`, `autoComplete="new-password"`, ayuda
  «Entre 6 y 100 caracteres», botón de ojo para mostrar/ocultar.
- Campo **Repite la contraseña**: `type="password"`, `autoComplete="new-password"`,
  mismo control de ojo.
- Errores de campo con `FormMessage` (debajo del campo correspondiente).
- Alerta general (`Alert variant="destructive"`) para 409, 400, red e
  inesperado; el mensaje de 409 incluye enlace a `/auth/signin`.
- Botón «Crear cuenta»; durante el envío, `Spinner` + «Creando cuenta…» y botón
  deshabilitado.
- Estado «cuenta creada»: se sustituye el formulario por una alerta visible
  («Tu cuenta quedó creada. Inicia sesión para continuar.») con el correo y un
  enlace/ botón «Iniciar sesión».
- Pie: «¿Ya tienes cuenta? Ingresa» → `/auth/signin`.
- Mientras `loading`: `ScreenLoader`. Si autenticada: redirección a
  `/peliculas`.

### Inicio de sesión (`/auth/signin`)

- Etiqueta del campo: «Correo o usuario».
- Ayuda visible bajo la etiqueta: «Puedes entrar con el correo de tu cuenta
  nueva o con el nombre de usuario de tu cuenta antigua.»
- Se conserva el botón de ojo, el estado de carga y el destino `next`.
- Pie: «¿No tienes cuenta? Regístrate» → `/auth/signup`.

### Reutilización

`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`,
`FormMessage`, `Input`, `Button`, `Alert`, `AlertIcon`, `AlertTitle`, `Spinner`,
`ScreenLoader`, iconos `Eye`/`EyeOff`/`AlertCircle` y la paleta existente. No se
introduce un lenguaje visual nuevo (RNF-1).

---

## 6. Justificación de decisiones

| Decisión | Alternativa descartada | Porqué |
| --- | --- | --- |
| Reutilizar `/auth/signup` y su layout. | Crear `/auth/register` o una pantalla nueva. | La ruta pública y el layout ya existen; evita duplicar navegación, estilo y enlaces, y cumple la decisión del usuario. |
| Formulario correo + contraseña + confirmación. | Mantener el formulario rico (nombres, documento, etc.) o quitar la confirmación. | El backend crea la cuenta solo con correo; el usuario aprobó expresamente mantener la confirmación como control local. |
| Usar `usuarioService.crear` desde la pantalla. | Llamar a axios o escribir la URL en la pantalla. | Respeta la arquitectura `pantalla → servicio → lib/http → config/env`; la pantalla no conoce URLs ni HTTP. |
| Cambiar `CrearUsuario` a `{ email, password }` y separar `ActualizarUsuario`. | Mantener `{ id, username, password }` o usar `Partial<CrearUsuario>`. | El contrato público de creación es correo + contraseña; el DTO de actualización es distinto (id/username/password opcionales) y no debe heredar del de creación. `usuarioService` no tiene otros consumidores actuales. |
| Auto-login con `useAuth().login(usuario.username, password)`. | Guardar el token a mano o duplicar la lógica de `localStorage`. | Reutiliza la sesión, el interceptor y la clave `cine_token`; no cambia la forma del dato ni duplica código. |
| Helper `normalizeCredential` en `src/lib`. | Normalizar en la pantalla o no normalizar. | Hace determinista y reutilizable la regla; permite correo nuevo con mayúsculas/espacios sin romper nombres de usuario antiguos. |
| Esquema zod nuevo en `signup-schema.ts` (renombrado). | Mantener `signup-shema.ts` con el nombre erróneo o validar a mano. | El archivo se reescribe por completo; corregir la errata no añade riesgo y el import se actualiza en el mismo cambio. |
| `loading`/`isAuthenticated` antes de renderizar el formulario. | Mostrar el formulario y redirigir después. | Evita que una persona autenticada vea o envíe el registro mientras se resuelve la sesión. |
| Mapear errores por `HttpError.status`. | Un único mensaje genérico para todo. | Permite distinguir duplicado, validación, red/timeout e inesperado, y conservar o limpiar los datos según la spec. |
| Destino fijo `/peliculas` tras el registro. | Reutilizar `next` como en el login. | Decisión aprobada: el registro siempre termina en el listado; `next` es propio del login. |
| Cambiar el texto de `ScreenLoader` a «Cargando…». | Dejarlo en inglés o crear un loader local. | Es el estado visible de esta pantalla y RNF-2 exige español; el cambio es una línea y no altera la lógica compartida. |
| Sin dependencias nuevas ni cambios de backend. | Añadir una librería de formularios o tocar el backend. | El stack actual cubre la necesidad y el backend no se modifica. |

---

## 7. Riesgos y dependencias

- **Backend con operaciones de usuarios públicas**: `GET/PATCH/DELETE /users`
  quedaron accesibles al habilitar `POST /users`. La feature solo usa
  `POST /users` y `POST /auth/login`; no depende del resto. `DELETE` se usa
  únicamente como utilidad de limpieza y se reporta el riesgo al responsable.
- **`POST /users` debe seguir siendo público**: es la dependencia funcional de
  la feature; el arreglo de seguridad debe preservarlo.
- **Sesión**: se reutiliza `authService`/`localStorage` con la clave `cine_token`.
  No se cambia la clave ni la forma del token; el auto-login pasa por
  `useAuth().login`.
- **Datos de prueba**: el registro público puede estar limitado por rate limit;
  se usan pocos intentos y correos únicos.
- **Playwright**: el click puede ser inerte; se prevé el fallback DOM. Los
  bloqueos de red con `page.route` deben retirarse al terminar cada escenario.
- **`ScreenLoader` compartido**: el cambio de texto afecta también a los guards,
  pero solo en el idioma; no cambia comportamiento.
- **Sin dependencias nuevas** y **sin cambios en el backend**.

---

## 8. Trazabilidad RF → bloques → archivos

| RF / RNF | Bloque(s) | Archivo(s) principal(es) |
| --- | --- | --- |
| RF-1 | A, F | `signup-page.tsx` |
| RF-2 | F (revisión de código) | `signup-page.tsx`, `auth-context.ts` |
| RF-3 | F | `signup-page.tsx` |
| RF-4 | A, F | `signup-page.tsx` |
| RF-5 | F | `signin-page.tsx` |
| RF-6 | F | `signin-page.tsx` |
| RF-7 | F | `signin-page.tsx`, `credentials.ts` |
| RF-8 a RF-15 | A | `signup-schema.ts`, `signup-page.tsx` |
| RF-16 | A, B | `signup-schema.ts`, `signup-page.tsx`, `usuario.service.ts` |
| RF-17 | B | `signup-page.tsx`, `usuario.service.ts`, `seguridad.ts` |
| RF-18 | B | `signup-page.tsx`, `local-auth-provider.tsx` |
| RF-19 | B, F | `signup-page.tsx` |
| RF-20 | C | `signup-page.tsx` |
| RF-21 | D | `signup-page.tsx` |
| RF-22 | D | `signup-page.tsx` |
| RF-23 | D | `signup-page.tsx` |
| RF-24 | E | `signup-page.tsx` |
| RF-25 | B | `signup-page.tsx` |
| RNF-1 | G | `signup-page.tsx`, `branded.tsx` |
| RNF-2 | A, F, G | `signup-page.tsx`, `signin-page.tsx`, `signup-schema.ts`, `screen-loader.tsx` |
| RNF-3 | C, D, E | `signup-page.tsx` |
| RNF-4 | A | `signup-schema.ts`, `signup-page.tsx` |
| RNF-5 | F | `signup-page.tsx`, `signin-page.tsx` |
| RNF-6 | B | `signup-page.tsx`, `local-auth-provider.tsx` |
| RNF-7 | Estático | Sin cambios de dependencias ni backend |
| RNF-8 | A, C, D, E | `signup-page.tsx` |
| RNF-9 | B | `signup-page.tsx` |
| RNF-10 | A, G | `signup-page.tsx`, `signup-schema.ts` |
| RNF-11 | G | `signup-page.tsx`, `signin-page.tsx` |

---

## 9. Orden de implementación

1. Contrato de tipos/servicio y helper/esquema en paralelo.
2. Pantalla de registro (estructura/validación y luego envío/auto-login/errores)
   y pantalla de login en paralelo.
3. Verificación estática.
4. Bloques Playwright A → B/C → D/E → F/G.
5. Cierre de `MEMORY.md` y marcado de tareas.
