import { useCallback, useEffect, useMemo, useState } from 'react';
import { carteleraService } from '@/services/cartelera.service';
import { Asiento, Funcion } from '@/types/cartelera';
import { calcularTotal } from '@/lib/reserva-calculos';

interface UseSeatSelectionReturn {
  asientos: Asiento[];
  porFila: Array<{ fila: string; butacas: Asiento[] }>;
  elegidos: number[];
  alternar: (seatId: number) => void;
  limpiar: () => void;
  cargando: boolean;
  error: string | null;
  recargar: () => Promise<void>;
  funcion: Funcion | undefined;
  total: number;
  nombresElegidos: string;
}

/**
 * Hook para selección de asientos (extraído de FuncionAsientosPage).
 * @param showtimeId - Identificador de la función
 * @returns Estado completo del mapa de asientos + acciones
 */
export function useSeatSelection(showtimeId: number): UseSeatSelectionReturn {
  const [asientos, setAsientos] = useState<Asiento[]>([]);
  const [funcion, setFuncion] = useState<Funcion | undefined>();
  const [elegidos, setElegidos] = useState<number[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [butacas, funciones] = await Promise.all([
        carteleraService.asientosDeFuncion(showtimeId),
        carteleraService.listarFunciones(),
      ]);
      setAsientos(butacas.data);
      setFuncion(funciones.data.find((f) => f.id === showtimeId));
      // Limpiar selección al recargar (útil tras 409)
      setElegidos([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar asientos');
    } finally {
      setCargando(false);
    }
  }, [showtimeId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const porFila = useMemo(() => {
    const mapa = new Map<string, Asiento[]>();
    for (const asiento of asientos) {
      const fila = mapa.get(asiento.row) ?? [];
      fila.push(asiento);
      mapa.set(asiento.row, fila);
    }

    // Convertir Map a array para evitar problemas con MapIterator en TypeScript
    const entradas: Array<[string, Asiento[]]> = [];
    mapa.forEach((butacas, fila) => {
      entradas.push([fila, butacas]);
    });

    return entradas
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fila, butacas]) => ({
        fila,
        butacas: butacas.sort((x, y) => x.number - y.number),
      }));
  }, [asientos]);

  function alternar(seatId: number) {
    setElegidos((previos) =>
      previos.includes(seatId)
        ? previos.filter((x) => x !== seatId)
        : [...previos, seatId],
    );
  }

  function limpiar() {
    setElegidos([]);
  }

  const total = calcularTotal(elegidos, funcion?.price ?? 0);

  const nombresElegidos = asientos
    .filter((a) => elegidos.includes(a.id))
    .map((a) => a.seat)
    .join(', ');

  return {
    asientos,
    porFila,
    elegidos,
    alternar,
    limpiar,
    cargando,
    error,
    recargar: cargar,
    funcion,
    total,
    nombresElegidos,
  };
}