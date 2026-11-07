import { http } from '@/lib/http';
import {
  ActualizarAsiento,
  Asiento,
  CrearAsiento,
  PaginaAsientos,
  RespuestaAsiento,
  RespuestaAsientos,
} from '@/types/cartelera';

// CRUD de asientos: /seats  (POST/PATCH/DELETE requieren ADMIN o Gerente)
export const asientoService = {
  // GET /seats?page=&perPage=
  async listar(page = 1, perPage = 10): Promise<PaginaAsientos> {
    const { data } = await http.get<PaginaAsientos>('/seats', {
      params: { page, perPage },
    });
    return data;
  },

  // GET /seats?roomId=  (el backend responde un arreglo dentro de data)
  async listarPorSala(roomId: number): Promise<Asiento[]> {
    const { data } = await http.get<RespuestaAsientos>('/seats', {
      params: { roomId },
    });
    return data.data;
  },

  // GET /seats/:id
  async obtener(id: number): Promise<Asiento> {
    const { data } = await http.get<RespuestaAsiento>(`/seats/${id}`);
    return data.data;
  },

  // POST /seats
  async crear(asiento: CrearAsiento): Promise<Asiento> {
    const { data } = await http.post<RespuestaAsiento>('/seats', asiento);
    return data.data;
  },

  // PATCH /seats/:id
  async actualizar(
    id: number,
    cambios: ActualizarAsiento,
  ): Promise<Asiento> {
    const { data } = await http.patch<RespuestaAsiento>(
      `/seats/${id}`,
      cambios,
    );
    return data.data;
  },

  // DELETE /seats/:id
  async eliminar(id: number): Promise<void> {
    await http.delete(`/seats/${id}`);
  },
};
