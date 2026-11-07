/**
 * Helpers puros para formateo de fechas y horas de funciones (showtimes).
 * Reciben fechas como strings o Date; no leen el reloj interno.
 * Usan locale 'es-ES' y hora local del cine.
 */

/**
 * Capitaliza la primera letra de un string.
 */
function capitalizar(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formatea una función combinando fecha y hora de inicio.
 * Ejemplo de salida: "Lun 20 Oct, 19:30"
 *
 * @param date - Fecha en formato 'YYYY-MM-DD'
 * @param startTime - Hora de inicio en formato 'HH:mm:ss' o 'HH:mm'
 * @returns String formateado en locale ES
 */
export function formatearShowtime(date: string, startTime: string): string {
  const [year, month, day] = date.split('-').map(Number);
  // Usamos hora local (no UTC) para el día
  const fecha = new Date(year, month - 1, day);

  // Extraer hora y minutos del startTime
  const [hours, minutes] = startTime.split(':').map(Number);
  fecha.setHours(hours ?? 0, minutes ?? 0, 0, 0);

  const localeString = fecha.toLocaleString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Formato: "mar, 20 oct, 19:30" -> partes: ["mar", "20 oct", "19:30"]
  const partes = localeString.split(', ');
  const diaSemana = capitalizar(partes[0] || '');
  const diaMes = partes[1] ? partes[1].split(' ').map(capitalizar).join(' ') : '';
  const hora = partes[2] || '';

  return `${diaSemana} ${diaMes}, ${hora}`;
}

/**
 * Formatea solo la fecha de una función.
 * Ejemplo de salida: "Lunes 20 de Octubre"
 *
 * @param date - Fecha en formato 'YYYY-MM-DD'
 * @returns String formateado en locale ES
 */
export function formatearFecha(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const fecha = new Date(year, month - 1, day);

  // Reconstruir manualmente para tener control total sobre capitalización
  const diaSemana = capitalizar(fecha.toLocaleDateString('es-ES', { weekday: 'long' }));
  const dia = fecha.getDate();
  const mes = capitalizar(fecha.toLocaleDateString('es-ES', { month: 'long' }));
  const anio = fecha.getFullYear();

  return `${diaSemana} ${dia} de ${mes} de ${anio}`;
}