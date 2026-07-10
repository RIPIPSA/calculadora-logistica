// Configuración de la API de Epicor. Todos los valores se leen de variables
// de entorno de Vite (ver .env.example en la raíz del proyecto) para que el
// equipo de TI solo tenga que llenar el .env real, sin tocar código.
//
// VITE_EPICOR_TOKEN_URL  -> URL COMPLETA del TokenResource.svc de tu instancia
//                           SaaS, ej.:
//                           https://centralusdtapp50.epicorsaas.com/saas5106/TokenResource.svc
// VITE_EPICOR_API_KEY    -> API key de la suscripción (header X-API-Key)

export const epicorConfig = {
  tokenUrl: import.meta.env.VITE_EPICOR_TOKEN_URL || '',
  apiKey: import.meta.env.VITE_EPICOR_API_KEY || '',
};

export const isEpicorConfigured = () => Boolean(epicorConfig.tokenUrl && epicorConfig.apiKey);
