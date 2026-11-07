// Forma comun de TODAS las respuestas del backend (ResponseUtils).
// Un endpoint puede devolver exito simple o paginado; nunca devuelve el
// arreglo pelado.

export interface SuccessResponse<T> {
  status: 'success';
  message?: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  status: 'success';
  message?: string;
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  timestamp: string;
}

// Parametros de paginacion que acepta el backend (PaginationParamsDto).
// Van en la query string: ?page=1&perPage=10
export interface PaginacionParams {
  page?: number;
  perPage?: number;
}
