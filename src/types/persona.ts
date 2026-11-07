import { PaginacionParams, PaginatedResponse, SuccessResponse } from './api';

// ============================================================
// Personas  ->  CRUD /persons
// ============================================================

// Person (respuesta de /persons)
export interface Persona {
  id: number;
  firstName?: string;
  lastName?: string;
  document?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
}

// POST /persons (CreatePersonDto). Si se envian username y password, el
// backend tambien crea el usuario de acceso con rol Cliente.
export interface CrearPersona {
  firstName?: string;
  lastName?: string;
  document?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  username?: string;
  password?: string;
}

// PATCH /persons/:id (UpdatePersonDto)
export type ActualizarPersona = Partial<CrearPersona>;

// GET /persons/search (SearchPersonDto)
export interface BuscarPersona extends PaginacionParams {
  firstName?: string;
  lastName?: string;
}

export type RespuestaPersona = SuccessResponse<Persona>;
export type PaginaPersonas = PaginatedResponse<Persona>;

// ============================================================
// Clientes  ->  CRUD /clients
// ============================================================

// Client (respuesta de /clients)
export interface Cliente {
  id: number;
  registrationDate: string;
  isActive: boolean;
}

// POST /clients (CreateClientDto): asocia una persona existente como cliente.
export interface CrearCliente {
  id: number;
  isActive?: boolean;
}

// PATCH /clients/:id (UpdateClientDto)
export type ActualizarCliente = Partial<CrearCliente>;

export type RespuestaCliente = SuccessResponse<Cliente>;
export type PaginaClientes = PaginatedResponse<Cliente>;
