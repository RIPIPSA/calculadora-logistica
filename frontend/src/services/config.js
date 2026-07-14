// Configuración de la API de Epicor. Todos los valores se leen de variables
// de entorno de Vite (ver .env.example en la raíz del proyecto) para que el
// equipo de TI solo tenga que llenar el .env real, sin tocar código.
//
// VITE_EPICOR_TOKEN_URL     -> URL COMPLETA del TokenResource.svc, ej.:
//                              https://centralusdtapp50.epicorsaas.com/saas5106/TokenResource.svc
// VITE_EPICOR_API_KEY       -> API key para TokenResource.svc (login)
//
// VITE_EPICOR_ODATA_BASE_URL -> URL base de /api/v2/odata de tu instancia, ej.:
//                               https://centralusdtapp50.epicorsaas.com/saas5106/api/v2/odata
// VITE_EPICOR_COMPANY_ID     -> Company ID (ej. 31123)
// VITE_EPICOR_ODATA_API_KEY  -> API key para /api/v2/odata (nombre completo del
//                               usuario, y cualquier otra llamada de negocio a
//                               futuro). Es una llave DISTINTA a
//                               VITE_EPICOR_API_KEY.

export const epicorConfig = {
  tokenUrl: import.meta.env.VITE_EPICOR_TOKEN_URL || '',
  apiKey: import.meta.env.VITE_EPICOR_API_KEY || '',
  odataBaseUrl: import.meta.env.VITE_EPICOR_ODATA_BASE_URL || '',
  companyId: import.meta.env.VITE_EPICOR_COMPANY_ID || '',
  odataApiKey: import.meta.env.VITE_EPICOR_ODATA_API_KEY || import.meta.env.VITE_EPICOR_API_KEY || '',
};

export const isEpicorConfigured = () => Boolean(epicorConfig.tokenUrl && epicorConfig.apiKey);

export const isEpicorOdataConfigured = () =>
  Boolean(epicorConfig.odataBaseUrl && epicorConfig.companyId && epicorConfig.odataApiKey);
