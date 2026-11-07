# Spec 002 — Página de registro de usuario

Estado: aprobada

## Contexto y objetivo

Hoy la aplicación permite iniciar sesión, pero el flujo de registro no se ajusta
a lo que el servicio necesita: la pantalla de registro existente **ya crea una
cuenta completa** (persona, cliente activo, usuario con contraseña cifrada y rol
de cliente) a partir de los datos personales que pide, pero solicita datos
personales innecesarios (nombres, apellidos, documento, teléfono y fecha de
nacimiento), **no inicia sesión automáticamente** y termina pidiendo a la
persona que ingrese a mano. Además, no está enlazada desde el inicio de sesión.

La operación de personas del servicio sigue aceptando esos datos opcionales; el
problema no es que el servicio los necesite, sino que el flujo de registro de la
interfaz los pide sin aportar valor a la cuenta.

El objetivo es que una persona pueda **crear su cuenta con correo y contraseña**
y quedar **con la sesión iniciada automáticamente**, sin pasos intermedios, para
empezar a usar la aplicación. La cuenta creada queda asociada al rol de cliente
del servicio. También se busca que el registro y el inicio de sesión estén
conectados entre sí mediante enlaces recíprocos y que el inicio de sesión acepte
tanto el correo de las cuentas nuevas como el nombre de usuario de las antiguas,
para no romper a las personas ya registradas.

## Usuarios

- **Visitante anónimo**: persona sin sesión que puede registrarse para obtener
  una cuenta.
- **Persona autenticada**: ya tiene sesión iniciada; no debe crear otra cuenta
  desde la pantalla de registro.
- **Cliente**: rol que el servicio asigna a toda cuenta creada desde este
  registro; puede comprar entradas como cualquier cliente existente.
- **Persona con cuenta antigua**: se registró antes de este cambio y conserva su
  nombre de usuario como credencial de acceso; su forma de ingresar no cambia.

## Historias de usuario

- HU-1. Como visitante anónimo, quiero crear una cuenta indicando mi correo y
  una contraseña (con confirmación local), para empezar a usar la aplicación sin
  trámites innecesarios.
- HU-2. Como visitante que acaba de registrarse, quiero quedar con la sesión
  iniciada automáticamente, para no tener que escribir mis credenciales otra vez.
- HU-3. Como visitante, quiero que la pantalla me avise si mi correo ya tiene
  una cuenta, para ir a iniciar sesión en lugar de intentar registrarme de nuevo.
- HU-4. Como visitante, quiero saber cuando mi cuenta sí quedó creada pero no se
  pudo iniciar la sesión, para poder ingresar manualmente sin repetir el registro.
- HU-5. Como persona registrada, quiero poder pasar del registro al inicio de
  sesión y viceversa mediante enlaces visibles, para elegir la opción que necesito.
- HU-6. Como visitante, quiero que la pantalla me indique qué corregir antes de
  enviar el formulario, para no perder tiempo en intentos fallidos.
- HU-7. Como persona con una cuenta antigua, quiero seguir ingresando con mi
  nombre de usuario para no perder el acceso a mi cuenta.

## Definiciones

- **Cuenta**: registro de usuario que permite iniciar sesión con correo y
  contraseña. Toda cuenta creada aquí recibe el rol de cliente. Las cuentas
  creadas antes de este cambio pueden iniciar sesión con su nombre de usuario.
- **Correo**: dirección de correo electrónico que identifica las cuentas nuevas y
  sirve como credencial de acceso. El servicio la normaliza (sin espacios
  sobrantes y sin distinguir mayúsculas de minúsculas).
- **Correo normalizado**: forma del correo sin espacios exteriores y en
  minúsculas. La interfaz aplica ese mismo recorte y conversión al validar y
  enviar el correo, y el servicio devuelve esa misma forma; se usa para medir el
  límite de longitud y para el inicio de sesión automático.
- **Nombre de usuario**: credencial de las cuentas antiguas; se sigue aceptando en
  la pantalla de inicio de sesión.
