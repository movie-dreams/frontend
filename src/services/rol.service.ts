import { http } from '@/lib/http';
import {
  ActualizarRol,
  CrearRol,
  PaginaRoles,
  RespuestaRol,
  Rol,
} from '@/types/seguridad';

// CRUD de roles: /roles  (solo ADMIN)
export const rolService = {
  // GET /roles?page=&perPage=
  async listar(page = 1, perPage = 10): Promise<PaginaRoles> {
    const { data } = await http.get<PaginaRoles>('/roles', {
      params: { page, perPage },
    });
    return data;
  },

  // GET /roles/:id
  async obtener(id: number): Promise<Rol> {
    const { data } = await http.get<RespuestaRol>(`/roles/${id}`);
    return data.data;
  },

  // POST /roles
  async crear(rol: CrearRol): Promise<Rol> {
    const { data } = await http.post<RespuestaRol>('/roles', rol);
    return data.data;
  },

  // PATCH /roles/:id
  async actualizar(id: number, cambios: ActualizarRol): Promise<Rol> {
    const { data } = await http.patch<RespuestaRol>(`/roles/${id}`, cambios);
    return data.data;
  },

  // DELETE /roles/:id
  async eliminar(id: number): Promise<void> {
    await http.delete(`/roles/${id}`);
  },
};
