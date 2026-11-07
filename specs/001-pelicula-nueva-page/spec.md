# Spec 001 — Página para agregar nuevas películas

Estado: aprobada

## Contexto y objetivo

Hoy el catálogo de películas se puede consultar (listado y detalle), pero no
existe forma de incorporar nuevas películas al catálogo desde la interfaz. El
objetivo es habilitar una pantalla que permita **registrar una nueva película**
con sus datos básicos y sus imágenes, dejándola disponible para el catálogo.

El alta solo debe estar disponible para el personal autorizado (Administrador y
Gerente). El resto de personas (visitantes anónimos y clientes) no debe poder
publicar películas.

## Usuarios

- **Administrador**: responsable de la cartelera; puede crear películas.
- **Gerente**: responsable de la cartelera; puede crear películas.
- **Cliente**: usuario autenticado que solo consulta/compra; **no** crea películas.
- **Visitante anónimo**: navega el catálogo público; **no** crea películas.

## Historias de usuario

- HU-1. Como Administrador, quiero crear una nueva película con sus datos e
  imágenes para incorporarla a la cartelera.
- HU-2. Como Gerente, quiero crear una nueva película con sus datos e imágenes
  para incorporarla a la cartelera.
- HU-3. Como Administrador o Gerente, quiero llegar a la pantalla de alta desde
  el listado público de películas mediante un botón visible, para iniciar el
  registro sin pasos intermedios.
- HU-4. Como responsable del catálogo, quiero que el sistema me avise cuando un
  dato obligatorio falta o una imagen no cumple las condiciones, para corregirlo
  antes de guardar.
- HU-5. Como Administrador o Gerente, quiero poder cancelar el registro en
  cualquier momento y volver al listado sin dejar datos a medias.

## Definiciones

- **Película**: registro del catálogo compuesto por título, sinopsis, duración
  (en minutos), fecha de estreno, estado (activa/inactiva) e imágenes.
- **Roles autorizados**: «Administrador» (ADMIN) y «Gerente» (MANAGER). Son los
  únicos que pueden crear películas. «Cliente» es el rol de consulta/compra.
- **Listado público de películas**: la pantalla pública que muestra el catálogo;
  es el origen de navegación del botón de alta. El catálogo público solo muestra
  las películas activas.
- **Estado activo**: indica si la película se muestra en la cartelera pública.
- **Imágenes**: archivos gráficos asociados a la película, usados como afiche.

## Requisitos funcionales

- RF-1: CUANDO una persona con rol Administrador o Gerente visualiza el listado
  público de películas, EL SISTEMA muestra un botón principal (con la paleta de
  colores de la aplicación) para agregar una nueva película.
- RF-2: CUANDO la persona autorizada activa el botón de agregar película, EL
  SISTEMA la lleva a la pantalla de alta de película.
- RF-3: MIENTRAS una persona no tiene rol Administrador o Gerente, EL SISTEMA no
  muestra el botón de agregar película en el listado.
- RF-4: SI una persona sin rol Administrador o Gerente intenta acceder
  directamente a la pantalla de alta, ENTONCES EL SISTEMA le impide el acceso y
  no registra ninguna película.
- RF-5: MIENTRAS la pantalla de alta está abierta, EL SISTEMA presenta un
  formulario con los campos: Título, Sinopsis, duración (en minutos), fecha de
  estreno, estado activo e imágenes.
- RF-6: SI el campo Título está vacío o contiene únicamente espacios, ENTONCES
  EL SISTEMA impide enviar el formulario y muestra un mensaje indicando que el
  Título es obligatorio.
- RF-7: SI el campo Título supera los 100 caracteres, ENTONCES EL SISTEMA impide
  enviar el formulario e informa que el máximo es de 100 caracteres.
- RF-8: SI el campo Sinopsis está vacío o contiene únicamente espacios, ENTONCES
  EL SISTEMA impide enviar el formulario y muestra un mensaje indicando que la
  Sinopsis es obligatoria. Decisión explícita: la Sinopsis es obligatoria en el
  formulario aunque el servicio la acepte opcional.
- RF-9: SI el campo duración está vacío o no es un número mayor o igual a 1,
  ENTONCES EL SISTEMA impide enviar el formulario y muestra un mensaje indicando
  que la duración es obligatoria y debe ser de al menos 1 minuto.
- RF-10: EL SISTEMA permite enviar el formulario con la fecha de estreno, el
  estado y las imágenes vacíos. La duración no es opcional (ver RF-9).
- RF-11: SI la persona autorizada rellena la fecha de estreno, ENTONCES EL
  SISTEMA exige una fecha válida y no anterior a hoy, e impide enviar el
  formulario en caso contrario; SI la deja vacía, EL SISTEMA no la envía.
- RF-12: SI la persona autorizada no especifica el estado activo, ENTONCES EL
  SISTEMA registra la película como activa.
- RF-13: EL SISTEMA no transforma el Título en la interfaz ni antes de enviarlo;
  envía el texto tal como lo escribe la persona (la normalización a mayúsculas
  corresponde al servicio).
- RF-14: CUANDO la persona autorizada adjunta imágenes, EL SISTEMA acepta hasta 5
  imágenes por película.