- **Contraseña**: clave secreta de la cuenta, de 6 a 100 caracteres.
- **Confirmación de contraseña**: segundo valor que la persona escribe para
  verificar que la contraseña no tiene errores. Es solo de control local y nunca
  se envía al servicio.
- **Inicio de sesión automático**: inicio de sesión que el sistema realiza
  inmediatamente después de crear la cuenta, con las mismas credenciales
  registradas.
- **Sesión activa**: estado que permite usar la aplicación como persona
  autenticada y que persiste igual que un inicio de sesión normal.
- **Pantalla de registro**: ruta pública existente para crear una cuenta.
- **Pantalla de inicio de sesión**: ruta pública existente para ingresar con una
  cuenta creada.

## Decisiones de negocio

- Se **mantiene** el campo de confirmación de contraseña en el registro; fue
  consultado y aprobado por el usuario (solo control local, nunca se envía).
- La credencial de la pantalla de inicio de sesión se etiqueta **«Correo o
  usuario»** y explica que se puede ingresar con el correo de las cuentas nuevas
  o con el nombre de usuario de las cuentas antiguas; fue aprobado por el usuario.
- El inicio de sesión acepta ambas credenciales **sin cambiar la lógica de
  autenticación existente**; solo se normaliza la credencial escrita.
- El destino después de un registro exitoso es **siempre el listado de
  películas**; el registro no usa el parámetro `next` del inicio de sesión.
- Una persona con sesión iniciada que abre el registro se redirige al listado de
  películas.
- Ante un fallo sin creación de cuenta confirmada se conservan los datos
  introducidos; se limpian las contraseñas cuando el correo ya está registrado
  (RF-20) o cuando la cuenta quedó creada (RF-24).

## Requisitos funcionales

- RF-1: CUANDO una persona sin sesión iniciada abre la pantalla pública de
  registro, EL SISTEMA muestra un formulario con los campos correo, contraseña y
  confirmación de contraseña.
- RF-2: MIENTRAS el sistema todavía comprueba si existe una sesión iniciada, EL
  SISTEMA no muestra el formulario de registro ni permite envíos.
- RF-3: SI una persona con sesión iniciada abre la pantalla de registro,
  ENTONCES EL SISTEMA no muestra el formulario y la redirige al listado de
  películas. Decisión explícita: se redirige en lugar de mostrar un aviso.
- RF-4: MIENTRAS la pantalla de registro está visible, EL SISTEMA muestra un
  enlace para ir a la pantalla de inicio de sesión.
- RF-5: CUANDO la persona está en la pantalla de inicio de sesión, EL SISTEMA
  muestra un enlace «¿No tienes cuenta? Regístrate» que la lleva a la pantalla
  de registro.
- RF-6: MIENTRAS la pantalla de inicio de sesión está visible, EL SISTEMA
  etiqueta el campo de credencial como «Correo o usuario» y muestra una ayuda
  visible indicando que se puede entrar con el correo de las cuentas nuevas o
  con el nombre de usuario de las cuentas antiguas.
- RF-7: CUANDO la persona envía sus credenciales en la pantalla de inicio de
  sesión, EL SISTEMA la autentica tanto si ingresa el correo de una cuenta nueva
  como si ingresa el nombre de usuario de una cuenta antigua.
- RF-8: SI el correo está vacío o contiene únicamente espacios, ENTONCES EL
  SISTEMA impide enviar el formulario y muestra que el correo es obligatorio.
- RF-9: SI el correo no tiene un formato de correo válido, ENTONCES EL SISTEMA
  impide enviar el formulario y muestra que debe indicar un correo válido.
- RF-10: SI el correo normalizado (sin espacios exteriores y en minúsculas)
  supera los 255 caracteres, ENTONCES EL SISTEMA impide enviar el formulario e
  informa que el máximo es de 255 caracteres.
