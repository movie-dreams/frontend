# Constitución — Movie Dreams

Principios innegociables basados en la **skill sdd**. Toda spec, plan y tarea
debe cumplirlos de forma estricta.

1. **Simplicidad primero**: El toolchain es React 19 + TypeScript 5.8 + Vite 6 +
   Tailwind 4 + Radix UI sobre Metronic v9.2.0 depurado. No se añaden
   dependencias, empaquetadores ni capas nuevas sin aprobación explícita.
2. **La spec manda**: Nada se implementa si no está en la spec activa
   (`specs/NNN-*/`). Si falta una decisión de negocio o diseño, se para y se
   pregunta.
3. **Lógica separada de interfaz**: Los cómputos de negocio (totales, códigos de
   reserva, fechas) son funciones puras y deterministas que reciben parámetros
   como «hoy». Las pantallas no llaman a axios ni escriben URLs:
   `pantalla → servicio → lib/http → config/env`.
4. **Pruebas antes que cambios (verificación como puerta)**: Primero se definen
   los criterios de prueba y solo después los cambios de código; el plan no se
   aprueba sin ellos. El método de verificación es el que el usuario decide para
   este proyecto: el MCP de Playwright (login `gguzman` / `123456`) junto con
   `typecheck` y `lint`; no hay tests unitarios. Prohibido avanzar con criterios
   en rojo o sin definir.
5. **Los datos son sagrados**: El estado del usuario vive en `localStorage`
   (`cine_token`) y se envía por HTTP. Nunca se renombra la clave ni se cambia
   la forma del dato sin consentimiento; no se rompe el estado del usuario.
6. **Idioma y semántica**: Código (nombres, tipos y comentarios técnicos) en
   inglés; interfaz, documentación (JSDoc, `MEMORY.md`, `AGENTS.md`) e
   interacción en español. Para el id se usa `id` en código y «identificador» en
   interfaz y documentación; **nunca** `code`.
