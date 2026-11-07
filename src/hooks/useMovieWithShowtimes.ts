import { useCallback, useEffect, useState } from 'react';
import { peliculaService } from '@/services/pelicula.service';
import { carteleraService } from '@/services/cartelera.service';
import { Pelicula } from '@/types/pelicula';
import { Funcion } from '@/types/cartelera';

interface UseMovieWithShowtimesReturn {
  pelicula: Pelicula | undefined;
  funciones: Funcion[];
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
}

/**
 * Hook para cargar película + sus funciones programadas.
 * Extraído de PeliculasDellatePage.
 * @param movieId - Identificador de la película
 * @returns Estado de carga + datos + función recargar
 */
export function useMovieWithShowtimes(movieId: number): UseMovieWithShowtimesReturn {
  const [pelicula, setPelicula] = useState<Pelicula | undefined>();
  const [funciones, setFunciones] = useState<Funcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [peliculaHallada, funcionesHalladas] = await Promise.all([
        peliculaService.obtenerPelicula(movieId),
        carteleraService.listarFunciones(movieId),
      ]);
      setPelicula(peliculaHallada);
      // Filtrar solo funciones programadas
      const programadas = funcionesHalladas.data.filter((f) => f.status === 'PROGRAMADA');
      setFunciones(programadas);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar película y funciones');
    } finally {
      setCargando(false);
    }
  }, [movieId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return {
    pelicula,
    funciones,
    cargando,
    error,
    recargar: cargar,
  };
}