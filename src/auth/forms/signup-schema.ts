import { z } from 'zod';
import { normalizeEmail } from '@/lib/credentials';

/**
 * Validación del formulario de registro de usuario.
 *
 * El formulario solo captura correo, contraseña y confirmación; los datos de
 * persona los crea el servicio a partir del correo. El correo se normaliza
 * (recorte de espacios y minúsculas) antes de validarlo, de modo que las
 * reglas se aplican sobre su forma canónica y el máximo de longitud se mide
 * sobre esa misma forma.
 *
 * La confirmación es solo un control local: el esquema la exige y la compara
 * con la contraseña, pero nunca forma parte del cuerpo enviado al servicio.
 */

const MAX_EMAIL_LENGTH = 255;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 100;

const EMAIL_REQUIRED_MESSAGE = 'El correo es obligatorio';
const EMAIL_INVALID_MESSAGE = 'Ingresa un correo válido';
const EMAIL_TOO_LONG_MESSAGE = `El correo no puede superar los ${MAX_EMAIL_LENGTH} caracteres`;
const PASSWORD_REQUIRED_MESSAGE = 'La contraseña es obligatoria';
const PASSWORD_LENGTH_MESSAGE = `La contraseña debe tener entre ${MIN_PASSWORD_LENGTH} y ${MAX_PASSWORD_LENGTH} caracteres`;
const CONFIRMATION_REQUIRED_MESSAGE =
  'La confirmación de contraseña es obligatoria';
const PASSWORDS_MISMATCH_MESSAGE = 'Las contraseñas no coinciden';

/**
 * Correo del registro: obligatorio, con formato válido y de 255 caracteres
 * como máximo, medidos sobre el correo ya normalizado.
 *
 * Se valida después de la transformación para que los espacios exteriores no
 * cuenten en el límite y las mayúsculas no afecten al formato. Las reglas se
 * encadenan de la más general a la más específica: un correo vacío informa de
 * que es obligatorio y no de que el formato es incorrecto.
 */
const emailSchema = z
  .string({ required_error: EMAIL_REQUIRED_MESSAGE })
  .transform(normalizeEmail)
  .pipe(
    z
      .string()
      .min(1, { message: EMAIL_REQUIRED_MESSAGE })
      .max(MAX_EMAIL_LENGTH, { message: EMAIL_TOO_LONG_MESSAGE })
      .email({ message: EMAIL_INVALID_MESSAGE }),
  );

/**
 * Contraseña del registro: obligatoria y de 6 a 100 caracteres.
 *
 * No se recorta: los espacios forman parte de la contraseña tal como se
 * escribe.
 */
const passwordSchema = z
  .string({ required_error: PASSWORD_REQUIRED_MESSAGE })
  .min(1, { message: PASSWORD_REQUIRED_MESSAGE })
  .min(MIN_PASSWORD_LENGTH, { message: PASSWORD_LENGTH_MESSAGE })
  .max(MAX_PASSWORD_LENGTH, { message: PASSWORD_LENGTH_MESSAGE });

/**
 * Confirmación de contraseña: obligatoria y, por la comparación del objeto,
 * exactamente igual a la contraseña.
 */
const confirmPasswordSchema = z
  .string({ required_error: CONFIRMATION_REQUIRED_MESSAGE })
  .min(1, { message: CONFIRMATION_REQUIRED_MESSAGE });

/**
 * Construye el esquema de validación del formulario de registro.
 *
 * @returns Esquema `zod` del formulario, con los mensajes en español. El
 *   correo validado queda normalizado para que la pantalla pueda enviarlo sin
 *   volver a transformarlo.
 */
export function getSignupSchema() {
  return z
    .object({
      email: emailSchema,
      password: passwordSchema,
      confirmPassword: confirmPasswordSchema,
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: PASSWORDS_MISMATCH_MESSAGE,
      path: ['confirmPassword'],
    });
}

/** Valores del formulario de registro, ya validados y con el correo normalizado. */
export type SignupSchemaType = z.infer<ReturnType<typeof getSignupSchema>>;
