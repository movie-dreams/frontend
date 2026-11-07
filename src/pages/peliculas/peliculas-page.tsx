import { useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { peliculaService } from '@/services/pelicula.service';
import { Pelicula } from '@/types/pelicula';
import { Container } from '@/components/common/container';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/auth/context/auth-context';
import { isMovieCreatedNavigationState } from './pelicula-nueva-page';

function formatearDuracion(minutos:number): string {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return horas > 0 ? `${horas}h ${resto}m`  : `${resto}m`
}

/**
 * Cabecera del listado: el título y, solo cuando la sesión puede crear
 * películas, el botón principal que lleva al alta (RF-1, RF-3).
 *
 * El botón vive aquí, fuera del contenido del listado, para que siga visible
 * con independencia del estado de la carga (cargando, error o catálogo vacío).
 *
 * @param canCreateMovie `true` solo para roles autorizados (Administrador o Gerente).
 * @returns La fila de cabecera alineada a la derecha.
 */
function ListHeader({ canCreateMovie }: { canCreateMovie: boolean }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <h1>Película</h1>
            {canCreateMovie && (
                <Button variant="primary" asChild>
                    <Link to="/peliculas/nueva">Agregar película</Link>
                </Button>
            )}
        </div>
    );
}

export function PeliculasPage() {
    const [peliculas, setPeliculas] = useState<Pelicula[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const location = useLocation();
    const navigate = useNavigate();
    const { tieneRol } = useAuth();
    // RF-1/RF-3: el alta solo se ofrece a los roles autorizados. Un visitante
    // anónimo o un Cliente obtienen `false` y nunca ven el botón.
    const canCreateMovie = tieneRol('Administrador', 'Gerente');
    // Candado del aviso: la marca se consume una sola vez, aunque el efecto se
    // vuelva a ejecutar (StrictMode en desarrollo o un re-render del listado).
    const successNoticeShown = useRef(false);

    useEffect(() => {
        peliculaService.listarPeliculas()
            .then((respuesta) => setPeliculas(respuesta.data))
            .catch((e: Error) => setError(e.message))
            .finally(() => setCargando(false));
    }, [])

    // RF-20: si se llega desde el alta con la marca de éxito, se muestra el
    // aviso genérico (no promete que la película se vea: una inactiva no sale en
    // el catálogo) y se limpia la marca del historial para que no reaparezca al
    // recargar ni al volver atrás.
    useEffect(() => {
        if (successNoticeShown.current) return;
        if (!isMovieCreatedNavigationState(location.state)) return;

        successNoticeShown.current = true;
        toast.success('La película se guardó correctamente.');
        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    // El cuerpo del listado cambia con el estado de la carga. La cabecera (y su
    // botón) queda fuera de esta bifurcación para verse siempre (RF-1, RF-3).
    let content: ReactNode;
    if (cargando) {
        content = <p>Cargando pelicula....</p>;
    } else if (error) {
        content = <p>{error}</p>;
    } else if (peliculas.length === 0) {
        content = <p>No hay peliculas en la cartelera</p>;
    } else {
        content = (
            <div className='grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4'>
                {peliculas.map((pelicula) => {
                    const poster = pelicula.images?.[0]?.fileName;

                    return (
                        <article key={pelicula.id} className="group">

                            {/* Link para darle click */}
                            <Link to={`/peliculas/${pelicula.id}`}>
                                {/* aspect-[2/3] es la proporcion de un afiche de cine */}
                                <div className="overflow-hidden rounded-lg bg-muted aspect-[2/3]">
                                    {poster ? (
                                        <img src={peliculaService.urlImagen(poster)}
                                            alt={pelicula.title}
                                            // loading lazy: no descarga las imagenes de abajo
                                            // hasta que el usuario llegue a ellas
                                            loading="lazy"
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                                            Sin imagen
                                        </div>
                                    )}



                                </div>

                                <h2 className="mt-3 text-sm font-medium leading-tight text-mono">
                                    {pelicula.title}
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {formatearDuracion(pelicula.durationMinutes)}
                                </p>
                            </Link>

                        </article>

                    )
                })}


            </div>
        );
    }

    return (
        <Container>
            <div className='space-y-6 py-8'>
                <ListHeader canCreateMovie={canCreateMovie} />
                {content}
            </div>
        </Container>
    );
}
