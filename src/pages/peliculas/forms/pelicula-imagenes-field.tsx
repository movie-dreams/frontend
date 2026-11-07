import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { AlertCircle, ImagePlus, X } from 'lucide-react';
import { ImageInput, type ImageInputFiles } from '@/components/image-input';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  ALLOWED_IMAGE_FORMATS,
  DEFAULT_IMAGE_LIMITS,
  analyzeSelection,
  type ImageRejectionReason,
} from '@/lib/pelicula-imagenes';
import { cn } from '@/lib/utils';

/**
 * Textos en español del motivo por el que se descarta una imagen (RF-15, RF-16,
 * RF-17). El tipo `Record` obliga a cubrir todos los motivos: si la validación
 * pura añade uno nuevo, este archivo deja de compilar hasta traducirlo.
 */
const REJECTION_MESSAGES: Record<ImageRejectionReason, string> = {
  count: 'Máximo 5 imágenes',
  size: 'Cada imagen debe pesar como máximo 5 MiB',
  format: 'Formatos permitidos: .jpg, .jpeg, .png, .webp',
};

/** Imagen descartada en la última selección, lista para pintar su aviso. */
interface RejectionNotice {
  fileName: string;
  reason: ImageRejectionReason;
}

/**
 * The selector receives an empty value on purpose: the images live in this
 * field's controlled `value`, so the batch the selector reports is exactly the
 * batch the person just chose or dropped.
 */
const EMPTY_SELECTION: ImageInputFiles = [];

/** Props del campo de imágenes de la película. */
export interface PeliculaImagenesFieldProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'value' | 'onChange'> {
  /** Imágenes adjuntas al formulario, en el orden en que se muestran. */
  value: File[];
  /**
   * Notifica la lista completa de imágenes adjuntas tras adjuntar o quitar. Solo
   * incluye archivos conformes: los rechazados nunca llegan al formulario.
   */
  onChange: (files: File[]) => void;
  /** Deshabilita la selección y el quitado mientras el formulario se envía. */
  disabled?: boolean;
}

/**
 * Lee el lote recién elegido a partir de lo que reporta el selector.
 *
 * @param selection Lista que devuelve `ImageInput` al seleccionar o soltar.
 * @returns Los archivos del lote, sin las entradas sin archivo.
 */
function getSelectedImages(selection: ImageInputFiles): File[] {
  return selection
    .map((entry) => entry.file)
    .filter((file): file is File => file !== undefined);
}

/**
 * Comprueba si las imágenes actuales son las mismas que ya tienen vista previa,
 * para no rehacer el mapa en cada render del formulario.
 *
 * @param images Imágenes del campo.
 * @param sources Mapa de vistas previas vigente.
 * @returns `true` si no hay nada que recalcular.
 */
function hasSameImages(
  images: readonly File[],
  sources: ReadonlyMap<File, string>,
): boolean {
  return images.length === sources.size && images.every((image) => sources.has(image));
}

/**
 * Mantiene una vista previa por imagen seleccionada.
 *
 * La vista previa es un `objectURL` propio del campo: así las imágenes no
 * dependen de las `dataURL` internas del selector y se liberan en cuanto la
 * imagen sale de la selección o el campo se desmonta.
 *
 * @param images Imágenes del campo.
 * @returns La fuente de la vista previa de cada imagen.
 */
function usePreviewSources(images: readonly File[]): ReadonlyMap<File, string> {
  const [sources, setSources] = useState<ReadonlyMap<File, string>>(
    () => new Map<File, string>(),
  );
  const sourcesRef = useRef(sources);

  useEffect(() => {
    const previous = sourcesRef.current;
    if (hasSameImages(images, previous)) {
      return;
    }

    const next = new Map<File, string>();
    for (const image of images) {
      next.set(image, previous.get(image) ?? URL.createObjectURL(image));
    }
    for (const [image, source] of previous) {
      if (!next.has(image)) {
        URL.revokeObjectURL(source);
      }
    }

    sourcesRef.current = next;
    setSources(next);
  }, [images]);

  useEffect(
    () => () => {
      for (const source of sourcesRef.current.values()) {
        URL.revokeObjectURL(source);
      }
      sourcesRef.current = new Map<File, string>();
    },
    [],
  );

  return sources;
}

