import { PaginatedResponse, SuccessResponse } from './api';
import { NombreRol } from './auth';

// ============================================================
// Usuarios  ->  CRUD /users  (POST público; el resto debería ser ADMIN)
// ============================================================

// User (respuesta). Nunca incluye la contrasena.
export interface Usuario {
  id: number;
  username: string;
  createdAt?: string;
}

// POST /users (CreateUserDto): alta pública de una cuenta.
// El servicio crea la persona y el usuario con rol Cliente a partir del correo.
export interface CrearUsuario {
  email: string;
  password: string;
}

// PATCH /users/:id (UpdateUserDto). Contrato independiente del de creación.
export interface ActualizarUsuario {
  id?: number;
  username?: string;
  password?: string;
}

export type RespuestaUsuario = SuccessResponse<Usuario>;
export type PaginaUsuarios = PaginatedResponse<Usuario>;

// ============================================================
// Roles  ->  CRUD /roles  (solo ADMIN)
// ============================================================

export interface Rol {
  id: number;
  name: string;
}

// POST /roles (CreateRoleDto). El nombre debe ser uno de los del enum Role.
export interface CrearRol {
  name: NombreRol;
}

// PATCH /roles/:id (UpdateRoleDto)
export type ActualizarRol = Partial<CrearRol>;

export type RespuestaRol = SuccessResponse<Rol>;
export type PaginaRoles = PaginatedResponse<Rol>;

// ============================================================
// Asignaciones de rol  ->  CRUD /user-roles  (solo ADMIN)
// ============================================================

export interface RolUsuario {
  id: string;
  userId: number;
  roleId: number;
  startDate?: string;
  endDate?: string;
  status: boolean;
  role?: Rol;
}

// POST /user-roles (CreateUserRoleDto)
export interface CrearRolUsuario {
  userId: number;
  roleId: number;
  startDate?: string;
  endDate?: string;
  status?: boolean;
}

// PATCH /user-roles/:id (UpdateUserRoleDto)
export type ActualizarRolUsuario = Partial<CrearRolUsuario>;

export type RespuestaRolUsuario = SuccessResponse<RolUsuario>;
export type RespuestaRolesUsuario = SuccessResponse<RolUsuario[]>;
export type PaginaRolesUsuario = PaginatedResponse<RolUsuario>;
