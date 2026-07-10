// Modo de prueba: permite entrar a la app sin conectarse a Epicor todavía.
//
// Se activa SOLO cuando:
//   1) VITE_EPICOR_TOKEN_URL no está definida (Epicor no configurado), y
//   2) el bundle se corrió con `npm run dev` (import.meta.env.DEV).
//
// `import.meta.env.DEV` es `false` en cualquier build de producción
// (`npm run build` / `vite build`), así que este modo nunca puede llegar
// por accidente a lo que se despliegue: en producción, si Epicor no está
// configurado, el login simplemente falla con un mensaje claro en vez de
// dejar entrar a cualquiera.

import { isEpicorConfigured } from './config.js';

export const modoPruebaDisponible = () => import.meta.env.DEV && !isEpicorConfigured();

export async function loginDePrueba(usuario) {
  // Simula la latencia de un login real para que la UI se sienta igual.
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    token: 'dev-token-sin-epicor',
    nombre: usuario || 'Usuario de prueba',
    raw: { modo: 'prueba-local' },
  };
}
