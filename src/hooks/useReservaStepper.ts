import { useState, useCallback, useMemo } from 'react';
import { Funcion, Asiento } from '@/types/cartelera';
import { CrearReserva, ReservaCreada } from '@/types/reserva';
import { reservaService } from '@/services/reserva.service';
import { HttpError } from '@/lib/http';

type Step = 0 | 1 | 2 | 3 | 'exito';

interface UseReservaStepperReturn {
  // Estado
  step: Step;
  movieId: number | undefined;
  showtimeId: number | undefined;
  funcion: Funcion | undefined;
  asientos: Asiento[];
  elegidos: number[];
  reservationCode: string | undefined;
  error: string | null;
  confirmando: boolean;
  total: number;

  // Acciones
  selectMovie: (id: number) => void;
  selectShowtime: (id: number, funcion: Funcion) => void;
  setAsientos: (asientos: Asiento[]) => void;
  selectSeats: (ids: number[]) => void;
  goBack: () => void;
  goToStep: (step: Step) => void;
  confirm: (clientId: number) => Promise<ReservaCreada>;
  reset: () => void;

  // Computed
  canGoNext: boolean;
  isAtMovieStep: boolean;
  isAtShowtimeStep: boolean;
  isAtSeatsStep: boolean;
  isAtSummaryStep: boolean;
  isAtExitoStep: boolean;
}

/**
 * Hook que orquesta el flujo de 4 pasos + éxito:
 * 0 → Película → 1 → Showtime → 2 → Asientos → 3 → Resumen → Éxito
 *
 * Reglas:
 * - selectShowtime limpia elegidos y asientos
 * - goBack desde Paso 1 en /reservar va a Paso 0; en /reservar/:movieId no hace nada
 * - confirm(clientId) llama reservaService.crear(), maneja 409 propagando el error
 * - El hook NO muestra toasts; la página maneja la UI de errores
 */
export function useReservaStepper(
  initialMovieId?: number,
  isFromMovieDetail: boolean = false
): UseReservaStepperReturn {
  const [step, setStep] = useState<Step>(initialMovieId ? 1 : 0);
  const [movieId, setMovieId] = useState<number | undefined>(initialMovieId);
  const [showtimeId, setShowtimeId] = useState<number | undefined>();
  const [funcion, setFuncion] = useState<Funcion | undefined>();
  const [asientos, setAsientos] = useState<Asiento[]>([]);
  const [elegidos, setElegidos] = useState<number[]>([]);
  const [reservationCode, setReservationCode] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const total = useMemo(() => {
    if (!funcion || elegidos.length === 0) return 0;
    return elegidos.length * funcion.price;
  }, [funcion, elegidos]);

  const selectMovie = useCallback((id: number) => {
    setMovieId(id);
    setStep(1);
    setError(null);
  }, []);

  const selectShowtime = useCallback((id: number, funcionData: Funcion) => {
    setShowtimeId(id);
    setFuncion(funcionData);
    setAsientos([]); // Limpia asientos al cambiar de función
    setElegidos([]); // Limpia selección al cambiar de función
    setStep(2);
    setError(null);
  }, []);

  const selectSeats = useCallback((ids: number[]) => {
    setElegidos(ids);
    setError(null);
  }, []);

  const goBack = useCallback(() => {
    setError(null);
    switch (step) {
      case 1:
        // Paso 1: si venimos de /reservar/:movieId, no hacemos nada
        // Si venimos de /reservar, volvemos a Paso 0
        if (!isFromMovieDetail) {
          setMovieId(undefined);
          setShowtimeId(undefined);
          setFuncion(undefined);
          setAsientos([]);
          setStep(0);
        }
        break;
      case 2:
        // Paso 2: volvemos a Paso 1 (mantenemos showtimeId y funcion, limpiamos elegidos)
        setElegidos([]);
        setStep(1);
        break;
      case 3:
        // Paso 3: volvemos a Paso 2
        setStep(2);
        break;
      default:
        break;
    }
  }, [step, isFromMovieDetail]);

  const goToStep = useCallback((targetStep: Step) => {
    // Validaciones de transición
    if (targetStep === 1 && movieId === undefined) return;
    if (targetStep === 2 && showtimeId === undefined) return;
    if (targetStep === 3 && elegidos.length === 0) return;

    setStep(targetStep);
    setError(null);
  }, [movieId, showtimeId, elegidos.length]);

  const confirm = useCallback(async (clientId: number): Promise<ReservaCreada> => {
    if (!funcion || elegidos.length === 0) {
      const err = new Error('No hay asientos seleccionados');
      setError(err.message);
      throw err;
    }

    setConfirmando(true);
    setError(null);

    try {
      const reservationCodeGenerated = reservaService.generarCodigo(showtimeId!);
      const payload: CrearReserva = {
        clientId,
        showtimeId: showtimeId!,
        reservationCode: reservationCodeGenerated,
        status: 'PENDIENTE',
        total,
        details: elegidos.map((seatId) => ({
          seatId,
          price: funcion.price,
        })),
      };

      const response: ReservaCreada = await reservaService.crear(payload);
      setReservationCode(response.reservation.reservationCode);
      setStep('exito');
      return response;
    } catch (e) {
      if (e instanceof HttpError && e.status === 409) {
        setError(e.message);
        throw e;
      }
      const errorMsg = e instanceof Error ? e.message : 'No se pudo completar la reserva';
      setError(errorMsg);
      throw e;
    } finally {
      setConfirmando(false);
    }
  }, [funcion, showtimeId, elegidos, total]);

  const reset = useCallback(() => {
    setStep(initialMovieId ? 1 : 0);
    setMovieId(initialMovieId);
    setShowtimeId(undefined);
    setFuncion(undefined);
    setAsientos([]);
    setElegidos([]);
    setReservationCode(undefined);
    setError(null);
    setConfirmando(false);
  }, [initialMovieId]);

  // Computed flags
  const canGoNext = useMemo(() => {
    switch (step) {
      case 0:
        return movieId !== undefined;
      case 1:
        return showtimeId !== undefined;
      case 2:
        return elegidos.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  }, [step, movieId, showtimeId, elegidos.length]);

  const isAtMovieStep = step === 0;
  const isAtShowtimeStep = step === 1;
  const isAtSeatsStep = step === 2;
  const isAtSummaryStep = step === 3;
  const isAtExitoStep = step === 'exito';

  return {
    // Estado
    step,
    movieId,
    showtimeId,
    funcion,
    asientos,
    elegidos,
    reservationCode,
    error,
    confirmando,
    total,

    // Acciones
    selectMovie,
    selectShowtime,
    setAsientos,
    selectSeats,
    goBack,
    goToStep,
    confirm,
    reset,

    // Computed
    canGoNext,
    isAtMovieStep,
    isAtShowtimeStep,
    isAtSeatsStep,
    isAtSummaryStep,
    isAtExitoStep,
  };
}