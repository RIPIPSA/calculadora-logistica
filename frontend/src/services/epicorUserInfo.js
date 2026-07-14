import { epicorConfig, isEpicorOdataConfigured } from './config.js';

/**
 * Consulta el nombre completo del usuario en Ice.BO.UserFileSvc — es una consulta
 * OData estándar sobre la colección "UserFiles".
 *
 * Diseñada para fallar en silencio: si el API Key de este namespace todavía
 * no está configurado/autorizado (ver nota en config.js — es una llave
 * DISTINTA a la del login), devuelve `null` en vez de tronar, y quien la usa
 * simplemente sigue mostrando el username como hasta ahora. Nada se rompe
 * mientras se resuelve el tema de la llave con Epicor.
 *
 * @param {string} userID
 * @param {string} epicorToken - token de la sesión (por si el namespace OData
 *   también lo exige junto al API Key; no hace daño mandarlo aunque no se use).
 * @returns {Promise<string|null>}
 */
export async function obtenerNombreCompleto(userID, epicorToken) {
  if (!isEpicorOdataConfigured() || !userID) return null;

  const filtro = encodeURIComponent(`UserID eq '${userID}'`);
  const url = `${epicorConfig.odataBaseUrl}/${epicorConfig.companyId}/Ice.BO.UserFileSvc/UserFiles?$filter=${filtro}&$select=Name`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-API-Key': epicorConfig.odataApiKey,
        ...(epicorToken ? { Authorization: `Bearer ${epicorToken}` } : {}),
      },
    });

    if (!response.ok) {
      console.warn(`No se pudo obtener el nombre completo de Epicor (HTTP ${response.status}). Se sigue mostrando el username.`);
      return null;
    }

    const data = await response.json();
    const filas = Array.isArray(data) ? data : data.value ?? [];
    return filas[0]?.Name ?? null;
  } catch (err) {
    console.warn('No se pudo obtener el nombre completo de Epicor:', err.message);
    return null;
  }
}
