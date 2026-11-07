/**
 * Validación pura de la fecha de estreno de una película.
 *
 * La fecha es opcional: el valor vacío se considera válido porque entonces no
 * se envía. Cuando viene rellena debe cumplir el formato `YYYY-MM-DD`, existir
 * como fecha real del calendario y no ser anterior a «hoy».
 *
 * Todo el cálculo se hace en hora local. «Hoy» se recibe como parámetro para
 * que la función sea determinista: nunca lee el reloj por dentro.
 */

const RELEASE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Compone la fecha local de un `Date` en el formato `YYYY-MM-DD`.
 *
 * Usa los componentes locales (no UTC) para el «hoy» lógico.
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Indica si una fecha de estreno (`YYYY-MM-DD`) es válida respecto a «hoy».
 *
 * @param value Fecha escrita por la persona, en formato `YYYY-MM-DD`. La
 *   cadena vacía se acepta porque el campo es opcional.
 * @param today Día actual en hora local, recibido como parámetro para que la
 *   función sea pura y determinista.
 * @returns `true` si la fecha es válida (o está vacía); `false` si el formato
 *   es incorrecto, la fecha no existe (por ejemplo `2026-02-30`) o es anterior
 *   a «hoy».
 */
export function isReleaseDateValid(value: string, today: Date): boolean {
  if (value === '') {
    return true;
  }

  if (!RELEASE_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  // Reject impossible dates such as 2026-02-30 (Date would silently roll over).
  const isRealDate =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;

  if (!isRealDate) {
    return false;
  }

  return value >= formatLocalDate(today);
}
