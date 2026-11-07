import { http } from '@/lib/http';
import {
  ActualizarRolUsuario,
  CrearRolUsuario,
  PaginaRolesUsuario,
  RespuestaRolUsuario,
  RespuestaRolesUsuario,
  RolUsuario,
} from '@/types/seguridad';

// CRUD de asignaciones de rol: /user-roles  (solo ADMIN)
export const rolUsuarioService = {
  // GET /user-roles?page=&perPage=
  async listar(page = 1, perPage = 10): Promise<PaginaRolesUsuario> {
    const { data } = await http.get<PaginaRolesUsuario>('/user-roles', {
      params: { page, perPage },
    });
    return data;
  },

  // GET /user-roles?userId=
  async listarPorUsuario(userId: number): Promise<RolUsuario[]> {
    const { data } = await http.get<RespuestaRolesUsuario>('/user-roles', {
      params: { userId },
    });
    return data.data;
  },

  // GET /user-roles/:id
  async obtener(id: string): Promise<RolUsuario> {
    const { data } = await http.get<RespuestaRolUsuario>(`/user-roles/${id}`);
    return data.data;
  },

  // POST /user-roles
  async crear(rolUsuario: CrearRolUsuario): Promise<RolUsuario> {
    const { data } = await http.post<RespuestaRolUsuario>(
      '/user-roles',
      rolUsuario,
    );
    return data.data;
  },

  // PATCH /user-roles/:id
  async actualizar(
    id: string,
    cambios: ActualizarRolUsuario,
  ): Promise<RolUsuario> {
    const { data } = await http.patch<RespuestaRolUsuario>(
      `/user-roles/${id}`,
      cambios,
    );
    return data.data;
  },

  // DELETE /user-roles/:id
  async eliminar(id: string): Promise<void> {
    await http.delete(`/user-roles/${id}`);
  },
};
