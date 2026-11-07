import { http } from '@/lib/http';
import { PaginacionParams } from '@/types/api';
import {
  ActualizarCliente,
  Cliente,
  CrearCliente,
  PaginaClientes,
  RespuestaCliente,
} from '@/types/persona';

// CRUD de clientes: /clients  (requiere ADMIN o Gerente)
export const clienteService = {
  // GET /clients?page=&perPage=
  async listar(page = 1, perPage = 10): Promise<PaginaClientes> {
    const { data } = await http.get<PaginaClientes>('/clients', {
      params: { page, perPage } satisfies PaginacionParams,
    });
    return data;
  },

  // GET /clients/:id
  async obtener(id: number): Promise<Cliente> {
    const { data } = await http.get<RespuestaCliente>(`/clients/${id}`);
    return data.data;
  },

  // POST /clients: asocia una persona existente como cliente.
  async crear(cliente: CrearCliente): Promise<Cliente> {
    const { data } = await http.post<RespuestaCliente>('/clients', cliente);
    return data.data;
  },

  // PATCH /clients/:id
  async actualizar(id: number, cambios: ActualizarCliente): Promise<Cliente> {
    const { data } = await http.patch<RespuestaCliente>(
      `/clients/${id}`,
      cambios,
    );
    return data.data;
  },

  // DELETE /clients/:id
  async eliminar(id: number): Promise<void> {
    await http.delete(`/clients/${id}`);
  },
};
