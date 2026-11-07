import { PaginatedResponse, SuccessResponse } from './api';

export type EstadoReserva = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';

// ============================================================
// Reservas  ->  CRUD /reservations
// ============================================================

// Un asiento dentro del cuerpo de la reserva (ReservationSeatDetailDto).
// En el backend el campo es seatId, no idAsiento.
export interface DetalleReservaPayload {
  seatId: number;
  price: number;
}

// POST /reservations (CreateReservationDto). La fecha la genera el backend:
// no se envia reservationDate.
export interface CrearReserva {
  clientId: number;
  showtimeId: number;
  reservationCode: string;
  status: EstadoReserva;
  total: number;
  details: DetalleReservaPayload[];
}

// PATCH /reservations/:id (UpdateReservationDto, sin details)
export interface ActualizarReserva {
  clientId?: number;
  showtimeId?: number;
  reservationCode?: string;
  status?: EstadoReserva;
  total?: number;
}

// ReservationDetail (respuesta)
export interface DetalleReserva {
  id: number;
  reservationId: number;
  seatId: number;
  price: number;
}

// Reservation (respuesta)
export interface Reserva {
  id: number;
  clientId: number;
  showtimeId: number;
  reservationDate: string;
  reservationCode: string;
  status: string;
  total: number;
  details?: DetalleReserva[];
}

// data de POST /reservations (ReservationCreatedDto): el codigo queda en
// data.reservation.reservationCode.
export interface ReservaCreada {
  reservation: Reserva;
  details: DetalleReserva[];
}

export type RespuestaReserva = SuccessResponse<Reserva>;
export type RespuestaReservaCreada = SuccessResponse<ReservaCreada>;
export type RespuestaReservas = SuccessResponse<Reserva[]>;
export type PaginaReservas = PaginatedResponse<Reserva>;

// ============================================================
// Detalles de reserva  ->  CRUD /reservation-details
// ============================================================

// POST /reservation-details (CreateReservationDetailDto)
export interface CrearDetalleReserva {
  reservationId: number;
  seatId: number;
  price: number;
}

// PATCH /reservation-details/:id
export type ActualizarDetalleReserva = Partial<CrearDetalleReserva>;

export type RespuestaDetalleReserva = SuccessResponse<DetalleReserva>;
export type RespuestaDetallesReserva = SuccessResponse<DetalleReserva[]>;
export type PaginaDetallesReserva = PaginatedResponse<DetalleReserva>;
