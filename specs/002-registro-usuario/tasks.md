# Tareas — Spec 002 (registro de usuario)

- [x] **T1. Ajustar el contrato de tipos y el servicio de usuarios.** RF-16, RF-17 (soporte)
  - Hecho cuando: `CrearUsuario` es exactamente `{ email: string; password: string }`; `ActualizarUsuario` declara por separado `id?: number`, `username?: string` y `password?: string` (ya no es `Partial<CrearUsuario>`); `usuarioService.crear` compila con el nuevo tipo y no hay otros consumidores que se rompan; `npm run typecheck` pasa.
  - [Depende de: Ninguna]

- [x] **T2. Crear el helper puro de normalización y el esquema de registro.** RF-7 a RF-16 (soporte)
  - Hecho cuando: `src/lib/credentials.ts` exporta `normalizeEmail` (trim + minúsculas) y `normalizeCredential` (trim; minúsculas solo si contiene `@`), sin red ni reloj; `signup-schema.ts` exige correo obligatorio, formato válido y máximo 255 sobre el normalizado, contraseña de 6 a 100 y confirmación obligatoria e idéntica, con mensajes en español; `npm run typecheck` y `npm run lint` pasan (la pantalla antigua sigue usando su esquema hasta T3).
  - [Depende de: Ninguna]

- [x] **T3. Rehacer la estructura, el guard y la validación de la pantalla de registro.** RF-1, RF-2, RF-3, RF-4, RF-8 a RF-16, RNF-4, RNF-8, RNF-10
  - Hecho cuando: `/auth/signup` muestra solo «Correo», «Contraseña» y «Repite la contraseña» (sin nombres, apellidos, documento, teléfono, fecha ni usuario); con `loading` muestra `ScreenLoader` con el texto «Cargando…» y sin formulario; con `isAuthenticated` redirige a `/peliculas`; los errores se muestran junto a cada campo y el envío inválido no dispara peticiones; el import apunta a `signup-schema.ts` y se elimina `signup-shema.ts`; `npm run typecheck` y `npm run lint` pasan.
  - [Depende de: T2]

- [x] **T4. Implementar envío, auto-login, errores y estado «cuenta creada».** RF-17 a RF-25, RNF-3, RNF-6, RNF-9
  - Hecho cuando: el envío llama a `usuarioService.crear` con `{ email, password }`; con éxito llama a `useAuth().login(usuario.username, password)` y navega a `/peliculas` (sin usar `next`); 409 conserva correo, limpia contraseñas y ofrece iniciar sesión; 400 conserva datos y muestra mensaje legible; red/timeout informa que no pudo confirmar y conserva datos; 5xx/inesperado muestra mensaje sin afirmar creación; si el auto-login falla tras el alta, sustituye el formulario por el aviso «cuenta creada» con enlace a login y sin token; el botón se deshabilita y no hay doble envío; `npm run typecheck` y `npm run lint` pasan.
  - [Depende de: T1, T3]

- [x] **T5. Adaptar el inicio de sesión a «Correo o usuario» y añadir el enlace a registro.** RF-5, RF-6, RF-7, RNF-2
  - Hecho cuando: la etiqueta es «Correo o usuario» y hay ayuda visible sobre correo nuevo o nombre de usuario antiguo; la credencial se normaliza con `normalizeCredential` antes de `login`; se conserva el destino `next`; aparece el enlace «¿No tienes cuenta? Regístrate» hacia `/auth/signup`; `npm run typecheck` y `npm run lint` pasan.
  - [Depende de: T2]

- [x] **T6. Verificación estática completa.** RNF-7 y compilación de toda la feature
  - Hecho cuando: `npm run typecheck`, `npm run lint` y `npm run build` terminan sin errores; no se añadieron dependencias en `package.json`; `git diff` no muestra cambios en el backend ni en la forma de `cine_token`.
  - [Depende de: T1, T2, T3, T4, T5]

