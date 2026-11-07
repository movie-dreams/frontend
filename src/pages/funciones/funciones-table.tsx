import {
  ColumnDef,
  PaginationState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Funcion, EstadoFuncion } from '@/types/cartelera';
import { DataGrid, DataGridContainer } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinners';
import { Edit, Trash2 } from 'lucide-react';

// Las columnas viven fuera del componente: son estáticas y no dependen de props.
function crearColumnas<
  TFormatearFecha extends (date: string) => string,
  TFormatearHora extends (date: string, time: string) => string,
  TObtenerColorEstado extends (estado: EstadoFuncion | string) => 'primary' | 'success' | 'warning' | 'destructive' | 'secondary'
>({
  formatearFecha,
  formatearHora,
  obtenerColorEstado,
}: {
  formatearFecha: TFormatearFecha;
  formatearHora: TFormatearHora;
  obtenerColorEstado: TObtenerColorEstado;
}): ColumnDef<Funcion>[] {
  return [
    {
      accessorKey: 'movie',
      header: 'Película',
      cell: ({ row }) => row.original.movie ?? '—',
    },
    {
      accessorKey: 'room',
      header: 'Sala',
      cell: ({ row }) => row.original.room ?? '—',
    },
    {
      accessorKey: 'date',
      header: 'Fecha',
      cell: ({ row }) => formatearFecha(row.original.date),
    },
    {
      accessorKey: 'startTime',
      header: 'Hora inicio',
      cell: ({ row }) => formatearHora(row.original.date, row.original.startTime),
    },
    {
      accessorKey: 'endTime',
      header: 'Hora fin',
      cell: ({ row }) => formatearHora(row.original.date, row.original.endTime),
    },
    {
      accessorKey: 'price',
      header: 'Precio',
      cell: ({ row }) => `Bs ${row.original.price.toFixed(2)}`,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const estado = row.original.status as EstadoFuncion | string;
        const color = obtenerColorEstado(estado);
        return (
          <Badge variant={color} appearance="light" size="md">
            {estado}
          </Badge>
        );
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: () => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled
            title="Editar (próximamente)"
            aria-label="Editar función"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled
            title="Eliminar (próximamente)"
            aria-label="Eliminar función"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
}

interface FuncionesTableProps {
  funciones: Funcion[];
  total: number;
  cargando: boolean;
  paginacion: PaginationState;
  onPaginacionChange: (paginacion: PaginationState) => void;
  formatearFecha: (date: string) => string;
  formatearHora: (date: string, time: string) => string;
  obtenerColorEstado: (estado: EstadoFuncion | string) => 'primary' | 'success' | 'warning' | 'destructive' | 'secondary';
}

/**
 * Tabla de funciones con paginación server-side sobre el DataGrid existente.
 *
 * `manualPagination` + `rowCount` le dicen a @tanstack/react-table que el
 * total de filas y el corte de página los decide el backend, no el cliente.
 */
export function FuncionesTable({
  funciones,
  total,
  cargando,
  paginacion,
  onPaginacionChange,
  formatearFecha,
  formatearHora,
  obtenerColorEstado,
}: FuncionesTableProps) {
  const columnas = crearColumnas({ formatearFecha, formatearHora, obtenerColorEstado });

  const table = useReactTable({
    data: funciones,
    columns: columnas,
    state: { pagination: paginacion },
    onPaginationChange: (actualizador) => {
      const siguiente =
        typeof actualizador === 'function'
          ? actualizador(paginacion)
          : actualizador;
      onPaginacionChange(siguiente);
    },
    manualPagination: true,
    rowCount: total,
    getCoreRowModel: getCoreRowModel(),
  });

  const estadoVacio = (
    <div className="flex flex-col items-center gap-2 py-8">
      <Spinner className="size-8 text-muted-foreground" />
      <p className="font-medium text-foreground">No hay funciones registradas</p>
      <p className="text-xs text-muted-foreground">
        Crea la primera función usando el botón «Crear función».
      </p>
    </div>
  );

  return (
    <DataGrid
      table={table}
      recordCount={total}
      isLoading={cargando}
      loadingMode="spinner"
      emptyMessage={estadoVacio}
      tableLayout={{ headerBackground: true, rowBorder: true, width: 'auto' }}
    >
      <DataGridContainer>
        <DataGridTable />
      </DataGridContainer>
      <DataGridPagination />
    </DataGrid>
  );
}