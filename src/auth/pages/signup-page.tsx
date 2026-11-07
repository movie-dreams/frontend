import { useRef, useState } from 'react';
import { useAuth } from '@/auth/context/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ScreenLoader } from '@/components/common/screen-loader';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinners';
import { HttpError } from '@/lib/http';
import { usuarioService } from '@/services/usuario.service';
import { Usuario } from '@/types/seguridad';
import { getSignupSchema, SignupSchemaType } from '../forms/signup-schema';

// Mensajes generales del registro. Se mantienen en español y sin detalles
// técnicos del servicio (RNF-2, RNF-3).
const EMAIL_TAKEN_MESSAGE =
  'Ese correo ya está registrado. Inicia sesión o usa otro correo.';
const UNCONFIRMED_ACCOUNT_MESSAGE =
  'No pudimos confirmar si tu cuenta quedó creada. Revisa tu conexión e inténtalo de nuevo.';
const UNEXPECTED_ERROR_MESSAGE =
  'No se pudo completar el registro. Inténtalo de nuevo en unos minutos.';
const ACCOUNT_CREATED_MESSAGE =
  'Tu cuenta quedó creada. Inicia sesión para continuar.';

interface FormErrorState {
  message: string;
  showSigninLink: boolean;
}

/**
 * Traduce el fallo del alta a un mensaje comprensible para la persona.
 *
 * La clasificación se hace por el estado HTTP que adjunta `HttpError`: un
 * conflicto indica que el correo ya existe, una validación conserva el motivo
 * legible del servicio, la ausencia de estado corresponde a red o tiempo de
 * espera agotado y cualquier otro estado es un fallo no previsto.
 */
function describeCreationError(error: unknown): FormErrorState {
  if (error instanceof HttpError) {
    if (error.status === 409) {
      return { message: EMAIL_TAKEN_MESSAGE, showSigninLink: true };
    }

    if (error.status === 400) {
      return { message: error.message, showSigninLink: false };
    }

    if (error.status !== undefined) {
      return { message: UNEXPECTED_ERROR_MESSAGE, showSigninLink: false };
    }
  }

  // Sin estado HTTP no se sabe si el servicio llegó a crear la cuenta; se
  // informa de que no se pudo confirmar (red, tiempo agotado o fallo ajeno).
  return { message: UNCONFIRMED_ACCOUNT_MESSAGE, showSigninLink: false };
}

/**
 * Pantalla pública de registro.
 *
 * Solo captura correo, contraseña y su confirmación. Al enviar crea la cuenta
 * con el servicio, inicia sesión automáticamente y deja a la persona en el
 * listado de películas. Si el alta ya se confirmó pero el inicio de sesión
 * falla, el formulario se sustituye por un aviso para ingresar manualmente.
 */
export function SignUpPage() {
  const { loading, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<FormErrorState | null>(null);
  const [createdAccountEmail, setCreatedAccountEmail] = useState<
    string | null
  >(null);

  // Guard adicional al estado: impide un segundo POST incluso si dos eventos
  // de envío llegan antes de que React vuelva a pintar el botón deshabilitado.
  const submittingRef = useRef(false);

  const form = useForm<SignupSchemaType>({
    resolver: zodResolver(getSignupSchema()),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // No se pinta el formulario hasta saber si hay sesión (RF-2).
  if (loading) {
    return <ScreenLoader />;
  }

  // Una persona con sesión no puede registrar otra cuenta (RF-3).
  if (isAuthenticated) {
    return <Navigate to="/peliculas" replace />;
  }

  async function onSubmit({ email, password }: SignupSchemaType) {
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setFormError(null);

    let usuario: Usuario;

    try {
      // `email` ya llega normalizado por el esquema y la confirmación nunca se
      // envía al servicio (RF-16, RF-17).
      usuario = await usuarioService.crear({ email, password });
    } catch (error) {
      setFormError(describeCreationError(error));

      if (error instanceof HttpError && error.status === 409) {
        // Correo duplicado: se conserva el correo (en su forma normalizada) y
        // se limpian las contraseñas para pasar a iniciar sesión (RF-20).
        form.setValue('email', email);
        form.setValue('password', '');
        form.setValue('confirmPassword', '');
      }

      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    // La cuenta ya existe. Cualquier fallo desde aquí se informa como cuenta
    // creada (RF-24), sin volver a registrarla.
    try {
      // El auto-login usa el username devuelto por el alta, sin normalizarlo
      // de nuevo (RF-18).
      await login(usuario.username, password);
    } catch {
      setCreatedAccountEmail(usuario.username || email);
      form.setValue('password', '');
      form.setValue('confirmPassword', '');
      return;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }

    // El registro siempre termina en el listado de películas, sin usar `next`
    // (RF-19).
    navigate('/peliculas', { replace: true });
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Regístrate para reservar tus butacas
        </p>
      </div>

      {createdAccountEmail ? (
        <Alert variant="success" appearance="light">
          <AlertIcon>
            <CheckCircle2 className="h-4 w-4" />
          </AlertIcon>
          <AlertContent>
            <AlertTitle>{ACCOUNT_CREATED_MESSAGE}</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                Correo:{' '}
                <span className="font-medium">{createdAccountEmail}</span>
              </p>
              <Button asChild variant="primary" className="w-full">
                <Link to="/auth/signin">Iniciar sesión</Link>
              </Button>
            </AlertDescription>
          </AlertContent>
        </Alert>
      ) : (
        <>
          {formError && (
            <Alert variant="destructive">
              <AlertIcon>
                <AlertCircle className="h-4 w-4" />
              </AlertIcon>
              <AlertContent>
                <AlertTitle>{formError.message}</AlertTitle>
                {formError.showSigninLink && (
                  <AlertDescription>
                    <Link
                      to="/auth/signin"
                      className="font-medium text-primary hover:underline"
                    >
                      Iniciar sesión
                    </Link>
                  </AlertDescription>
                )}
              </AlertContent>
            </Alert>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="ana@correo.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={
                          showPassword
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormDescription>Entre 6 y 100 caracteres</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repite la contraseña</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showConfirmation ? 'text' : 'password'}
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmation((visible) => !visible)
                        }
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={
                          showConfirmation
                            ? 'Ocultar repetición de la contraseña'
                            : 'Mostrar repetición de la contraseña'
                        }
                      >
                        {showConfirmation ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && (
                  <Spinner className="me-2 h-4 w-4 animate-spin" />
                )}
                {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/auth/signin"
              className="font-medium text-primary hover:underline"
            >
              Ingresa
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
