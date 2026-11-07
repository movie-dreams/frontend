import { SuccessResponse } from './api';

// POST /auth/login (LoginDto)
export interface Credenciales {
  username: string;
  password: string;
}

// data de la respuesta de login (TokenResponseDto)
export interface TokenResponse {
  token: string;
}

export type RespuestaLogin = SuccessResponse<TokenResponse>;

// GET /auth/me y payload del JWT (JwtPayload). Ojo: el claim es "username",
// no "usuario".
export interface UsuarioAutenticado {
  id: number;
  username: string;
  roles: string[];
}

export interface PayloadToken extends UsuarioAutenticado {
  iat?: number;
  exp?: number;
}

export type RespuestaMe = SuccessResponse<UsuarioAutenticado>;

// Sesion que guarda el proveedor en memoria.
export type UsuarioSesion = UsuarioAutenticado;

// Nombres exactos que usa el backend (role.enum).
export type NombreRol = 'Administrador' | 'Gerente' | 'Cliente';
