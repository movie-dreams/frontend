import { PaginatedResponse, SuccessResponse } from './api';

// ============================================================
// Salas  ->  GET /billboard/rooms y CRUD /rooms
// ============================================================

// Room / RoomCarteleraDto (mismas propiedades)
export interface Sala {
  id: number;
  name: string;
  capacity: number;
  type: string;
  isActive: boolean;
}

// GET /billboard/rooms/summary
export interface ResumenSala {
  id: number;
  room: string;
  capacity: number;
  registeredSeats: number;
}

// POST /rooms (CreateRoomDto)
export interface CrearSala {
  name: string;
  capacity: number;
  type: string;
  isActive?: boolean;
}

// PATCH /rooms/:id (UpdateRoomDto)
export type ActualizarSala = Partial<CrearSala>;

// ============================================================
// Asientos  ->  GET /billboard/seats y CRUD /seats
// ============================================================

// Seat / SeatCarteleraDto. Los campos room, seat y available solo vienen
// en los listados de cartelera.
export interface Asiento {
  id: number;
  roomId: number;
  room?: string;
  row: string;
  number: number;
  seat?: string;
  type: string;
  isActive: boolean;
  // Solo en GET /billboard/showtimes/:id/seats
  available?: boolean;
}

// POST /seats (CreateSeatDto)
export interface CrearAsiento {
  roomId: number;
  row: string;
  number: number;
  type: string;
  isActive?: boolean;
}

// PATCH /seats/:id (UpdateSeatDto)
export type ActualizarAsiento = Partial<CrearAsiento>;

// ============================================================
// Funciones  ->  GET /billboard/showtimes y CRUD /showtimes
// ============================================================

export type EstadoFuncion = 'PROGRAMADA' | 'CANCELADA' | 'FINALIZADA';

// Showtime / ShowtimeCarteleraDto. movie, room y roomType solo vienen en el
// listado de cartelera.
export interface Funcion {
  id: number;
  movieId: number;
  movie?: string;
  roomId: number;
  room?: string;
  roomType?: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: EstadoFuncion | string;
}

// POST /showtimes (CreateShowtimeDto)
export interface CrearFuncion {
  movieId: number;
  roomId: number;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status?: EstadoFuncion;
}

// PATCH /showtimes/:id (UpdateShowtimeDto)
export type ActualizarFuncion = Partial<CrearFuncion>;

export type RespuestaSalas = SuccessResponse<Sala[]>;
export type RespuestaSala = SuccessResponse<Sala>;
export type RespuestaResumenSalas = SuccessResponse<ResumenSala[]>;
export type RespuestaAsientos = SuccessResponse<Asiento[]>;
export type RespuestaAsiento = SuccessResponse<Asiento>;
export type RespuestaFunciones = SuccessResponse<Funcion[]>;
export type RespuestaFuncion = SuccessResponse<Funcion>;

export type PaginaSalas = PaginatedResponse<Sala>;
export type PaginaAsientos = PaginatedResponse<Asiento>;
export type PaginaFunciones = PaginatedResponse<Funcion>;
