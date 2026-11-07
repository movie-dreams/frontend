import { http } from '@/lib/http';
import {
  ActualizarReserva,
  CrearReserva,
  PaginaReservas,
  Reserva,
  ReservaCreada,
  RespuestaReserva,
  RespuestaReservaCreada,
  RespuestaReservas,
} from '@/types/reserva';

// CRUD de reservas: /reservations  (POST y GET requieren token)
export const reservaService = {
  // POST /reservations
  async crear(reserva: CrearReserva): Promise<ReservaCreada> {
    const { data } = await http.post<RespuestaReservaCreada>(
      '/reservations',
      reserva,
    );
    return data.data;
  },

  // GET /reservations?page=&perPage=
  async listar(page = 1, perPage = 10): Promise<PaginaReservas> {
    const { data } = await http.get<PaginaReservas>('/reservations', {
      params: { page, perPage },
    });
    return data;
  },

  // GET /reservations?clientId=  (el backend responde un arreglo dentro de data)
  async listarPorCliente(clientId: number): Promise<Reserva[]> {
    const { data } = await http.get<RespuestaReservas>('/reservations', {
      params: { clientId },
    });
    return data.data;
  },

  // GET /reservations/:id
  async obtener(id: number): Promise<Reserva> {
    const { data } = await http.get<RespuestaReserva>(`/reservations/${id}`);
    return data.data;
  },

  // PATCH /reservations/:id (requiere ADMIN o Gerente)
  async actualizar(id: number, cambios: ActualizarReserva): Promise<Reserva> {
    const { data } = await http.patch<RespuestaReserva>(
      `/reservations/${id}`,
      cambios,
    );
    return data.data;
  },

  // DELETE /reservations/:id (requiere ADMIN o Gerente)
  async eliminar(id: number): Promise<void> {
    await http.delete(`/reservations/${id}`);
  },

  // Codigo visible para el usuario. El backend no lo genera: lo recibe.
  generarCodigo(idFuncion: number): string {
    // Fecha actual en base 36: un numero largo se vuelve texto corto.
    const gestion = Date.now().toString(36).slice(-12);
    return `RES-${idFuncion}-${gestion}`.toUpperCase();
  },
};
