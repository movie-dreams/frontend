import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import type { CrearPelicula } from '@/types/pelicula';
import { peliculaService } from '@/services/pelicula.service';
import { Container } from '@/components/common/container';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinners';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PeliculaImagenesField } from './forms/pelicula-imagenes-field';
import {
  getMovieFormInitialValues,
  getMovieFormSchema,
  type MovieFormValues,
} from './forms/pelicula-schema';

/**
 * Traduce los valores del formulario al cuerpo que espera la operación de
 * creación del servicio (RF-18).
 *
 * Reglas del envío:
 * - El Título viaja tal cual se escribió: no se recorta ni se cambia de
 *   mayúsculas (RF-13); la normalización corresponde al servicio.
 * - La fecha de estreno es opcional: si está vacía, no se envía (RF-10, RF-11).
 * - El estado va siempre, activo por defecto (RF-12), para no depender del
 *   comportamiento del backend.
 *
 * @param values Datos ya validados por el esquema del formulario.
 * @returns El cuerpo de la petición de creación.
 */
function buildCreatePayload(values: MovieFormValues): CrearPelicula {
  const payload: CrearPelicula = {
    title: values.title,
    synopsis: values.synopsis,
    durationMinutes: values.durationMinutes,
    isActive: values.isActive ?? true,
  };

  if (values.releaseDate) {
    payload.releaseDate = values.releaseDate;
  }

  return payload;
}

/**
 * Obtiene el motivo legible de un fallo del servicio (RF-19).
 *
 * El interceptor de `lib/http` ya deja un mensaje en español (validación,
 * permisos, servidor caído), así que aquí solo se cubre el caso sin mensaje.
 *
 * @param error Error lanzado por el servicio.
 * @returns El texto que se muestra en el aviso de error.
 */
function getFailureReason(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'No se pudo guardar la película. Intenta de nuevo.';
}

/**
 * Marca de éxito que la pantalla de alta deja en el estado de navegación al
 * volver al listado (RF-20).
 *
 * Es un contrato privado entre la pantalla de alta y el listado: la clave no se
 * escribe en ningún otro lugar ni viaja en la URL, de modo que un recargado no
 * puede repetir el aviso. Quien consume el listado solo pregunta con
 * {@link isMovieCreatedNavigationState}; nunca inspecciona la forma interna.
 */
export interface MovieCreatedNavigationState {
  movieCreated: true;
}

/** Marca de éxito ya construida, lista para pasarla al navegar. */
export const MOVIE_CREATED_NAVIGATION_STATE: MovieCreatedNavigationState = {
  movieCreated: true,
};

/**
 * Indica si un estado de navegación cualquiera trae la marca de éxito del alta.
 *
 * @param state Valor recibido en `location.state` (puede ser cualquier cosa).
 * @returns `true` solo cuando el estado trae la marca de película creada.
 */
export function isMovieCreatedNavigationState(
  state: unknown,
): state is MovieCreatedNavigationState {
  return (
    typeof state === 'object' &&
    state !== null &&
    (state as Partial<MovieCreatedNavigationState>).movieCreated === true
  );
}

/**
 * Pantalla de alta de película (RF-5).
 *
 * Monta el formulario de alta con el esquema de validación y el control de
 * imágenes, envía los datos a la operación de creación y, si el servicio falla,
 * muestra el motivo conservando lo introducido (RF-19). Al terminar con éxito
 * vuelve al listado dejando la marca de éxito en el estado de navegación
 * (RF-20); el botón «Cancelar» vuelve al listado sin registrar nada (RF-21). La
 * pantalla no escribe URLs ni habla con axios: solo consume `peliculaService`.
 *
 * @returns El formulario de alta de película.
 */
export function PeliculaNuevaPage() {
  const navigate = useNavigate();

  // Frontera permitida: la pantalla inyecta «hoy» al esquema. La regla de la
  // fecha de estreno (RF-11) se evalúa de forma pura en `lib/pelicula-fecha`.
  const form = useForm<MovieFormValues>({
    resolver: zodResolver(getMovieFormSchema(new Date())),
    defaultValues: getMovieFormInitialValues(),
  });

  // Las imágenes quedan fuera del esquema (no son validables por zod): la
  // cantidad, el tamaño y el formato los decide el control de imágenes. Aquí
  // solo se guarda el lote aceptado, controlado por `value`/`onChange`.
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [motivoFallo, setMotivoFallo] = useState<string | null>(null);

  async function onSubmit(values: MovieFormValues): Promise<void> {
    try {
      setEnviando(true);
      // RF-19: los datos no se tocan, solo se descarta el fallo anterior.
      setMotivoFallo(null);

      await peliculaService.crearPelicula(
        buildCreatePayload(values),
        imagenes,
      );

      // RF-20: se vuelve al listado con una marca de éxito en el estado de
      // navegación (no en la URL ni en una variable global). El listado la
      // consume una única vez para mostrar el aviso genérico.
      navigate('/peliculas', { state: MOVIE_CREATED_NAVIGATION_STATE });
    } catch (error) {
      // RF-19: se muestra el motivo sin limpiar el formulario.
      setMotivoFallo(getFailureReason(error));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Container>
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-mono">
            Agregar película
          </h1>
          <p className="text-sm text-muted-foreground">
            Completa los datos de la nueva película.
          </p>
        </div>

        {motivoFallo && (
          <Alert variant="destructive">
            <AlertIcon>
              <AlertCircle className="h-4 w-4" />
            </AlertIcon>
            <AlertContent>
              <AlertTitle>No se pudo guardar la película</AlertTitle>
              <AlertDescription>{motivoFallo}</AlertDescription>
            </AlertContent>
          </Alert>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="El nombre de la película"
                      disabled={enviando}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="synopsis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sinopsis *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="De qué trata la película"
                      disabled={enviando}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración (min) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={1}
                        placeholder="120"
                        disabled={enviando}
                        {...field}
                        value={field.value ?? ''}
                        // El esquema coacciona el texto a número: aquí se envía
                        // lo escrito para que el error de duración se evalúe
                        // con el valor real del campo.
                        onChange={(event) =>
                          field.onChange(event.target.value)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="releaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de estreno</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={enviando}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex-row items-center justify-between gap-3 rounded-md border border-border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Activa</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Se muestra en el catálogo público.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? true}
                      onCheckedChange={field.onChange}
                      disabled={enviando}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <fieldset className="flex flex-col gap-2.5">
              <legend className="font-medium text-foreground">
                Imágenes (opcional, hasta 5)
              </legend>
              <PeliculaImagenesField
                value={imagenes}
                onChange={setImagenes}
                disabled={enviando}
              />
            </fieldset>

            {/* RF-21: «Cancelar» vuelve al listado sin enviar nada; se
                deshabilita durante el envío para no abandonar a medias un
                registro ya lanzado. */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/peliculas')}
                disabled={enviando}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={enviando}>
                {enviando && <Spinner className="me-2 h-4 w-4 animate-spin" />}
                {enviando ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Container>
  );
}
