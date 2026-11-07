import { useState } from 'react';
import { Funcion, Asiento } from '@/types/cartelera';
import { calcularTotal, redondearTotal } from '@/lib/reserva-calculos';
import { formatearShowtime } from '@/lib/showtime-format';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import * as Sheet from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ReservaResumenProps {
  funcion: Funcion;
  elegidos: number[];
  asientos: Asiento[];
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * Paso 3: Panel de resumen con botón "Confirmar reserva".
 * Según D-05: SIN modal, botón directo en el panel.
 * Responsive: En móvil (<md), panel colapsable en Sheet (Radix).
 */
export function ReservaResumen({
  funcion,
  elegidos,
  asientos,
  onConfirm,
  onBack,
}: ReservaResumenProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  // Derivados
  const asientosElegidos = asientos.filter((a) => elegidos.includes(a.id));
  const nombres = asientosElegidos.map((a) => a.seat || `${a.row} ${a.number}`).join(', ');
  const precioUnitario = funcion.price;
  const totalSinRedondear = calcularTotal(elegidos, precioUnitario);
  const total = redondearTotal(totalSinRedondear);
  const fechaHora = formatearShowtime(funcion.date, funcion.startTime);
  const sala = `${funcion.room ?? 'Sala'} - ${funcion.roomType ?? 'Standard'}`;

  // Contenido del panel de resumen
  const panelContent = (
    <div className="space-y-4" data-slot="reserva-resumen">
      {/* Título película */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {funcion.movie ?? 'Película'}
        </h2>
        <p className="text-sm text-muted-foreground">{fechaHora}</p>
      </div>

      <Separator />

      {/* Sala */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Sala</span>
        <span className="font-medium">{sala}</span>
      </div>

      <Separator />

      {/* Asientos elegidos */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          Asientos ({asientosElegidos.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {asientosElegidos.map((asiento) => (
            <Badge
              key={asiento.id}
              variant="secondary"
              appearance="outline"
              size="sm"
              className="px-2 py-1"
            >
              {asiento.seat || `${asiento.row} ${asiento.number}`}
            </Badge>
          ))}
        </div>
        {nombres && (
          <p className="text-xs text-muted-foreground mt-2 truncate" title={nombres}>
            {nombres}
          </p>
        )}
      </div>

      <Separator />

      {/* Precio unitario y total */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Precio unitario</span>
          <span className="font-medium tabular-nums">Bs {precioUnitario.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total</span>
          <span className="text-primary tabular-nums">Bs {total.toFixed(2)}</span>
        </div>
      </div>

      <Separator />

      {/* Botones de acción */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={onConfirm}
          disabled={elegidos.length === 0}
        >
          Confirmar reserva
        </Button>
        <Button
          variant="outline"
          size="md"
          className="w-full"
          onClick={onBack}
        >
          Cambiar función
        </Button>
      </div>
    </div>
  );

  // En desktop (>= md): panel lateral fijo
  // En móvil (<md): Sheet colapsable con trigger "Ver resumen"
  return (
    <>
      {/* Trigger para móvil - solo visible en <md */}
      <Sheet.Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <Sheet.SheetTrigger asChild>
          <Button
            variant="outline"
            size="md"
            className="w-full md:hidden gap-2"
            aria-label="Ver resumen de la reserva"
          >
            <svg
              className="size-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Ver resumen</span>
            <span className="ml-auto font-mono tabular-nums">Bs {total.toFixed(2)}</span>
          </Button>
        </Sheet.SheetTrigger>

        <Sheet.SheetContent side="bottom" className="p-4 sm:max-h-[80vh]">
          <Sheet.SheetHeader>
            <Sheet.SheetTitle>Resumen de la reserva</Sheet.SheetTitle>
            <Sheet.SheetDescription>
              Revisa los detalles antes de confirmar
            </Sheet.SheetDescription>
          </Sheet.SheetHeader>
          <Sheet.SheetBody className="max-h-[60vh] overflow-y-auto">
            {panelContent}
          </Sheet.SheetBody>
        </Sheet.SheetContent>
      </Sheet.Sheet>

      {/* Panel lateral fijo en desktop (>= md) */}
      <div className="hidden md:block">
        <Container width="fluid" className="py-4">
          <div className="bg-card border rounded-xl p-4 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
            {panelContent}
          </div>
        </Container>
      </div>
    </>
  );
}