import { Navigate, Outlet } from 'react-router-dom';
import { ScreenLoader } from '@/components/common/screen-loader';
import { useAuth } from './context/auth-context';

/**
 * Restringe rutas a ciertos roles.
 *
 * Se monta dentro de RequireAuth, asi que cuando llega aqui ya hay sesion.
 * Si el usuario no tiene ninguno de los roles permitidos se le manda al
 * inicio: ya inicio sesion, solo no le corresponde esta seccion.
 */
export const RequireRole = ({ roles }: { roles: string[] }) => {
  const { loading, isAuthenticated, tieneRol } = useAuth();

  if (loading) {
    return <ScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (!tieneRol(...roles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