- RF-15: SI la persona autorizada intenta adjuntar más de 5 imágenes, ENTONCES EL
  SISTEMA rechaza las adicionales e informa el límite máximo de 5 imágenes.
- RF-16: SI una imagen adjuntada supera los 5 MiB, ENTONCES EL SISTEMA rechaza
  esa imagen e informa que el tamaño máximo por imagen es de 5 MiB.
- RF-17: SI una imagen adjuntada tiene un formato distinto de .jpg, .jpeg, .png o
  .webp, ENTONCES EL SISTEMA rechaza esa imagen e informa los formatos permitidos.
- RF-18: CUANDO la persona autorizada envía un formulario con datos válidos, EL
  SISTEMA registra la película mediante la operación de creación de películas del
  servicio.
- RF-19: SI el registro de la película falla por cualquier motivo (error de red o
  rechazo del servidor, incluidos datos inválidos o formato de imagen no
  permitido), ENTONCES EL SISTEMA muestra el motivo del error sin descartar los
  datos ya introducidos en el formulario.
- RF-20: CUANDO el registro de la película finaliza con éxito, EL SISTEMA lleva a
  la persona de vuelta al listado de películas con un aviso de éxito genérico.
  Si la película creada está activa, además ya aparece en el listado.
- RF-21: CUANDO la persona autorizada cancela el formulario, EL SISTEMA la lleva
  de vuelta al listado de películas sin crear ninguna película.

## Requisitos no funcionales

- RNF-1: La pantalla de alta reutiliza el diseño, componentes y paleta de colores
  ya existentes en la aplicación; no introduce un lenguaje visual nuevo.
- RNF-2: La interfaz, los textos de validación y los mensajes de error se
  presentan en español.
- RNF-3: Los mensajes de error (falta de datos obligatorios, límite/tamaño/formato
  de imágenes) indican con claridad qué corregir.
- RNF-4: La validación de los campos obligatorios y de las imágenes es inmediata
  en la pantalla, antes de enviar la solicitud al servicio.
- RNF-5: La operación está sujeta a la autenticación y a la autorización por rol
  existentes; sin una sesión válida y un rol autorizado no se crea ninguna película.

## Casos límite

- Título compuesto solo por espacios en blanco.
- Título de exactamente 100 caracteres (permitido) y de 101 caracteres (rechazado).
- Sinopsis compuesta solo por espacios en blanco (el formulario la exige, aunque
  el servicio la acepte opcional).
- Duración vacía, igual a 0, negativa o no numérica.
- Fecha de estreno anterior a hoy (rechazada), fecha de hoy (permitida) y fecha
  vacía (no se envía).
- Adjuntar exactamente 5 imágenes (límite permitido) y adjuntar una sexta.
- Imagen de exactamente 5 MiB (permitida) y de más de 5 MiB (rechazada).
- Imagen con extensión permitida pero contenido no válido, o viceversa.
- Formatos no permitidos (por ejemplo .gif, .bmp, .tiff).
- Envío del formulario sin ninguna imagen adjunta.
- Envío del formulario sin especificar el estado activo (debe crearse activa).
- Película creada inactiva: se vuelve al listado con aviso de éxito y no aparece
  en el catálogo público.
- Título escrito en minúsculas o mixto (se envía tal cual, sin transformar en pantalla).
- Acceso directo a la pantalla de alta sin sesión iniciada.
- Acceso directo a la pantalla de alta con rol Cliente.
- Cancelar el formulario sin crear ninguna película.
- Fallo del servicio al registrar la película (error de red o rechazo del servidor).

## Fuera de alcance

- Edición y eliminación de películas existentes.
- Reasignar o rediseñar el listado y el detalle de películas.
- Gestión de géneros, clasificaciones, salas, funciones u otros atributos no
  enumerados en esta spec.
- Moderación, aprobación o flujo de publicación en dos pasos.
- Edición del orden o recorte de las imágenes cargadas (solo carga y rechazo).
- Normalización del Título en la pantalla (esa tarea corresponde al servicio).
- Cambios en el backend del servicio de películas.

## Criterios de finalización

- Un Administrador y un Gerente ven el botón principal de agregar película en el
  listado público y acceden a la pantalla de alta.
- Un Cliente y un visitante anónimo no ven el botón y no pueden acceder a la
  pantalla de alta ni registrar películas.
- El formulario impide el envío cuando Título, Sinopsis o duración faltan o no
  son válidos (duración ≥ 1), o cuando el Título supera 100 caracteres, y lo
  permite cuando fecha, estado e imágenes están vacíos.
- La fecha de estreno, si se rellena, es válida y no anterior a hoy; si se deja
  vacía no se envía.
- Cuando no se especifica el estado, la película se crea activa.
- El Título se envía tal como lo escribe la persona, sin transformarse en pantalla.
- El formulario respeta el límite de 5 imágenes, el máximo de 5 MiB por imagen y
  los formatos .jpg, .jpeg, .png y .webp, informando el motivo cuando no se cumplen.
- Al guardar con éxito, la persona vuelve al listado con un aviso de éxito; si la
  película está activa, ya aparece en el listado.
- Cancelar el formulario devuelve al listado sin crear ninguna película.
- Ante cualquier fallo del servicio, el formulario conserva los datos introducidos
  y muestra el motivo.

## Dudas abiertas

No quedan dudas pendientes.
