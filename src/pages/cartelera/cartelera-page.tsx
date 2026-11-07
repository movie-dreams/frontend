// parte de la vista

import {useState, useEffect} from 'react';
import { Funcion } from '@/types/cartelera';
import { carteleraService } from '@/services/cartelera.service';
import { Container } from '@/components/common/container';
import { useAuth } from '@/auth/context/auth-context';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';


export const CarteleraPage = () => {
  
  const [funciones, setFunciones] = useState<Funcion[]>([]);
  
  useEffect(() =>{
    carteleraService.listarFunciones()
    .then((respuesta) => setFunciones(respuesta.data))
  }, [])
  
  const { tieneRol } = useAuth();
  // RF-T6: el botón Crear función solo para roles autorizados (Administrador/Gerente)
  const puedeCrearFuncion = tieneRol('Administrador', 'Gerente');

  return (
    <Container>
      <div className="space-y-6 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cartelera</h1>
          <p className="text-sm text-muted-foreground">
           
          </p>
          {puedeCrearFuncion && (
            <div className="flex items-center justify-between">
              <Button variant="primary" asChild>
                <Link to="/funciones/nueva">Crear función</Link>
              </Button>
            </div>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {funciones.map((funcion) =>(
            
            <article key={funcion.id} className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-medium text-mono">{funcion.movie}</h2>
              <p className="mt-1 text-sm text-muted-foreground"> </p>
              <p className="mt-3 text-sm">
                {funcion.date}
              </p>
              <p className="mt-3 text-lg font-semibold text-mono">
               {funcion.price}
              </p>
            </article>
          ))}
        </div>
      </div>
    </Container>
  )
}
