import {
  ColumnDef,
  PaginationState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Users } from 'lucide-react';
import { Persona } from '@/types/persona';
import { DataGrid, DataGridContainer } from '@/components/ui/data-grid';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';

// Fecha ISO -> texto corto en espanol. Si viene vacia o invalida, guion.
function formatearFecha(valor?: string): string {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(fecha);
}

// Las columnas viven fuera del componente: son estaticas y no dependen de props.
const columnas: ColumnDef<Persona>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    meta: {
      headerClassName: 'w-[80px]',
      cellClassName: 'text-muted-foreground',
    },
  },
  {
    accessorKey: 'firstName',
    header: 'Nombres',
    cell: ({ row }) => row.original.firstName ?? '—',
  },
  {
    accessorKey: 'lastName',
    header: 'Apellidos',
    cell: ({ row }) => row.original.lastName ?? '—',
  },
  {
    accessorKey: 'document',
    header: 'Documento',
    cell: ({ row }) => row.original.document ?? '—',
  },
  {
    accessorKey: 'email',
    header: 'Correo',
    cell: ({ row }) => row.original.email ?? '—',
  },
  {
    accessorKey: 'phone',
    header: 'Teléfono',
    cell: ({ row }) => row.original.phone ?? '—',
  },
  {
    accessorKey: 'birthDate',
    header: 'Fecha de nacimiento',
    cell: ({ row }) => formatearFecha(row.original.birthDate),
  },
];

interface PersonasTableProps {
  personas: Persona[];
  total: number;
  cargando: boolean;
  /** true si hay un filtro activo: cambia el texto del estado vacio. */
  busquedaActiva: boolean;
  paginacion: PaginationState;
  onPaginacionChange: (paginacion: PaginationState) => void;
}

/**
 * Tabla de personas con paginacion server-side sobre el DataGrid existente.
 *
 * `manualPagination` + `rowCount` le dicen a @tanstack/react-table que el
 * total de filas y el corte de pagina los decide el backend, no el cliente.
 */
export function PersonasTable({
  personas,
  total,
  cargando,
  busquedaActiva,
  paginacion,
  onPaginacionChange,
}: PersonasTableProps) {
  const table = useReactTable({
    data: personas,
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
    <div className="flex flex-col items-center gap-1 py-4">
      <Users className="size-6 text-muted-foreground" />
      <p className="font-medium text-foreground">No se encontraron personas</p>
      <p className="text-xs text-muted-foreground">
        {busquedaActiva
          ? 'Prueba con otros nombres o apellidos.'
          : 'Todavía no hay personas registradas.'}
      </p>
    </div>
  );

  return (
    <DataGrid
      table={table}
      recordCount={total}
      isLoading={cargando}
      loadingMode="skeleton"
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