- RF-11: EL SISTEMA ignora los espacios al inicio y al final del correo y no
  distingue mayúsculas de minúsculas al validarlo y enviarlo; el inicio de sesión
  automático funciona aunque el correo se haya escrito con mayúsculas o con
  espacios sobrantes.
- RF-12: SI la contraseña está vacía, ENTONCES EL SISTEMA impide enviar el
  formulario y muestra que la contraseña es obligatoria.
- RF-13: SI la contraseña tiene menos de 6 o más de 100 caracteres, ENTONCES EL
  SISTEMA impide enviar el formulario e informa que debe tener entre 6 y 100
  caracteres.
- RF-14: SI la confirmación de contraseña está vacía, ENTONCES EL SISTEMA impide
  enviar el formulario y muestra que la confirmación es obligatoria.
- RF-15: SI la confirmación de contraseña no coincide exactamente con la
  contraseña, ENTONCES EL SISTEMA impide enviar el formulario e informa que las
  contraseñas no coinciden.
- RF-16: EL SISTEMA envía al servicio únicamente el correo y la contraseña y no
  pide nombres, apellidos, documento, teléfono, fecha de nacimiento ni rol; la
  confirmación de contraseña es solo control local y nunca se envía.
- RF-17: CUANDO la persona envía el formulario con datos válidos, EL SISTEMA
  solicita la creación de la cuenta con el correo y la contraseña indicados.
- RF-18: CUANDO la creación de la cuenta finaliza con éxito, EL SISTEMA inicia
  sesión automáticamente con la cuenta recién creada, usando el correo
  normalizado que devuelve el registro.
- RF-19: CUANDO el inicio de sesión automático finaliza con éxito, EL SISTEMA
  deja la sesión activa con la misma persistencia y forma que un inicio de sesión
  normal, y lleva a la persona al listado de películas.
- RF-20: SI el correo ya está registrado, ENTONCES EL SISTEMA muestra un mensaje
  claro de que el correo ya está registrado, no crea una segunda cuenta, no
  intenta iniciar sesión, conserva el correo introducido, limpia las contraseñas
  y ofrece un enlace para ir a iniciar sesión.
- RF-21: SI el servicio rechaza los datos enviados por no cumplir sus reglas de
  validación, ENTONCES EL SISTEMA muestra un mensaje legible, no crea la cuenta,
  no inicia sesión y conserva el correo y la contraseña introducidos para
  permitir reintentar.
- RF-22: SI ocurre un error de red o el servicio no responde a tiempo **durante
  la solicitud de creación de la cuenta**, ENTONCES EL SISTEMA informa que **no
  pudo confirmar** si la cuenta quedó creada, conserva los datos introducidos y
  no deja una sesión iniciada; si un reintento devuelve que el correo ya está
  registrado, lo conduce a iniciar sesión (RF-20).
- RF-23: SI ocurre un error no previsto del servicio **durante la solicitud de
  creación de la cuenta**, ENTONCES EL SISTEMA muestra un mensaje legible sin
  afirmar si la cuenta se creó o no, conserva los datos introducidos y no deja
  una sesión iniciada a medias.
- RF-24: SI la creación de la cuenta finaliza con éxito pero el inicio de sesión
  automático falla, ENTONCES EL SISTEMA informa que la cuenta quedó creada, no
  vuelve a registrar la cuenta, sustituye o deshabilita el formulario por un
  aviso de «cuenta creada» con un enlace para ir a iniciar sesión (para que no se
  pueda reintentar el registro y provocar un duplicado), conserva el correo,
  limpia las contraseñas y no deja una sesión iniciada.
  Nota de precedencia: si la cuenta ya se creó correctamente, aplica RF-24 y no
  RF-22/RF-23, aunque el fallo posterior sea de red o del servicio durante el
  inicio de sesión automático.
- RF-25: MIENTRAS la operación de registro y el inicio de sesión automático están
  en curso, EL SISTEMA muestra un estado de carga visible y evita envíos
  duplicados, aunque la persona pulse varias veces el botón.

## Requisitos no funcionales

