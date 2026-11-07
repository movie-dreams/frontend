import { PaginatedResponse, SuccessResponse } from './api';

// Imagen de una pelicula (MovieImage). El archivo se sirve desde
// GET /files/movies/:fileName; aqui solo viene la metadata.
export interface ImagenPelicula {
  id: number;
  fileName: string;
  sizeBytes: number;
  movieId: number;
}

// Respuesta de GET /movies, GET /movies/:id (Movie)
export interface Pelicula {
  id: number;
  title: string;
  synopsis?: string;
  durationMinutes: number;
  releaseDate?: string;
  isActive: boolean;
  images?: ImagenPelicula[];
}

// POST /movies (CreateMovieDto). releaseDate es "YYYY-MM-DD".
export interface CrearPelicula {
  title: string;
  synopsis?: string;
  durationMinutes: number;
  releaseDate?: string;
  isActive?: boolean;
}

// PATCH /movies/:id (UpdateMovieDto)
export type ActualizarPelicula = Partial<CrearPelicula>;

export type RespuestaPeliculas = PaginatedResponse<Pelicula>;
export type RespuestaPelicula = SuccessResponse<Pelicula>;
