import axios from 'axios';
import { env } from "@/config/env";
import { authService } from '@/services/auth.service';

// cliente http 

export const http = axios.create({
    // axios va http://localhost:3000/api/v1/peliculas
    baseURL: env.apiUrl,
    timeout:  10000, // 10 seg
});



// request: corre ANTES de que salga la peticion, por eso aqui se pega el token
http.interceptors.request.use((config) => {
    const token = authService.obtenerToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config;
})



// Error de la API con el codigo HTTP adjunto: las pantallas lo usan para
// decidir que solucion mostrar (401 sesion vencida, 403 sin permisos, etc.).
export class HttpError extends Error {
    status?: number;

    constructor(mensaje: string, status?: number) {
        super(mensaje);
        this.name = 'HttpError';
        this.status = status;
    }
}

// El backend no siempre responde igual: los guards devuelven
// {statusCode, message}, la validacion devuelve message como arreglo y los
// servicios {status, message}. Aqui se deja siempre un texto legible.
function normalizarMensaje(message: unknown): string {
    if (Array.isArray(message)) {
        return message.join('. ');
    }
    if (typeof message === 'string' && message.trim()) {
        return message;
    }
    return 'No se puede conectar con el servidor';
}

http.interceptors.response.use(
    // si sale bien
    (respuesta) => respuesta,
    // si sale mal
    (error) => {
        // backend responde {status, message, timestamp} o el formato de Nest
        const mensaje = normalizarMensaje(error.response?.data?.message);
        return Promise.reject(new HttpError(mensaje, error.response?.status));
    },
)



