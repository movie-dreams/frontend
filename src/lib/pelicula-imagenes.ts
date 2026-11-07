/**
 * Pure validation of a movie's image batch.
 *
 * Owns the business rules RF-14 (up to 5 images), RF-15 (count limit), RF-16
 * (max size per image) and RF-17 (allowed formats). The module is pure: it
 * never touches the DOM, the network or the clock. It receives the files and
 * the limits and returns a deterministic result (accepted images plus the
 * reason for each rejection) that the screen only has to render.
 */

/** Cantidad máxima de imágenes por película (RF-14, RF-15). */
export const MAX_IMAGE_COUNT = 5;

/** Tamaño máximo por imagen, en bytes: 5 MiB (RF-16). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Extensiones permitidas, en minúsculas y sin punto (RF-17). */
export const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'] as const;

/** Límites con los que se evalúa una selección de imágenes. */
export interface ImageLimits {
  /** Cantidad máxima de imágenes por película (RF-15). */
  maxCount: number;
  /** Tamaño máximo permitido por imagen, en bytes (RF-16). */
  maxBytes: number;
  /** Extensiones permitidas, en minúsculas y sin punto (RF-17). */
  allowedFormats: readonly string[];
}

/** Límites por defecto del producto. */
export const DEFAULT_IMAGE_LIMITS: ImageLimits = {
  maxCount: MAX_IMAGE_COUNT,
  maxBytes: MAX_IMAGE_BYTES,
  allowedFormats: ALLOWED_IMAGE_FORMATS,
};

/**
 * Clave estable del motivo por el que se descarta una imagen. La pantalla la
 * traduce al mensaje en español correspondiente (RF-15, RF-16, RF-17).
 */
export type ImageRejectionReason = 'count' | 'size' | 'format';

/** Imagen descartada junto con el motivo del descarte. */
export interface RejectedImage {
  image: File;
  reason: ImageRejectionReason;
}

/** Resultado de analizar una selección: lo aceptado y el detalle de lo rechazado. */
export interface ImageBatchAnalysis {
  accepted: File[];
  rejected: RejectedImage[];
}

/**
 * Reads the file extension from the file name, lower-cased and without the
 * dot. A name without extension yields an empty string, which is never among
 * the allowed formats and therefore is rejected by format.
 *
 * @param fileName Nombre del archivo (`File.name`).
 * @returns La extensión normalizada (por ejemplo `'jpeg'`).
 */
function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex === -1 ? '' : fileName.slice(dotIndex + 1).toLowerCase();
}

/**
 * Comprueba si una imagen cumple los límites de tamaño y formato.
 *
 * El tamaño se evalúa antes que el formato (RF-16 antes que RF-17), de modo que
 * una imagen demasiado grande siempre se informa como `'size'`.
 *
 * @param image Archivo seleccionado por la persona autorizada.
 * @param limits Límites a aplicar; por defecto, los del producto.
 * @returns `null` si la imagen es válida; el motivo del rechazo si no lo es.
 */
export function isImageValid(
  image: File,
  limits: ImageLimits = DEFAULT_IMAGE_LIMITS,
): ImageRejectionReason | null {
  if (image.size > limits.maxBytes) {
    return 'size';
  }

  const extension = getExtension(image.name);
  if (!limits.allowedFormats.includes(extension)) {
    return 'format';
  }

  return null;
}

/**
 * Analiza el lote recién seleccionado junto con las imágenes ya adjuntas.
 *
 * Aplica las reglas en este orden, imagen por imagen: cantidad (RF-15),
 * tamaño (RF-16) y formato (RF-17). Se detiene en la primera regla incumplida y
 * sigue con el resto del lote, de forma que un archivo rechazado no bloquea a
 * los siguientes.
 *
 * @param existing Imágenes ya adjuntas al formulario.
 * @param incoming Imágenes recién seleccionadas por la persona autorizada.
 * @param limits Límites a aplicar; por defecto, los del producto.
 * @returns Las imágenes aceptadas y el motivo de cada rechazo.
 */
export function analyzeSelection(
  existing: readonly File[],
  incoming: readonly File[],
  limits: ImageLimits = DEFAULT_IMAGE_LIMITS,
): ImageBatchAnalysis {
  const accepted: File[] = [];
  const rejected: RejectedImage[] = [];

  for (const image of incoming) {
    if (existing.length + accepted.length >= limits.maxCount) {
      rejected.push({ image, reason: 'count' });
      continue;
    }

    const reason = isImageValid(image, limits);
    if (reason === null) {
      accepted.push(image);
    } else {
      rejected.push({ image, reason });
    }
  }

  return { accepted, rejected };
}
