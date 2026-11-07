import { http } from '@/lib/http';
import { PaginacionParams } from '@/types/api';
import {
  ActualizarSala,
  CrearSala,
  PaginaSalas,
  RespuestaSala,
  Sala,
} from '@/types/cartelera';

// CRUD de salas: /rooms  (POST/PATCH/DELETE requieren ADMIN o Gerente)
export const salaService = {
  // GET /rooms?page=&perPage=
  async listar(page = 1, perPage = 10): Promise<PaginaSalas> {
    const { data } = await http.get<PaginaSalas>('/rooms', {
      params: { page, perPage } satisfies PaginacionParams,
    });
    return data;
  },

  // GET /rooms/:id
  async obtener(id: number): Promise<Sala> {
    const { data } = await http.get<RespuestaSala>(`/rooms/${id}`);
    return data.data;
  },

  // POST /rooms
  async crear(sala: CrearSala): Promise<Sala> {
    const { data } = await http.post<RespuestaSala>('/rooms', sala);
    return data.data;
  },

  // PATCH /rooms/:id
  async actualizar(id: number, cambios: ActualizarSala): Promise<Sala> {
    const { data } = await http.patch<RespuestaSala>(`/rooms/${id}`, cambios);
    return data.data;
  },

  // DELETE /rooms/:id
  async eliminar(id: number): Promise<void> {
    await http.delete(`/rooms/${id}`);
  },
};
