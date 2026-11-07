import { useEffect, useRef, useState } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { PaginationState } from '@tanstack/react-table';
import { Container } from '@/components/common/container';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  AlertToolbar,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { HttpError } from '@/lib/http';
import { funcionService } from '@/services/funcion.service';
import { Funcion, EstadoFuncion, PaginaFunciones } from '@/types/cartelera';
import { FuncionesTable } from './funciones-table';
import { formatearFecha } from '@/lib/showtime-format';

// Consulta ya "asentada" para la paginación.
interface Consulta {
  page: number;
  perPage: number;
}

interface EstadoError {
  mensaje: string;
  solucion: string;
}

/**
 * Traduce el error (con su código HTTP) a mensaje + posible solución.
 */
function describirError(error: unknown): EstadoError {
  const status = error instanceof HttpError ? error.status : undefined;
  const mensaje =
    error instanceof Error && error.message
      ? error.message
      : 'Ocurrió un error inesperado';

  if (status === 401) {
    return {
      mensaje,
      solucion: 'Tu sesión expiró o no es válida. Vuelve a iniciar sesión para continuar.',
    };
  }
  if (status === 403) {
    return {
      mensaje,
      solucion: 'Esta sección es solo para administradores y gerentes.',
    };
  }
  if (status === 400) {
    return {
      mensaje,
      solucion: 'Revisa los parámetros e inténtalo de nuevo.',
    };
  }
  if (status !== undefined && status >= 500) {
    return {
      mensaje,
      solucion: 'El servidor tuvo un problema. Espera unos segundos y reintenta.',
    };
  }
  if (status === undefined) {
    return {
      mensaje,
      solucion: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.',
    };
  }
  return {
    mensaje,
    solucion: 'Vuelve a intentarlo; si el problema continúa, contacta al administrador.',
  };
}

/**
 * Obtiene el color del badge según el estado de la función.
 */
function obtenerColorEstado(estado: EstadoFuncion | string): 'primary' | 'success' | 'warning' | 'destructive' | 'secondary' {
  switch (estado) {
    case 'PROGRAMADA':
      return 'primary';
    case 'FINALIZADA':
      return 'success';
    case 'CANCELADA':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * Cabecera del listado: título y botón "Crear función" (solo para roles autorizados).
 */
function ListHeader({ onCrear }: { onCrear: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Funciones</h1>
      <Button variant="primary" onClick={onCrear}>
        Crear función
      </Button>
    </div>
  );
}

export function FuncionesPage() {
  const [consulta, setConsulta] = useState<Consulta>({
    page: 1,
    perPage: 10,
  });
  const [funciones, setFunciones] = useState<Funcion[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<EstadoError | null>(null);
  const [reintento, setReintento] = useState(0);

  // Id de la última petición lanzada: descarta respuestas que llegan tarde.
  const idPeticion = useRef(0);

  // Carga de datos paginada.
  useEffect(() => {
    const idActual = ++idPeticion.current;
    let vigente = true;

    setCargando(true);
    setError(null);

    funcionService.listar(consulta.page, consulta.perPage)
      .then((respuesta: PaginaFunciones) => {
        if (!vigente || idActual !== idPeticion.current) return;
        setFunciones(respuesta.data);
        setTotal(respuesta.total);
      })
      .catch((e: unknown) => {
        if (!vigente || idActual !== idPeticion.current) return;
        setFunciones([]);
        setTotal(0);
        setError(describirError(e));
      })
      .finally(() => {
        if (!vigente || idActual !== idPeticion.current) return;
        setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [consulta, reintento]);

  const manejarPaginacion = (nueva: PaginationState) => {
    setConsulta((actual) => {
      const page = nueva.pageIndex + 1;
      const perPage = nueva.pageSize;
      if (actual.page === page && actual.perPage === perPage) return actual;
      return { ...actual, page, perPage };
    });
  };

  return (
    <Container>
      <div className="space-y-6 py-6">
        <div className="space-y-1">
          <ListHeader onCrear={() => window.location.href = '/funciones/nueva'} />
          <p className="text-sm text-muted-foreground">
            Listado paginado de funciones programadas. Usa la paginación para navegar.
          </p>
        </div>

        {error ? (
          <Alert
            variant="destructive"
            appearance="light"
            size="lg"
            icon="destructive"
          >
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertContent>
              <AlertTitle>No se pudieron cargar las funciones</AlertTitle>
              <AlertDescription>
                <p>{error.mensaje}</p>
                <p className="text-muted-foreground">{error.solucion}</p>
              </AlertDescription>
              <AlertToolbar>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setReintento((n) => n + 1)}
                >
                  <RotateCw className="mr-1 h-4 w-4" />
                  Reintentar
                </Button>
              </AlertToolbar>
            </AlertContent>
          </Alert>
        ) : (
          <FuncionesTable
            funciones={funciones}
            total={total}
            cargando={cargando}
            paginacion={{ pageIndex: consulta.page - 1, pageSize: consulta.perPage }}
            onPaginacionChange={manejarPaginacion}
            formatearFecha={formatearFecha}
            formatearHora={(_date: string, time: string) => {
              const [hours, minutes] = time.split(':').map(Number);
              return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }}
            obtenerColorEstado={obtenerColorEstado}
          />
        )}
      </div>
    </Container>
  );
}