import { http } from '@/lib/http';
import {
  Credenciales,
  RespuestaLogin,
  RespuestaMe,
  UsuarioAutenticado,
} from '@/types/auth';

const CLAVE_TOKEN = 'cine_token';

export const authService = {
  async login(credenciales: Credenciales): Promise<string> {
    const { data } = await http.post<RespuestaLogin>('/auth/login', credenciales);
    const token = data?.data?.token;
    if (!token) {
      throw new Error('El servidor no devolvio un token');
    }
    return token;
  },

  // GET /auth/me: devuelve los datos del token vigente (requiere sesion).
  async me(): Promise<UsuarioAutenticado> {
    const { data } = await http.get<RespuestaMe>('/auth/me');
    return data.data;
  },

  // guardar el token en el navegador
  guardarToken(token: string) {
    try {
      localStorage.setItem(CLAVE_TOKEN, token);
    } catch {
      console.log('No se pudo guardar el token en modo privado');
    }
  },
  obtenerToken(): string | null {
    try {
      return localStorage.getItem(CLAVE_TOKEN);
    } catch {
      return null;
    }
  },
  borrarToken() {
    try {
      localStorage.removeItem(CLAVE_TOKEN);
    } catch {
      // no se hace nada
    }
  },
};
