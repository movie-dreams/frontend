'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { useAuth } from '@/auth/context/auth-context';
import { peliculaService } from '@/services/pelicula.service';
import { salaService } from '@/services/sala.service';
import { funcionService } from '@/services/funcion.service';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '@/components/ui/spinners';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select';

import { funcionFormSchema } from '@/lib/funcion-schema';

type FormState =
  | { type: 'inicial' }
  | { type: 'enviando' }
  | { type: 'exito' }
  | { type: 'error', mensaje: string }
  | { type: 'cancelado' };

export function FuncionCreacionForm() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formState, setFormState] = useState<FormState>({ type: 'inicial' });

  const [peliculas, setPeliculas] = useState<Array<{ id: number; title: string }>>();
  const [salas, setSalas] = useState<Array<{ id: number; name: string }>>();

  useEffect(() => {
    if (isAuthenticated) {
      peliculaService.listarPeliculas().then(
        (resp) => {
          setPeliculas(
            resp.data.map(
              (p): { id: number; title: string } => ({
                id: p.id,
                title: p.title,
              }),
            ),
          );
        },
        (err) => {
          console.error('Error al cargar películas', err);
        },
      );
      salaService.listar().then(
        (resp) => {
          setSalas(
            resp.data.map(
              (s): { id: number; name: string } => ({
                id: s.id,
                name: s.name,
              }),
            ),
          );
        },
        (err) => {
          console.error('Error al cargar salas', err);
        },
      );
    }
  }, [isAuthenticated]);

  // useForm without explicit generic - let resolver infer
  const form = useForm({
    resolver: zodResolver(funcionFormSchema),
    defaultValues: {
      movieId: 0,
      roomId: 0,
      date: '',
      startTime: '',
      endTime: '',
      price: 0,
      status: 'PROGRAMADA',
    },
  });

  const {
    control,
    handleSubmit,
  } = form;

  const onSubmit = async (values: unknown) => {
    try {
      setFormState({ type: 'enviando' });

      // Cast values to CrearFuncionForm for the service call
      const payload = values as {
        movieId: number;
        roomId: number;
        date: string;
        startTime: string;
        endTime: string;
        price: number;
        status?: 'PROGRAMADA' | 'CANCELADA' | 'FINALIZADA';
      };

      await funcionService.crear(payload);

      setFormState({ type: 'exito' });
      navigate('/funciones', { state: { funcionCreated: true } });
    } catch (error) {
      setFormState({
        type: 'error',
        mensaje:
          error instanceof Error ? error.message : 'No se pudo crear la función',
      });
    }
  };

  switch (formState.type) {
    case 'inicial': {
      return (
        <Container className="mx-auto max-w-2xl py-8">
          <h1 className="text-2xl font-semibold tracking-tight text-mono">
            Crear nueva función
          </h1>
          <p className="text-sm text-muted-foreground">
            Completa los datos de la nueva función.
          </p>

          <Form {...form}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              {/* Película select */}
              <FormField
                control={control}
                name="movieId"
                render={() => (
                  <FormItem>
                    <FormLabel>Película *</FormLabel>
                    <FormControl>
                      <Select>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem disabled value="0">Seleccionar película</SelectItem>
                          {peliculas?.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                disabled={!isAuthenticated}
              />

              {/* Sala select */}
              <FormField
                control={control}
                name="roomId"
                render={() => (
                  <FormItem>
                    <FormLabel>Sala *</FormLabel>
                    <FormControl>
                      <Select>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem disabled value="0">Seleccionar sala</SelectItem>
                          {salas?.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                disabled={!isAuthenticated}
              />

              {/* Fecha input */}
              <FormField
                control={control}
                name="date"
                render={( {field} ) => (
                  <FormItem>
                    <FormLabel>Fecha *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        disabled={!isAuthenticated}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                disabled={!isAuthenticated}
              />

              {/* Hora inicio input */}
              <FormField
                control={control}
                name="startTime"
                render={( {field} ) => (
                  <FormItem>
                    <FormLabel>Hora inicio *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="HH:mm:ss"
                        disabled={!isAuthenticated}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                disabled={!isAuthenticated}
              />

              {/* Hora fin input */}
              <FormField
                control={control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora fin *</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="HH:mm:ss"
                        disabled={!isAuthenticated}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                disabled={!isAuthenticated}
              />

              {/* Precio input number */}
              <FormField
                control={control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={0.01}
                        disabled={!isAuthenticated}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                disabled={!isAuthenticated}
              />

              {/* Estado select */}
              <FormField
                control={control}
                name="status"
                render={() => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <FormControl>
                      <Select>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PROGRAMADA">PROGRAMADA</SelectItem>
                          <SelectItem value="CANCELADA">CANCELADA</SelectItem>
                          <SelectItem value="FINALIZADA">FINALIZADA</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                disabled={!isAuthenticated}
              />

              {/* Acción: Botón submit y cancelar */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormState({ type: 'cancelado' });
                    navigate('/funciones');
                  }}
                  disabled={!isAuthenticated}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={!isAuthenticated}>
                  Crear función
                </Button>
              </div>
            </form>
          </Form>
        </Container>
      );
    }

    case 'enviando': {
      return (
        <Container className="mx-auto max-w-2xl py-8">
          <h1 className="text-2xl font-semibold tracking-tight text-mono">
            Creando función
          </h1>
          <p className="text-sm text-muted-foreground">
            Por favor, espera mientras procesamos la solicitud.
          </p>
          <Spinner className="mx-auto mt-4 h-8 w-8 animate-spin" />
        </Container>
      );
    }

    case 'exito': {
      return (
        <Container className="mx-auto max-w-2xl py-8">
          <Alert variant="success">
            <AlertTitle>Éxito</AlertTitle>
            <AlertDescription>La función ha sido creada correctamente</AlertDescription>
          </Alert>
          <p className="text-sm text-muted-foreground mt-2">
            La función ha sido creada correctamente. Volviendo al listado...
          </p>
        </Container>
      );
    }

    case 'error': {
      return (
        <Container className="mx-auto max-w-2xl py-8">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formState.mensaje}</AlertDescription>
          </Alert>
          <Button
            variant="primary"
            onClick={() => setFormState({ type: 'inicial' })}
            className="mt-4"
          >
            Intentar de nuevo
          </Button>
        </Container>
      );
    }

    case 'cancelado': {
      return (
        <Container className="mx-auto max-w-2xl py-8">
          <p className="text-sm text-muted-foreground">
            La creación de la función fue cancelada.
          </p>
          <Button variant="outline" onClick={() => navigate('/funciones')}>
            Volver al listado
          </Button>
        </Container>
      );
    }

    default:
      return null;
  }
}