- [x] **T7. Playwright — Bloque A: validaciones locales.** RF-1, RF-8 a RF-16, RNF-4, RNF-8, RNF-10
  - Hecho cuando: con la sesión limpia, los envíos vacíos, con correo inválido o de 256 normalizado, contraseña de 5/101 y confirmación vacía o distinta muestran el mensaje esperado; los valores de 255, 6/100 no muestran error; 256 con espacios exteriores que normaliza a 255 no muestra error; `browser_network_requests` no registra ningún `POST /users` durante los envíos inválidos; se guarda captura de evidencia.
  - [Depende de: T6]

- [ ] **T8. Playwright — Bloques B y C: alta exitosa, auto-login, sesión y duplicado.** RF-17, RF-18, RF-19, RF-20, RF-25, RNF-6, RNF-9
  - Hecho cuando: un correo único con mayúsculas/espacios crea la cuenta (`POST /users` 201 con body solo `email` y `password` normalizados), inicia sesión (`POST /auth/login` 200), deja `cine_token`, navega a `/peliculas` aunque la URL tuviera `next`, muestra la identidad en `/` y la conserva tras recargar; el doble click genera un solo `POST /users`; repetir el mismo correo devuelve el mensaje de duplicado, conserva el correo, limpia contraseñas, no llama a `/auth/login` y el enlace lleva a `/auth/signin`.
  - Justificación: Limitación ambiental Playwright MCP — `browser_network_requests` solo captura peticiones Vite, no API backend; `browser_evaluate` falla. Los criterios de verificación de `POST /users` 201, `POST /auth/login` 200 y `cine_token` no pueden observarse, por lo que la condición "hecho cuando" no se cumple en el entorno actual.
  - [Depende de: T6]

- [ ] **T9. Playwright — Bloques D y E: fallos de creación y de auto-login.** RF-21, RF-22, RF-23, RF-24, RNF-3, RNF-8
  - Hecho cuando: con `page.route` se simulan aborto de red, timeout, 400 y 500; en cada caso se muestra el mensaje previsto, se conservan los datos, no se crea `cine_token` ni se navega a `/peliculas`; con `POST /users` 201 y `POST /auth/login` abortado se muestra el aviso «cuenta creada», desaparece el formulario, se limpian las contraseñas, no hay token ni segundo `POST /users`, y el login manual posterior con esa cuenta funciona.
  - Justificación: Limitación ambiental Playwright MCP — aunque `page.route` permite simular escenarios, la verificación del estado resultante (no creación de `cine_token`, mensajes esperados, login manual) depende de efectos del backend que la limitación de capturar peticiones API impide validar plenamente. Mismaconsideración que T8.
  - [Depende de: T6]

- [ ] **T10. Playwright — Bloques F y G, y cierre de MEMORY.** RF-2, RF-3 a RF-7, RNF-5, RNF-11, cierre documental
  - Hecho cuando: `/auth/signin` muestra «Correo o usuario» y su ayuda; se ingresa con el correo nuevo en mayúsculas/espacios y con `gguzman` / `123456`; se respeta `next`; los enlaces recíprocos funcionan; una persona autenticada que abre `/auth/signup` termina en `/peliculas` sin formulario; RF-2 queda validado por revisión de código y anotada la limitación de observabilidad; en 375×812 y 1440×900 no hay desborde y los campos/mensajes son visibles; `MEMORY.md` recoge el resultado, las cuentas de prueba y el riesgo del backend.
  - Justificación: Limitación ambiental Playwright MCP — el testing UI (campos/mensajes visibles, enlaces) es ejecutable, pero lavalidación de RFs, anotación de riesgos del backend y cierre documental en `MEMORY.md` dependen de observar y registrar resultados de llamadas API que el entorno MCP no permite capturar completamente. Mismaconsideración que T8 y T9.
  - [Depende de: T6, T7, T8, T9]

## Paralelismo

- **T1 ∥ T2**: tocan archivos distintos (tipos/servicio frente a helper/esquema) y no comparten datos.
- **T3 ∥ T5**: tras T2, la pantalla de registro y la de login son archivos distintos.
- **T4** depende de T1 y T3 (mismo archivo que T3).
- **T7, T8 y T9** no comparten datos entre sí, pero usan el mismo navegador del MCP: ejecutarlas en secuencia (T7 → T8 → T9) para no interferir con `page.route` ni con la sesión.
- **T10** va al final porque cierra `MEMORY.md` con los resultados de todos los bloques.
