import { http } from '@/lib/http';
import { SuccessResponse } from '@/types/api';
import {
  Funcion,
  RespuestaAsientos,
  RespuestaFunciones,
  RespuestaResumenSalas,
  RespuestaSalas,
} from '@/types/cartelera';

// Lecturas publicas de cartelera. El backend las agrupa bajo /billboard.
export const carteleraService = {
  // GET /billboard/showtimes?movieId=  (todas las funciones o las de una pelicula)
  async listarFunciones(movieId?: number): Promise<SuccessResponse<Funcion[]>> {
    const { data } = await http.get<RespuestaFunciones>(
      '/billboard/showtimes',
      { params: { movieId } },
    );
    return data;
  },

  // GET /billboard/rooms?onlyActive=
  async listarSalas(onlyActive?: boolean): Promise<RespuestaSalas> {
    const { data } = await http.get<RespuestaSalas>('/billboard/rooms', {
      params: { onlyActive },
    });
    return data;
  },

  // GET /billboard/rooms/summary
  async resumenSalas(): Promise<RespuestaResumenSalas> {
    const { data } = await http.get<RespuestaResumenSalas>(
      '/billboard/rooms/summary',
    );
    return data;
  },

  // GET /billboard/seats?roomId=
  async listarAsientos(roomId?: number): Promise<RespuestaAsientos> {
    const { data } = await http.get<RespuestaAsientos>('/billboard/seats', {
      params: { roomId },
    });
    return data;
  },

  // GET /billboard/showtimes/:id/seats  (trae el flag available)
  async asientosDeFuncion(idFuncion: number): Promise<RespuestaAsientos> {
    const { data } = await http.get<RespuestaAsientos>(
      `/billboard/showtimes/${idFuncion}/seats`,
    );
    return data;
  },
};
