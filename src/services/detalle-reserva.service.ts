import { http } from '@/lib/http';
import {
  ActualizarDetalleReserva,
  CrearDetalleReserva,
  DetalleReserva,
  PaginaDetallesReserva,
  RespuestaDetalleReserva,
  RespuestaDetallesReserva,
} from '@/types/reserva';

// CRUD de detalles de reserva: /reservation-details
export const detalleReservaService = {
  // GET /reservation-details?page=&perPage=
  async listar(page = 1, perPage = 10): Promise<PaginaDetallesReserva> {
    const { data } = await http.get<PaginaDetallesReserva>(
      '/reservation-details',
      { params: { page, perPage } },
    );
    return data;
  },

  // GET /reservation-details?reservationId=
  async listarPorReserva(reservationId: number): Promise<DetalleReserva[]> {
    const { data } = await http.get<RespuestaDetallesReserva>(
      '/reservation-details',
      { params: { reservationId } },
    );
    return data.data;
  },

  // GET /reservation-details/:id
  async obtener(id: number): Promise<DetalleReserva> {
    const { data } = await http.get<RespuestaDetalleReserva>(
      `/reservation-details/${id}`,
    );
    return data.data;
  },

  // POST /reservation-details
  async crear(detalle: CrearDetalleReserva): Promise<DetalleReserva> {
    const { data } = await http.post<RespuestaDetalleReserva>(
      '/reservation-details',
      detalle,
    );
    return data.data;
  },

  // PATCH /reservation-details/:id
  async actualizar(
    id: number,
    cambios: ActualizarDetalleReserva,
  ): Promise<DetalleReserva> {
    const { data } = await http.patch<RespuestaDetalleReserva>(
      `/reservation-details/${id}`,
      cambios,
    );
    return data.data;
  },

  // DELETE /reservation-details/:id
  async eliminar(id: number): Promise<void> {
    await http.delete(`/reservation-details/${id}`);
  },
};