- RNF-1: La pantalla de registro reutiliza el diseño, los componentes y la paleta
  de colores ya existentes en la aplicación; no introduce un lenguaje visual
  nuevo.
- RNF-2: La interfaz, las etiquetas, los textos de validación, la ayuda de
  credenciales y los mensajes de error se presentan en español.
- RNF-3: Los mensajes de error indican con claridad qué corregir y no exponen
  detalles técnicos del servicio.
- RNF-4: La validación de los campos es inmediata en la pantalla, antes de enviar
  cualquier solicitud al servicio.
- RNF-5: La pantalla es de acceso público y no exige sesión iniciada; una persona
  ya autenticada no puede usarla para crear otra cuenta.
- RNF-6: La sesión resultante del registro automático es compatible con las
  sesiones existentes: se conserva y se comporta igual que un inicio de sesión
  normal, sin cambiar la forma en que la aplicación guarda la sesión.
- RNF-7: La feature no añade dependencias ni requiere cambios en el backend para
  funcionar; el endurecimiento de seguridad descrito en las notas es una
  recomendación para el responsable del servicio, no un requisito de esta feature.
- RNF-8: Los errores de campo (correo, contraseña y confirmación) se muestran
  junto al campo correspondiente; los errores de formulario (correo ya
  registrado, rechazo de validación del servicio, error de red o error no
  previsto) se muestran en una alerta general visible.
- RNF-9: El botón de envío refleja el estado de la operación (en curso o
  disponible) y permanece deshabilitado mientras la operación no termine.
- RNF-10: Los campos tienen etiquetas asociadas y los errores se muestran junto
  al campo correspondiente, de modo que la pantalla sea comprensible con lector
  de pantalla y navegación por teclado.
- RNF-11: La pantalla funciona correctamente en móvil y en escritorio; su
  verificación se realiza con el MCP de Playwright en ambos tamaños.

## Casos límite

- Correo vacío.
- Correo compuesto únicamente por espacios.
- Correo con formato inválido (sin arroba, sin dominio o con caracteres no
  admitidos).
- Correo normalizado de exactamente 255 caracteres (permitido) y de 256
  caracteres (rechazado).
- Correo de 256 caracteres con espacios exteriores que normaliza a 255
  (permitido).
- Correo escrito con mayúsculas y/o con espacios al inicio o al final: se
  normaliza y el inicio de sesión automático funciona.
- Contraseña de 5 caracteres (rechazada), de 6 (permitida), de 100 (permitida) y
  de 101 (rechazada).
- Contraseña compuesta únicamente por espacios de 6 o más caracteres: el
  servicio la acepta (limitación heredada del contrato; no se añade validación
  nueva en la interfaz).
- Confirmación vacía.
- Confirmación distinta de la contraseña, incluida una diferencia solo de
  mayúsculas o de espacios.
- Correo que ya pertenece a una cuenta registrada.
- Fallo de red o falta de respuesta del servicio antes de confirmar la creación.
- Cuenta creada pero inicio de sesión automático fallido.
- Doble clic o pulsaciones repetidas en «Crear cuenta».
- Persona con sesión iniciada que abre la pantalla de registro.
- Apertura de la pantalla de registro mientras el sistema aún comprueba si hay
  sesión.
- Inicio de sesión con el nombre de usuario de una cuenta antigua.
- Inicio de sesión con el correo de una cuenta nueva, escrito con mayúsculas o
  con espacios sobrantes.
- Intento de enviar campos adicionales distintos de correo y contraseña (no debe
  ocurrir desde la interfaz; si el servicio los rechaza, se muestra el error).
- Registro con éxito seguido de recarga de la aplicación: la sesión sigue activa.

## Fuera de alcance

- Recuperación o cambio de contraseña.
- Verificación del correo electrónico.
- Edición de perfil o de datos personales.
- Asignación, cambio o gestión de roles.
- CRUD administrativo de usuarios (consulta, edición o eliminación).
- Captura de nombres, apellidos, documento, teléfono o fecha de nacimiento.
- Inicio de sesión con proveedores externos.
- Cambios en el backend del servicio de usuarios o de autenticación.
- Retirar el nombre de usuario como credencial de las cuentas antiguas.

