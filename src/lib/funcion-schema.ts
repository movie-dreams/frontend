/**
 * Esquema de validación Zod para el formulario de crear función.
 *
 * Campos validados:
 *  - movieId: número entero positivo.
 *  - roomId: número entero positivo.
 *  - date: formato YYYY-MM-DD.
 *  - startTime: formato HH:mm:ss (regex reutilizada).
 *  - endTime: formato HH:mm:ss (regex reutilizada).
 *  - price: número positivo con máximo 2 decimales.
 *  - status: opcional, debe ser PROGRAMADA | CANCELADA | FINALIZADA.
 *
 * Se reutiliza la regex constante para startTime y endTime para evitar
 * duplicidad y garantizar consistencia en los formatos de hora.
 */

import { z } from 'zod';

// Regex para formato de hora HH:mm:ss: ^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$
const HOURS_SECONDS_REGEX = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

/**
 * Formato de fecha YYYY-MM-DD regex.
 */
const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Esquema Zod para los valores del formulario de crear función.
 *
 * @returns Esquema `zod` validando un objeto con movieId, roomId, date,
 *   startTime, endTime, price y status.
 */
export const funcionFormSchema = z
  .object({
    movieId: z
      .number()
      .int()
      .positive(),
    roomId: z
      .number()
      .int()
      .positive(),
    date: z
      .string()
      .refine((value) => DATE_FORMAT_REGEX.test(value), {
        message: 'La fecha debe tener formato YYYY-MM-DD',
      }),
    startTime: z
      .string()
      .refine((value) => HOURS_SECONDS_REGEX.test(value), {
        message: 'La hora de inicio debe tener formato HH:mm:ss',
      }),
    endTime: z
      .string()
      .refine((value) => HOURS_SECONDS_REGEX.test(value), {
        message: 'La hora de fin debe tener formato HH:mm:ss',
      }),
    price: z
      .number()
      .positive()
      .refine((value) => {
        // Validar máximo 2 decimales
        const decimalPart = value.toString().split('.')[1];
        return decimalPart === undefined || decimalPart.length <= 2;
      }, {
        message: 'El precio debe tener como máximo 2 decimales',
      }),
    status: z
      .string()
      .optional()
      .refine((value) => {
        if (value === undefined || value === null) return true;
        return ['PROGRAMADA', 'CANCELADA', 'FINALIZADA'].includes(value);
      }, {
        message: 'El estado debe ser PROGRAMADA, CANCELADA o FINALIZADA',
      }),
  })
  .refine(
    (data) => data.startTime && data.endTime,
    {
      message: 'Ambas horas (inicio y fin) son obligatorias',
      path: ['startTime'],
    }
  )
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      // Validar que endTime sea posterior a startTime mismo día
      const [startH, startM, startS] = data.startTime.split(':').map(Number);
      const [endH, endM, endS] = data.endTime.split(':').map(Number);

      const startSeconds = startH * 3600 + startM * 60 + startS;
      const endSeconds = endH * 3600 + endM * 60 + endS;

      return endSeconds > startSeconds;
    },
    {
      message: 'La hora de fin debe ser posterior a la hora de inicio',
      path: ['endTime'],
    }
  );

/**
 * Tipo TypeScript inferido del esquema Zod.
 * Representa los valores validados y tipados del formulario de crear función.
 */
export type FuncionFormValues = z.infer<typeof funcionFormSchema>;

/**
 * Tipo TypeScript simplificado para el envío al servicio.
 * Corresponde a la estructura `CrearFuncion` del backend, pero con los
 * tipos ya validados por el esquema Zod.
 */
export type CrearFuncionForm = {
  movieId: number;
  roomId: number;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status?: 'PROGRAMADA' | 'CANCELADA' | 'FINALIZADA';
};