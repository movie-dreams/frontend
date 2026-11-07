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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HttpError } from '@/lib/http';
import { personaService } from '@/services/persona.service';
import { Persona } from '@/types/persona';
import { PersonasTable } from './personas-table';

// Consulta ya "asentada" (tras el debounce). Se cambia page a 1 al filtrar
// porque, si no, se pediria una pagina que puede no existir con el nuevo filtro.
interface Consulta {
  page: number;
  perPage: number;
  nombres: string;
  apellidos: string;
}

interface EstadoError {
  mensaje: string;
  solucion: string;
}

const DEBOUNCE_MS = 400;

// Traduce el error (con su codigo HTTP) a mensaje + posible solucion.
function describirError(error: unknown): EstadoError {
  const status = error instanceof HttpError ? error.status : undefined;
  const mensaje =
    error instanceof Error && error.message
      ? error.message
      : 'Ocurrió un error inesperado';

  if (status === 401) {
    return {
      mensaje,
      solucion:
        'Tu sesión expiró o no es válida. Vuelve a iniciar sesión para continuar.',
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
      solucion: 'Revisa los filtros de búsqueda e inténtalo de nuevo.',
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
      solucion:
        'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.',
    };
  }
  return {
    mensaje,
    solucion: 'Vuelve a intentarlo; si el problema continúa, contacta al administrador.',
  };
}

/**
 * Pantalla de Personas.
 *
 * Usa el listado paginado (GET /persons) y la busqueda por nombres/apellidos
 * (GET /persons/search). El search exige al menos un filtro, asi que sin
 * filtros se consulta el listado normal.
 */
export function PersonasPage() {
  const [consulta, setConsulta] = useState<Consulta>({
    page: 1,
    perPage: 10,
    nombres: '',
    apellidos: '',
  });
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<EstadoError | null>(null);
  const [reintento, setReintento] = useState(0);

  // Texto inmediato de los inputs (antes del debounce).
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');

  // Id de la ultima peticion lanzada: descarta respuestas que llegan tarde
  // (por ejemplo al teclear rapido) para que no pisen datos mas recientes.
  const idPeticion = useRef(0);

  // Debounce: solo se consulta cuando el usuario deja de teclear.
  useEffect(() => {
    const timer = setTimeout(() => {
      setConsulta((actual) => {
        const nuevosNombres = nombres.trim();
        const nuevosApellidos = apellidos.trim();
        if (
          actual.nombres === nuevosNombres &&
          actual.apellidos === nuevosApellidos
        ) {
          return actual;
        }
        return {
          ...actual,
          page: 1,
          nombres: nuevosNombres,
          apellidos: nuevosApellidos,
        };
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [nombres, apellidos]);

  // Carga de datos.
  useEffect(() => {
    const idActual = ++idPeticion.current;
    let vigente = true;

    setCargando(true);
    setError(null);

    const hayFiltros = consulta.nombres !== '' || consulta.apellidos !== '';
    const peticion = hayFiltros
      ? personaService.buscar({
          page: consulta.page,
          perPage: consulta.perPage,
          firstName: consulta.nombres || undefined,
          lastName: consulta.apellidos || undefined,
        })
      : personaService.listar(consulta.page, consulta.perPage);

    peticion
      .then((respuesta) => {
        if (!vigente || idActual !== idPeticion.current) return;
        setPersonas(respuesta.data);
        setTotal(respuesta.total);
      })
      .catch((e: unknown) => {
        if (!vigente || idActual !== idPeticion.current) return;
        setPersonas([]);
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

  const limpiarFiltros = () => {
    setNombres('');
    setApellidos('');
  };

  const busquedaActiva = consulta.nombres !== '' || consulta.apellidos !== '';

  return (
    <Container>
      <div className="space-y-6 py-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Personas</h1>
          <p className="text-sm text-muted-foreground">
            Consulta las personas registradas. Filtra por nombres o apellidos; la
            lista se actualiza sola.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor="filtro-nombres">Nombres</Label>
            <Input
              id="filtro-nombres"
              placeholder="Buscar por nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="filtro-apellidos">Apellidos</Label>
            <Input
              id="filtro-apellidos"
              placeholder="Buscar por apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
            />
          </div>
          {(nombres || apellidos) && (
            <Button variant="ghost" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          )}
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
              <AlertTitle>No se pudieron cargar las personas</AlertTitle>
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
                  <RotateCw />
                  Reintentar
                </Button>
              </AlertToolbar>
            </AlertContent>
          </Alert>
        ) : (
          <PersonasTable
            personas={personas}
            total={total}
            cargando={cargando}
            busquedaActiva={busquedaActiva}
            paginacion={{ pageIndex: consulta.page - 1, pageSize: consulta.perPage }}
            onPaginacionChange={manejarPaginacion}
          />
        )}
      </div>
    </Container>
  );
}
