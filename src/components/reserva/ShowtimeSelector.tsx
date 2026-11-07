import { useMemo } from 'react';
import { useMovieWithShowtimes } from '@/hooks/useMovieWithShowtimes';
import { Funcion } from '@/types/cartelera';
import { formatearFecha } from '@/lib/showtime-format';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ShowtimeSelectorProps {
  movieId: number;
  onSelect: (showtimeId: number) => void;
  onBack?: () => void;
}

/**
 * Paso 1: Selector de showtime agrupado por fecha.
 * Usa hook useMovieWithShowtimes para cargar película y funciones.
 *
 * @param movieId - Identificador de la película
 * @param onSelect - Callback al seleccionar una función válida
 * @param onBack - Callback opcional para "Cambiar película" (solo en ruta /reservar)
 */
export function ShowtimeSelector({ movieId, onSelect, onBack }: ShowtimeSelectorProps) {
  const { pelicula, funciones, cargando, error, recargar } = useMovieWithShowtimes(movieId);

  // Agrupar funciones por fecha, ordenar grupos por fecha asc, dentro de cada grupo por startTime asc
  const gruposPorFecha = useMemo((): [string, Funcion[]][] => {
    const agrupado = funciones.reduce((acc, funcion) => {
      const fecha = funcion.date;
      if (!acc[fecha]) {
        acc[fecha] = [];
      }
      acc[fecha].push(funcion);
      return acc;
    }, {} as Record<string, Funcion[]>);

    return Object.entries(agrupado)
      .sort(([fechaA], [fechaB]) => fechaA.localeCompare(fechaB))
      .map(([fecha, funcs]) => [
        fecha,
        funcs.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      ]);
  }, [funciones]);

  // Loading state con skeleton
  if (cargando) {
    return (
      <Container>
        <div className="space-y-6" role="status" aria-label="Cargando funciones">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="text-destructive" role="alert">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="mt-2 text-lg font-medium">{error}</p>
          </div>
          <Button variant="outline" onClick={recargar} disabled={cargando}>
            Reintentar
          </Button>
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              Cambiar película
            </Button>
          )}
        </div>
      </Container>
    );
  }

  // Empty state (no hay funciones programadas)
  if (gruposPorFecha.length === 0) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="text-muted-foreground" role="status">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-lg">No hay funciones programadas para esta película</p>
          </div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Cambiar película
            </Button>
          )}
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header con título de película y botón "Cambiar película" */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {pelicula?.title ?? 'Película'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecciona una función para continuar
          </p>
        </div>
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            Cambiar película
          </Button>
        )}
      </div>

      {/* Lista de funciones agrupadas por fecha */}
      <div className="space-y-8" role="list" aria-label="Funciones disponibles">
        {gruposPorFecha.map(([fecha, funcsDelDia]) => (
          <section key={fecha} className="space-y-4" aria-labelledby={`fecha-${fecha}`}>
            <h2
              id={`fecha-${fecha}`}
              className="text-lg font-semibold text-foreground"
            >
              {formatearFecha(fecha)}
            </h2>

            <div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              role="list"
              aria-label={`Funciones del ${formatearFecha(fecha)}`}
            >
              {funcsDelDia.map((funcion) => (
                <ShowtimeCard
                  key={funcion.id}
                  funcion={funcion}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Container>
  );
}

interface ShowtimeCardProps {
  funcion: Funcion;
  onSelect: (showtimeId: number) => void;
}

/**
 * Tarjeta individual de una función (showtime).
 * Muestra hora, sala, tipo de sala y precio.
 */
function ShowtimeCard({ funcion, onSelect }: ShowtimeCardProps) {
  const hora = funcion.startTime.slice(0, 5); // HH:mm
  const sala = `${funcion.room ?? 'Sala'} - ${funcion.roomType ?? 'Standard'}`;
  const precio = `Bs ${funcion.price.toFixed(2)}`;

  const handleClick = () => {
    onSelect(funcion.id);
  };

  return (
    <Card
      variant="default"
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={handleClick}
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Función a las ${hora} en ${sala}, precio ${precio}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold tabular-nums">{hora}</span>
              <Badge variant="secondary" appearance="outline" size="sm">
                {sala}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{sala}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-lg font-bold text-primary tabular-nums">
              {precio}
            </span>
            <span className="text-xs text-muted-foreground">por entrada</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}