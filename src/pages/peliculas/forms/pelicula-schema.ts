import type { DefaultValues } from 'react-hook-form';
import { z } from 'zod';
import { isReleaseDateValid } from '@/lib/pelicula-fecha';

/**
 * Validación del formulario de alta de película.
 *
 * El esquema es una factoría que recibe «hoy» como parámetro para que la regla
 * de la fecha de estreno sea determinista: el módulo nunca lee el reloj por
 * dentro. Las reglas de la spec son: Título obligatorio (sin contar espacios) y
 * de 100 caracteres como máximo, Sinopsis obligatoria, duración de al menos 1
 * minuto, fecha de estreno opcional (válida y no anterior a hoy) y estado
 * opcional que arranca activo.
 *
 * El Título no se transforma: se valida tal como se escribe, sin recortar ni
 * cambiar mayúsculas, porque el envío del texto literal es responsabilidad del
 * formulario (la normalización corresponde al servicio).
 */

const MAX_TITLE_LENGTH = 100;

const TITLE_REQUIRED_MESSAGE = 'El título es obligatorio';
const TITLE_TOO_LONG_MESSAGE = `El título no puede superar los ${MAX_TITLE_LENGTH} caracteres`;
const SYNOPSIS_REQUIRED_MESSAGE = 'La sinopsis es obligatoria';
const DURATION_INVALID_MESSAGE =
  'La duración es obligatoria y debe ser de al menos 1 minuto';
const RELEASE_DATE_INVALID_MESSAGE =
  'La fecha de estreno debe ser válida y no anterior a hoy';

/** Indica si un texto aporta contenido real (no vacío ni solo espacios). */
function hasContent(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Construye el esquema de validación del formulario de alta de película.
 *
 * @param today Día actual en hora local, recibido como parámetro para que «no
 *   anterior a hoy» se pueda evaluar de forma pura y determinista.
 * @returns Esquema `zod` del formulario, con los mensajes de error en español.
 */
export function getMovieFormSchema(today: Date) {
  return z.object({
    // Validated as written (RF-13): the whitespace-only case is rejected by the
    // refinement and the raw text reaches the service untrimmed.
    title: z
      .string({ required_error: TITLE_REQUIRED_MESSAGE })
      .max(MAX_TITLE_LENGTH, { message: TITLE_TOO_LONG_MESSAGE })
      .refine(hasContent, { message: TITLE_REQUIRED_MESSAGE }),

    // Required in the form even though the service accepts it as optional.
    synopsis: z
      .string({ required_error: SYNOPSIS_REQUIRED_MESSAGE })
      .refine(hasContent, { message: SYNOPSIS_REQUIRED_MESSAGE }),

    // Coerced so the numeric field may arrive as the text typed by the person;
    // empty, non-numeric or below 1 all resolve to the same Spanish message.
    durationMinutes: z.coerce
      .number({
        required_error: DURATION_INVALID_MESSAGE,
        invalid_type_error: DURATION_INVALID_MESSAGE,
      })
      .min(1, { message: DURATION_INVALID_MESSAGE }),

    // Optional: empty means "not sent". The rule lives in the pure helper.
    releaseDate: z
      .string({ invalid_type_error: RELEASE_DATE_INVALID_MESSAGE })
      .optional()
      .refine(
        (value) => value === undefined || isReleaseDateValid(value, today),
        {
          message: RELEASE_DATE_INVALID_MESSAGE,
        },
      ),

    isActive: z.boolean().optional(),
  });
}

/** Valores del formulario de alta de película, ya validados y tipados. */
export type MovieFormValues = z.infer<ReturnType<typeof getMovieFormSchema>>;

/**
 * Valores con los que arranca el formulario de alta de película.
 *
 * Devuelve un objeto nuevo en cada llamada y deja el estado activo marcado, de
 * modo que una película sin tocar el control se crea activa. La duración no se
 * inicializa: el campo arranca vacío y el esquema la exige al enviar.
 */
export function getMovieFormInitialValues(): DefaultValues<MovieFormValues> {
  return {
    title: '',
    synopsis: '',
    durationMinutes: undefined,
    releaseDate: '',
    isActive: true,
  };
}
