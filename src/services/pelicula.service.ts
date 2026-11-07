import { env } from '@/config/env';
import { http } from '@/lib/http';
import {
  ActualizarPelicula,
  CrearPelicula,
  Pelicula,
  RespuestaPelicula,
  RespuestaPeliculas,
} from '@/types/pelicula';

// El backend monta este recurso en /movies (antes /peliculas).
export const peliculaService = {
  // GET /movies  ->  { status, message, data, total, page, perPage, totalPages }
  async listarPeliculas(page = 1, perPage = 20): Promise<RespuestaPeliculas> {
    const { data } = await http.get<RespuestaPeliculas>('/movies', {
      params: { page, perPage },
    });
    return data;
  },

  // GET /movies/:id
  async obtenerPelicula(id: number): Promise<Pelicula> {
    const { data } = await http.get<RespuestaPelicula>(`/movies/${id}`);
    return data.data;
  },

  // POST /movies. Acepta JSON sin archivos o multipart con hasta 5 imagenes.
  async crearPelicula(
    pelicula: CrearPelicula,
    imagenes: File[] = [],
  ): Promise<Pelicula> {
    const form = new FormData();
    for (const [clave, valor] of Object.entries(pelicula)) {
      if (valor !== undefined && valor !== null) {
        form.append(clave, String(valor));
      }
    }
    for (const imagen of imagenes) {
      form.append('images', imagen);
    }

    const { data } = await http.post<RespuestaPelicula>('/movies', form);
    return data.data;
  },

  // PATCH /movies/:id
  async actualizarPelicula(
    id: number,
    cambios: ActualizarPelicula,
  ): Promise<Pelicula> {
    const { data } = await http.patch<RespuestaPelicula>(
      `/movies/${id}`,
      cambios,
    );
    return data.data;
  },

  // DELETE /movies/:id  ->  204 sin cuerpo
  async eliminarPelicula(id: number): Promise<void> {
    await http.delete(`/movies/${id}`);
  },

  // url para el navegador (portada): nombreArchivo viene en imagenes[].fileName
  urlImagen(nombreArchivo: string): string {
    return `${env.apiUrl}/files/movies/${nombreArchivo}`;
  },
};
