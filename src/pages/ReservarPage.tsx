import { useParams, useNavigate } from 'react-router';
import { useState, useCallback } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { useReservaStepper } from '@/hooks/useReservaStepper';
import { MovieSelector } from '@/components/reserva/MovieSelector';
import { ShowtimeSelector } from '@/components/reserva/ShowtimeSelector';
import { SeatMap } from '@/components/reserva/SeatMap';
import { ReservaResumen } from '@/components/reserva/ReservaResumen';
import { ReservaExito } from '@/components/reserva/ReservaExito';
import { carteleraService } from '@/services/cartelera.service';
import { toast } from 'sonner';
import { HttpError } from '@/lib/http';

/**
 * Página principal de reserva — Single-page stepper.
 * Rutas: /reservar (Paso 0) y /reservar/:movieId (Paso 1 directo)
 */
export function ReservarPage() {
  const { movieId: movieIdParam } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialMovieId = movieIdParam ? Number(movieIdParam) : undefined;
  const isFromMovieDetail = !!movieIdParam;

  const stepper = useReservaStepper(initialMovieId, isFromMovieDetail);

  // Destructurar funciones estables del stepper para evitar dependencias inestables
  const {
    funcion,
    elegidos,
    selectShowtime,
    confirm,
    goToStep,
    goBack,
    setAsientos,
  } = stepper;

  // Estado local para el paso 'exito' (el stepper no persiste reservationCode tras unmount)
  const [localReservationCode, setLocalReservationCode] = useState<string | undefined>();

  // Cargar la función completa al seleccionar showtime (el ShowtimeSelector solo da el ID)
  const handleSelectShowtime = useCallback(
    async (showtimeId: number) => {
      // Si ya tenemos la función cargada y coincide, usar esa
      if (funcion?.id === showtimeId && funcion) {
        selectShowtime(showtimeId, funcion);
        return;
      }

      // Cargar la función desde el servicio
      try {
        const response = await carteleraService.listarFunciones();
        const funcionData = response.data.find((f) => f.id === showtimeId);
        if (funcionData) {
          selectShowtime(showtimeId, funcionData);
        } else {
          toast.error('Función no encontrada');
        }
      } catch {
        toast.error('Error al cargar la función seleccionada');
      }
    },
    [funcion, selectShowtime]
  );

  // Confirmar reserva con user.id del contexto de auth
  const handleConfirm = useCallback(async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para confirmar la reserva');
      return;
    }
    if (!funcion || elegidos.length === 0) {
      toast.error('No hay asientos seleccionados');
      return;
    }

    try {
      const response = await confirm(user.id);
      setLocalReservationCode(response.reservation.reservationCode);
      // history.replace para evitar "Atrás" al formulario
      window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {
      if (e instanceof HttpError && e.status === 409) {
        toast.error(e.message || 'Algunos asientos ya no están disponibles');
        goToStep(2);
        // El SeatMap se recargará automáticamente al remountar con la misma showtimeId
        // porque useSeatSelection llama a recargar() en useEffect
      } else {
        toast.error('No se pudo completar la reserva');
      }
    }
  }, [user, funcion, elegidos.length, confirm, goToStep]);

  const handleVolverAlCatalogo = useCallback(() => {
    navigate('/peliculas');
  }, [navigate]);

  // Renderizado condicional según stepper.step
  switch (stepper.step) {
    case 0:
      return <MovieSelector onSelect={stepper.selectMovie} />;

    case 1:
      return (
        <ShowtimeSelector
          movieId={stepper.movieId!}
          onSelect={handleSelectShowtime}
          onBack={isFromMovieDetail ? undefined : goBack}
        />
      );

    case 2:
      return (
        <SeatMap
          showtimeId={stepper.showtimeId!}
          onContinue={() => goToStep(3)}
          onBack={goBack}
          onAsientosLoaded={setAsientos}
        />
      );

    case 3:
      if (!funcion) return null;
      return (
        <ReservaResumen
          funcion={funcion}
          elegidos={elegidos}
          asientos={stepper.asientos}
          onConfirm={handleConfirm}
          onBack={goBack}
        />
      );

    case 'exito':
      return (
        <ReservaExito
          reservationCode={localReservationCode ?? ''}
          onVolver={handleVolverAlCatalogo}
        />
      );

    default:
      return null;
  }
}