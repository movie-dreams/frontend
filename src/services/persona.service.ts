import { http } from '@/lib/http';
import { PaginacionParams } from '@/types/api';
import {
  ActualizarPersona,
  BuscarPersona,
  CrearPersona,
  PaginaPersonas,
  Persona,
  RespuestaPersona,
} from '@/types/persona';

// CRUD de personas: /persons  (POST es publico/registro; el resto ADMIN o Gerente)
export const personaService = {
  // POST /persons: registra persona + cliente y, con username/password, el usuario.
  async registrar(persona: CrearPersona): Promise<Persona> {
    const { data } = await http.post<RespuestaPersona>('/persons', persona);
    return data.data;
  },

  // GET /persons?page=&perPage=
  async listar(page = 1, perPage = 10): Promise<PaginaPersonas> {
    const { data } = await http.get<PaginaPersonas>('/persons', {
      params: { page, perPage } satisfies PaginacionParams,
    });
    return data;
  },

  // GET /persons/search?firstName=&lastName=&page=&perPage=
  async buscar(filtros: BuscarPersona): Promise<PaginaPersonas> {
    const { data } = await http.get<PaginaPersonas>('/persons/search', {
      params: filtros,
    });
    return data;
  },

  // GET /persons/:id
  async obtener(id: number): Promise<Persona> {
    const { data } = await http.get<RespuestaPersona>(`/persons/${id}`);
    return data.data;
  },

  // PATCH /persons/:id
  async actualizar(id: number, cambios: ActualizarPersona): Promise<Persona> {
    const { data } = await http.patch<RespuestaPersona>(
      `/persons/${id}`,
      cambios,
    );
    return data.data;
  },

  // DELETE /persons/:id
  async eliminar(id: number): Promise<void> {
    await http.delete(`/persons/${id}`);
  },
};
