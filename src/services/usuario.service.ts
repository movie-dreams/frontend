import { http } from '@/lib/http';
import {
  ActualizarUsuario,
  CrearUsuario,
  PaginaUsuarios,
  RespuestaUsuario,
  Usuario,
} from '@/types/seguridad';

// CRUD de usuarios: /users
// POST /users es una operación pública de registro: el backend crea la persona,
// el cliente y el usuario con rol Cliente a partir de { email, password }.
// GET/PATCH/DELETE siguen existiendo y deberían estar protegidos para ADMIN
// (riesgo reportado; no forma parte de esta feature).
export const usuarioService = {
  // GET /users?page=&perPage=
  async listar(page = 1, perPage = 10): Promise<PaginaUsuarios> {
    const { data } = await http.get<PaginaUsuarios>('/users', {
      params: { page, perPage },
    });
    return data;
  },

  // GET /users/:id
  async obtener(id: number): Promise<Usuario> {
    const { data } = await http.get<RespuestaUsuario>(`/users/${id}`);
    return data.data;
  },

  // POST /users  (público) — cuerpo exacto: { email, password }
  async crear(usuario: CrearUsuario): Promise<Usuario> {
    const { data } = await http.post<RespuestaUsuario>('/users', usuario);
    return data.data;
  },

  // PATCH /users/:id
  async actualizar(id: number, cambios: ActualizarUsuario): Promise<Usuario> {
    const { data } = await http.patch<RespuestaUsuario>(
      `/users/${id}`,
      cambios,
    );
    return data.data;
  },

  // DELETE /users/:id
  async eliminar(id: number): Promise<void> {
    await http.delete(`/users/${id}`);
  },
};
