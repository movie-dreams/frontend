import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ReservaExitoProps {
  reservationCode: string;
  onVolver: () => void;
}

/**
 * Pantalla de éxito (no modal) tras confirmar reserva.
 * - Ícono check, texto "¡Reserva confirmada!"
 * - Código grande: RES-...
 * - Botón "Volver al catálogo" → onVolver() (navega a /peliculas)
 * - useEffect: history.replace para evitar "Atrás" al formulario
 */
export function ReservaExito({ reservationCode, onVolver }: ReservaExitoProps) {
  const navigate = useNavigate();

  // Evitar que el botón "Atrás" del navegador vuelva al formulario de reserva
  useEffect(() => {
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const handleVolver = () => {
    onVolver();
    navigate('/peliculas');
  };

  return (
    <Container width="fluid" className="py-12 md:py-20">
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Card variant="default" className="w-full max-w-md text-center">
          <CardContent className="py-10 px-6 space-y-6">
            {/* Ícono check circle */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <svg
                className="h-8 w-8 text-green-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                ¡Reserva confirmada!
              </h2>
              <p className="text-muted-foreground">
                Tu reserva ha sido registrada correctamente.
              </p>
            </div>

            {/* Código de reserva */}
            <div className="space-y-2 p-4 bg-muted rounded-lg border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Código de reserva
              </p>
              <code className="text-xl font-mono font-bold text-foreground break-all">
                {reservationCode}
              </code>
              <p className="text-xs text-muted-foreground">
                Guarda este código para cualquier consulta.
              </p>
            </div>

            {/* Botón volver al catálogo */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleVolver}
            >
              Volver al catálogo
            </Button>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}