## Notas de dependencia externa (no implementar aquí)

- El registro público de usuarios es una operación pública del servicio, por lo
  que no requiere sesión; debe **seguir siendo público** para que esta feature
  funcione.
- El servicio crea la persona asociada solo con el correo, asigna el rol de
  cliente y devuelve el correo normalizado que se usa para el inicio de sesión
  automático.
- **Riesgo de seguridad a reportar al responsable del backend**: al habilitar el
  registro público se dejaron también accesibles las operaciones de consulta,
  edición y eliminación de usuarios, que deberían volver a estar protegidas para
  administradores, preservando `POST` de usuarios público. Estas operaciones
  exponen datos de los usuarios (el correo es a la vez el nombre de usuario). El
  limitador de peticiones del servicio mitiga, pero no elimina, el abuso del
  registro público. Este repositorio no modifica el backend.

## Criterios de finalización

- Una persona sin sesión abre la pantalla de registro y ve únicamente los campos
  correo, contraseña y confirmación de contraseña, con enlace al inicio de sesión.
- El formulario impide el envío ante correo vacío, inválido o cuyo correo
  normalizado supere 255 caracteres; contraseña vacía o fuera del rango 6–100;
  confirmación vacía o distinta; y muestra junto a cada campo qué corregir.
- Mientras el sistema comprueba si hay sesión, no se muestra el formulario ni se
  permite enviarlo.
- Un registro con datos válidos crea la cuenta, inicia la sesión automáticamente
  y lleva a la persona al listado de películas; al recargar, la sesión sigue
  activa, la identidad de la persona es visible en la interfaz y puede acceder a
  las rutas privadas. El rol de cliente lo asigna el servicio y no se observa en
  la interfaz.
- Un registro con un correo ya existente muestra que el correo ya está
  registrado, no crea una segunda cuenta y ofrece ir a iniciar sesión.
- Si la cuenta se crea pero el inicio de sesión automático falla, la pantalla
  informa que la cuenta quedó creada, el formulario se sustituye o deshabilita
  por un aviso con enlace a iniciar sesión, no se puede reintentar el registro y
  no queda una sesión iniciada a medias.
- Ante un error de red o falta de respuesta durante la creación de la cuenta, se
  informa que no se pudo confirmar si la cuenta quedó creada y se conservan los
  datos; ante un error no previsto del servicio se muestra un mensaje legible sin
  afirmar si la cuenta se creó; en los errores de validación del servicio se
  muestra el motivo y se conservan los datos (salvo las contraseñas en los casos
  indicados en RF-20 y RF-24). Un fallo durante el auto-login con la cuenta ya
  creada sigue RF-24.
- Pulsar varias veces «Crear cuenta» durante la operación no genera más de una
  solicitud de registro.
- Una persona con sesión iniciada que abre la pantalla de registro es llevada al
  listado de películas y no ve el formulario.
- Desde el inicio de sesión se llega al registro y desde el registro se llega al
  inicio de sesión mediante enlaces visibles.
- La pantalla de inicio de sesión etiqueta la credencial como «Correo o usuario»,
  muestra la ayuda correspondiente y permite ingresar con el correo de una cuenta
  nueva y con el nombre de usuario de una cuenta antigua.
- La pantalla funciona correctamente en móvil y en escritorio.
- La verificación se realiza con el MCP de Playwright y con `npm run typecheck`,
  `npm run lint` y `npm run build`, sin errores.

## Dudas abiertas

Decisiones resueltas por el usuario que quedan registradas en esta spec:

- Se mantiene el campo de confirmación de contraseña (aprobado).
- El inicio de sesión se etiqueta «Correo o usuario» y acepta correo o nombre de
  usuario antiguo (aprobado).
- El destino tras el registro es siempre el listado de películas (aprobado).

No quedan dudas pendientes.
