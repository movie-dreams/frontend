/**
 * Normalización pura de credenciales.
 *
 * Estos helpers no leen el reloj, no acceden a la red y no tienen efectos
 * secundarios: el mismo valor de entrada produce siempre el mismo resultado.
 * La normalización debe aplicarse antes de validar y de enviar la credencial,
 * para que el correo con espacios o mayúsculas se trate igual que el que
 * devuelve el servicio.
 */

/**
 * Normaliza un correo: recorta los espacios exteriores y pasa a minúsculas.
 *
 * Es la forma canónica con la que se valida la longitud, se envía el registro
 * y se inicia la sesión automática.
 *
 * @param value Correo tal como lo escribió la persona.
 * @returns Correo sin espacios exteriores y en minúsculas.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Normaliza una credencial de inicio de sesión.
 *
 * Recorta siempre los espacios exteriores y pasa a minúsculas únicamente
 * cuando la credencial contiene `@`, es decir, cuando es un correo. Así el
 * nombre de usuario de las cuentas antiguas conserva sus mayúsculas.
 *
 * @param value Credencial tal como la escribió la persona.
 * @returns Credencial recortada y, si es un correo, en minúsculas.
 */
export function normalizeCredential(value: string): string {
  const trimmed = value.trim();
  return trimmed.includes('@') ? trimmed.toLowerCase() : trimmed;
}
