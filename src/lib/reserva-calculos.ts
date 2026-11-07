/**
 * Helpers puros para cálculos de reserva.
 * No dependen de React ni de estado; son funciones deterministas y testeables.
 */

/**
 * Calcula el total multiplicando la cantidad de asientos elegidos por el precio unitario.
 *
 * @param elegidos - Array de identificadores de asientos seleccionados
 * @param price - Precio unitario por asiento
 * @returns Total sin redondear
 */
export function calcularTotal(elegidos: number[], price: number): number {
  return elegidos.length * price;
}

/**
 * Redondea un total a 2 decimales (centésimas).
 *
 * @param total - Valor a redondear
 * @returns Valor redondeado a 2 decimales
 */
export function redondearTotal(total: number): number {
  return Math.round(total * 100) / 100;
}