import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { peliculaService } from '@/services/pelicula.service';
import { carteleraService } from '@/services/cartelera.service';
import { Pelicula } from '@/types/pelicula';
import { Funcion } from '@/types/cartelera';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';


interface MovieWithShowtimes {
  pelicula: Pelicula;
  funcionesProgramadas: Funcion[];
  cantidadFunciones: number;
}

interface MovieSelectorProps {
  onSelect: (movieId: number) => void;
}

/**
 * Paso 0: Selector de película para `/reservar`.
 * Muestra grid de películas con al menos una función PROGRAMADA.
 */
export function MovieSelector({ onSelect }: MovieSelectorProps) {
  const [peliculasConFunciones, setPeliculasConFunciones] = useState<MovieWithShowtimes[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function cargarPeliculasConFunciones() {
      setCargando(true);
      setError(null);

      try {
        // Obtener lista de películas (paginación simple: page=1, perPage=50)
        const respuestaPeliculas = await peliculaService.listarPeliculas(1, 50);
        const peliculas = respuestaPeliculas.data;

        // Para cada película, obtener sus funciones y filtrar PROGRAMADA
        const resultados = await Promise.all(
          peliculas.map(async (pelicula) => {
            const respuestaFunciones = await carteleraService.listarFunciones(pelicula.id);
            const todasLasFunciones = respuestaFunciones.data;
            const funcionesProgramadas = todasLasFunciones.filter(
              (f) => f.status === 'PROGRAMADA',
            );
            return {
              pelicula,
              funcionesProgramadas,
              cantidadFunciones: funcionesProgramadas.length,
            };
          }),
        );

        // Filtrar solo películas con al menos una función programada
        const conFunciones = resultados.filter((r) => r.cantidadFunciones > 0);

        if (mounted) {
          setPeliculasConFunciones(conFunciones);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : 'Error al cargar las películas');
        }
      } finally {
        if (mounted) {
          setCargando(false);
        }
      }
    }

    cargarPeliculasConFunciones();

    return () => {
      mounted = false;
    };
  }, []);

  // Render skeleton cards while loading
  if (cargando) {
    return (
      <Container>
        <div className="py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="h-full flex flex-col">
                <CardContent className="p-0 flex-1 flex flex-col">
                  <Skeleton className="aspect-[2/3] w-full rounded-t-xl" />
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-6 w-1/4 mt-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container>
        <div className="py-8 text-center">
          <div className="space-y-4">
            <p className="text-destructive" role="alert">
              {error}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  // Render empty state
  if (peliculasConFunciones.length === 0) {
    return (
      <Container>
        <div className="py-16 text-center">
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
              No hay películas con funciones disponibles
            </p>
            <Link to="/peliculas">
              <Button variant="secondary" size="lg">
                Volver al catálogo
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  // Render movie grid
  return (
    <Container>
      <div className="py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {peliculasConFunciones.map(({ pelicula, cantidadFunciones }) => (
            <MovieCard
              key={pelicula.id}
              pelicula={pelicula}
              cantidadFunciones={cantidadFunciones}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </Container>
  );
}

interface MovieCardProps {
  pelicula: Pelicula;
  cantidadFunciones: number;
  onSelect: (movieId: number) => void;
}

function MovieCard({ pelicula, cantidadFunciones, onSelect }: MovieCardProps) {
  const poster = pelicula.images?.[0]?.fileName;
  const posterUrl = poster ? peliculaService.urlImagen(poster) : null;

  return (
    <Card
      className="h-full flex flex-col cursor-pointer transition-all hover:shadow-lg hover:border-primary"
      onClick={() => onSelect(pelicula.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(pelicula.id);
        }
      }}
    >
      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Poster */}
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-xl bg-muted">
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={`Cartel de ${pelicula.title}`}
              className="h-full w-full object-cover transition-transform hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Sin imagen
            </div>
          )}
          {/* Badge with number of showtimes */}
          <div className="absolute bottom-2 right-2">
            <Badge variant="primary" appearance="light" size="sm" className="px-2 py-1">
              {cantidadFunciones} {cantidadFunciones === 1 ? 'función' : 'funciones'} disponible{cantidadFunciones !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Movie info */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div className="space-y-1 min-h-[3.5rem]">
            <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-card-foreground">
              {pelicula.title}
            </h3>
            {pelicula.releaseDate && (
              <p className="text-xs text-muted-foreground">
                Estreno: {pelicula.releaseDate.slice(0, 10)}
              </p>
            )}
          </div>
          {/* Visual indicator that card is clickable */}
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <span>Seleccionar</span>
            <svg
              className="size-4 opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}