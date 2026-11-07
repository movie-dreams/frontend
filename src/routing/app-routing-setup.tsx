import { AuthRouting } from '@/auth/auth-routing';
import { RequireAuth } from '@/auth/require-auth';
import { RequireRole } from '@/auth/require-role';
import { ErrorRouting } from '@/errors/error-routing';
import { Demo1Layout } from '@/layouts/demo1/layout';
import { PublicoLayout } from '@/layouts/publico/layout';
// import { CarteleraPage } from '@/pages/cartelera/cartelera-page';
import { CineHomePage } from '@/pages/cine';
import { FuncionAsientosPage } from '@/pages/funciones/funciones-asientos-page';
import { FuncionNuevaPage } from '@/pages/funciones/funcion-nueva-page';
import { FuncionesPage } from '@/pages/funciones/funciones-page';
import { PersonasPage } from '@/pages/personas/personas-page';
import { PeliculasDellatePage } from '@/pages/peliculas/peliculas-detalle-page';
import { PeliculaNuevaPage } from '@/pages/peliculas/pelicula-nueva-page';

import { PeliculasPage } from '@/pages/peliculas/peliculas-page';
import { ReservarPage } from '@/pages/ReservarPage';
import { Navigate, Route, Routes } from 'react-router';


export function AppRoutingSetup() {
  return (
    <Routes>
     {/* PUBLICO */}
     
        <Route element={<PublicoLayout />}>
          <Route path="/peliculas" element={<PeliculasPage />} />
          <Route path="/peliculas/:id" element={<PeliculasDellatePage />} />
          <Route path="/funciones/:id" element={<FuncionAsientosPage />} />
        </Route>
     



      {/* PRIVADO */}
      <Route element={<RequireAuth />}>
        <Route element={<Demo1Layout />}>
          <Route path="/" element={<CineHomePage />} />
          <Route path="/reservar" element={<ReservarPage />} />
          <Route path="/reservar/:movieId" element={<ReservarPage />} />
          {/* <Route path="/cartelera" element={<CarteleraPage />} /> */}

          {/* Solo ADMIN o Gerente: el guard redirige a "/" al resto */}
          <Route element={<RequireRole roles={['Administrador', 'Gerente']} />}>
            <Route path="/personas" element={<PersonasPage />} />
            <Route path="/peliculas/nueva" element={<PeliculaNuevaPage />} />
            <Route path="/funciones" element={<FuncionesPage />} />
            <Route path="/funciones/nueva" element={<FuncionNuevaPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="error/*" element={<ErrorRouting />} />
      <Route path="auth/*" element={<AuthRouting />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
    </Routes>
  );
}