/**
 * Campo de imágenes de la película (RF-5, RF-14, RF-15, RF-16, RF-17).
 *
 * Reutiliza `ImageInput` para seleccionar y arrastrar y soltar, y añade encima
 * lo que el formulario de alta necesita: el límite de 5 imágenes, el máximo de
 * 5 MiB por imagen y los formatos .jpg, .jpeg, .png y .webp.
 *
 * Decisión de integración: el selector solo elige archivos; el estado de las
 * imágenes, las previsualizaciones con opción de quitar y los avisos de rechazo
 * viven en este campo. Por eso el contrato es un `File[]` corriente, igual que
 * cualquier otro campo del formulario, y el campo se ocupa de las
 * previsualizaciones y de los mensajes. La validación se delega por completo en
 * las funciones puras de `@/lib/pelicula-imagenes`: aquí solo se traduce cada
 * motivo a español.
 *
 * @param props.value Imágenes adjuntas (controlado por el formulario).
 * @param props.onChange Notifica la lista completa de imágenes conformes.
 * @param props.disabled Bloquea la selección y el quitado durante el envío.
 * @returns La zona de selección, las previsualizaciones y los avisos de rechazo.
 */
export function PeliculaImagenesField({
  value,
  onChange,
  disabled = false,
  className,
  ...props
}: PeliculaImagenesFieldProps) {
  const [notices, setNotices] = useState<RejectionNotice[]>([]);
  const previewSources = usePreviewSources(value);

  const maxCount = DEFAULT_IMAGE_LIMITS.maxCount;

  const handleSelect = (selection: ImageInputFiles): void => {
    const incoming = getSelectedImages(selection);
    if (incoming.length === 0) {
      return;
    }

    const { accepted, rejected } = analyzeSelection(value, incoming);
    if (accepted.length > 0) {
      onChange([...value, ...accepted]);
    }
    setNotices(
      rejected.map(({ image, reason }) => ({
        fileName: image.name,
        reason,
      })),
    );
  };

  const handleRemove = (indexToRemove: number): void => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div
      {...props}
      role="group"
      className={cn('space-y-3', className)}
    >
      <ImageInput
        value={EMPTY_SELECTION}
        onChange={handleSelect}
        multiple
        acceptType={[...ALLOWED_IMAGE_FORMATS]}
      >
        {({ onImageUpload, dragProps, isDragging }) => (
          <div
            {...(disabled ? {} : dragProps)}
            className={cn(
              'flex flex-col items-center gap-3 rounded-lg border border-dashed border-input bg-background p-4 text-center transition-colors sm:flex-row sm:text-start',
              isDragging && 'border-primary bg-primary/5',
            )}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              autoHeight
              disabled={disabled}
              onClick={onImageUpload}
            >
              <ImagePlus />
              Seleccionar imágenes
            </Button>
            <p className="text-xs text-muted-foreground">
              Arrastra y suelta aquí hasta {maxCount} imágenes .jpg, .jpeg, .png
              o .webp de 5 MiB como máximo cada una.
            </p>
          </div>
        )}
      </ImageInput>

      <p className="text-xs text-muted-foreground">
        {value.length} de {maxCount} imágenes adjuntas
      </p>

      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {value.map((image, index) => (
            <li key={`${index}-${image.name}`} className="space-y-2">
              <div className="relative overflow-hidden rounded-md border border-border bg-muted">
                <img
                  src={previewSources.get(image)}
                  alt={`Previsualización de ${image.name}`}
                  className="aspect-[2/3] w-full object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  mode="icon"
                  size="sm"
                  className="absolute end-1 top-1"
                  disabled={disabled}
                  onClick={() => handleRemove(index)}
                  aria-label={`Quitar ${image.name}`}
                >
                  <X />
                </Button>
              </div>
              <p className="truncate text-xs text-muted-foreground" title={image.name}>
                {image.name}
              </p>
            </li>
          ))}
        </ul>
      )}

      {notices.length > 0 && (
        <div className="space-y-2">
          {notices.map((notice, index) => (
            <Alert
              key={`${index}-${notice.fileName}-${notice.reason}`}
              variant="destructive"
              appearance="light"
              size="sm"
              icon="destructive"
            >
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertContent>
                <AlertTitle>{REJECTION_MESSAGES[notice.reason]}</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  Imagen descartada: {notice.fileName}
                </AlertDescription>
              </AlertContent>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}
