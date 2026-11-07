import { http } from '@/lib/http';
import { SuccessResponse } from '@/types/api';
import {
  ActualizarFuncion,
  CrearFuncion,
  Funcion,
  PaginaFunciones,
  RespuestaFuncion,
} from '@/types/cartelera';

// CRUD de funciones: /showtimes  (POST/PATCH/DELETE requieren ADMIN o Gerente)
export const funcionService = {
  // GET /showtimes?page=&perPage=
  async listar(page = 1, perPage = 10): Promise<PaginaFunciones> {
    const { data } = await http.get<PaginaFunciones>('/showtimes', {
      params: { page, perPage },
    });
    return data;
  },

  // GET /showtimes?movieId=  (el backend responde un arreglo dentro de data)
  async listarPorPelicula(movieId: number): Promise<Funcion[]> {
    const { data } = await http.get<SuccessResponse<Funcion[]>>('/showtimes', {
      params: { movieId },
    });
    return data.data;
  },

  // GET /showtimes/:id
  async obtener(id: number): Promise<Funcion> {
    const { data } = await http.get<RespuestaFuncion>(`/showtimes/${id}`);
    return data.data;
  },

  // POST /showtimes  (date "YYYY-MM-DD", horas "HH:mm:ss")
  async crear(funcion: CrearFuncion): Promise<Funcion> {
    try {
      const { data } = await http.post<RespuestaFuncion>('/showtimes', funcion);
      return data.data;
    } catch (error) {
      const apiError = error as {
        response?: {
          data?: {
            message?: string;
            [key: string]: unknown;
          };
          status: number;
        };
      };
      if (
        apiError.response &&
        apiError.response.status === 409
      ) {
        const message =
          apiError.response.data?.message || 'Conflicto al crear la función';
        const structuredError = new Error(message);
        structuredError.name = 'HttpError';
        // structuredError.status = 409;
        throw structuredError;
      }
      throw error;
    }
  },

  // PATCH /showtimes/:id
  async actualizar(
    id: number,
    cambios: ActualizarFuncion,
  ): Promise<Funcion> {
    const { data } = await http.patch<RespuestaFuncion>(
      `/showtimes/${id}`,
      cambios,
    );
    return data.data;
  },

  // DELETE /showtimes/:id
  async eliminar(id: number): Promise<void> {
    await http.delete(`/showtimes/${id}`);
  },
};
