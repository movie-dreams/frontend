import { useRef, useEffect, useCallback } from 'react';
import { useSeatSelection } from '@/hooks/useSeatSelection';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { Asiento } from '@/types/cartelera';

interface SeatMapProps {
  showtimeId: number;
  onContinue: () => void;
  onBack: () => void;
  onAsientosLoaded?: (asientos: Asiento[]) => void;
}

/**
 * Mapa de asientos reutilizable, accesible y responsive (Paso 2).
 * Reutiliza la lógica de `FuncionAsientosPage` vía `useSeatSelection`.
 */
export function SeatMap({ showtimeId, onContinue, onBack, onAsientosLoaded }: SeatMapProps) {
  const {
    porFila,
    elegidos,
    alternar,
    cargando,
    error,
    recargar,
    funcion,
    total,
    nombresElegidos,
    asientos,
  } = useSeatSelection(showtimeId);

  // Notificar al padre cuando se cargan los asientos (para el resumen)
  useEffect(() => {
    if (asientos.length > 0 && onAsientosLoaded) {
      onAsientosLoaded(asientos);
    }
  }, [asientos, onAsientosLoaded]);

  // Refs para botones de butacas libres (para navegación por teclado)
  const freeSeatButtonsRef = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Registrar ref de botones libres
  const registerFreeSeatButton = useCallback((seatId: number, button: HTMLButtonElement | null) => {
    if (button) {
      freeSeatButtonsRef.current.set(seatId, button);
    } else {
      freeSeatButtonsRef.current.delete(seatId);
    }
  }, []);

  // Manejador de navegación por teclado
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, seatId: number) => {
      const freeSeatIds = Array.from(freeSeatButtonsRef.current.keys()).sort((a, b) => a - b);
      const currentIndex = freeSeatIds.indexOf(seatId);

      if (currentIndex === -1) return;

      let targetIndex = -1;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          targetIndex = (currentIndex + 1) % freeSeatIds.length;
          break;
        case 'ArrowLeft':
          event.preventDefault();
          targetIndex = (currentIndex - 1 + freeSeatIds.length) % freeSeatIds.length;
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          alternar(seatId);
          return;
        default:
          return;
      }

      if (targetIndex >= 0) {
        const targetSeatId = freeSeatIds[targetIndex];
        const targetButton = freeSeatButtonsRef.current.get(targetSeatId);
        targetButton?.focus();
      }
    },
    [alternar]
  );

  // Limpiar refs al desmontar
  useEffect(() => {
    const refMap = freeSeatButtonsRef.current;
    return () => {
      refMap.clear();
    };
  }, []);

  if (cargando) {
    return (
      <Container>
        <div className="py-8 text-center text-muted-foreground">Cargando mapa de asientos…</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="py-8 text-center space-y-4">
          <p className="text-destructive" role="alert">{error}</p>
          <Button variant="secondary" onClick={recargar}>
            Reintentar
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container width="fluid">
      <div className="py-8">
        {/* Header con info de la función y botón "Cambiar función" */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {funcion && (
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-mono">
                  {funcion.movie ?? 'Función'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {funcion.room} · {funcion.roomType} · {funcion.date} · {funcion.startTime.slice(0, 5)}
                </p>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onBack}>
            Cambiar función
          </Button>
        </div>

        {/* Mapa de asientos */}
        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            {/* Pantalla */}
            <div
              className="rounded-t-[50%] border-t-4 border-primary/40 pb-2 pt-3 text-center text-xs uppercase tracking-widest text-muted-foreground"
              aria-hidden="true"
            >
              Pantalla
            </div>

            {/* Filas de butacas */}
            <div role="grid" className="mt-8 space-y-3 overflow-x-auto" aria-label="Mapa de asientos">
              {porFila.map(({ fila, butacas }) => (
                <div role="row" key={fila} className="flex items-center justify-center gap-2 flex-nowrap">
                  <span className="w-6 shrink-0 text-xs text-muted-foreground text-center">
                    {fila}
                  </span>
                  <div className="flex gap-1.5 flex-nowrap min-w-0">
                    {butacas.map((butaca) => {
                      const isSelected = elegidos.includes(butaca.id);
                      const isAvailable = butaca.available ?? true;
                      const seatId = butaca.id;

                      return (
                        <button
                          key={seatId}
                          type="button"
                          ref={(el) => registerFreeSeatButton(isAvailable && !isSelected ? seatId : -1, el)}
                          disabled={!isAvailable}
                          onClick={() => alternar(seatId)}
                          onKeyDown={(e) => handleKeyDown(e, seatId)}
                          aria-label={`Fila ${fila}, Butaca ${butaca.number}`}
                          aria-pressed={isSelected}
                          aria-disabled={!isAvailable}
                          role="gridcell"
                          tabIndex={isAvailable ? 0 : -1}
                          className={[
                            'size-7 rounded text-[10px] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            !isAvailable
                              ? 'cursor-not-allowed bg-muted text-muted-foreground/40'
                              : isSelected
                              ? 'bg-primary text-primary-foreground shadow-xs shadow-black/5'
                              : 'bg-secondary hover:bg-primary/30 text-secondary-foreground',
                          ].join(' ')}
                        >
                          {butaca.number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Leyenda */}
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground" role="group" aria-label="Leyenda de estados de butacas">
              <span className="flex items-center gap-2">
                <span className="size-4 rounded bg-secondary" aria-hidden="true" />
                Libre
              </span>
              <span className="flex items-center gap-2">
                <span className="size-4 rounded bg-primary" aria-hidden="true" />
                Elegido
              </span>
              <span className="flex items-center gap-2">
                <span className="size-4 rounded bg-muted" aria-hidden="true" />
                Ocupado
              </span>
            </div>

            {/* Resumen y acciones */}
            <div className="mt-8 rounded-xl border border-border p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-mono">
                    {elegidos.length === 0
                      ? 'Ninguna butaca elegida'
                      : `${elegidos.length} butaca{ elegidos.length > 1 ? 's' : '' }: ${nombresElegidos}`}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-mono">
                    Bs {total.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onBack}>
                    Cambiar función
                  </Button>
                  <Button
                    onClick={onContinue}
                    disabled={elegidos.length === 0}
                    className="min-w-[160px]"
                  >
                    Continuar al resumen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}