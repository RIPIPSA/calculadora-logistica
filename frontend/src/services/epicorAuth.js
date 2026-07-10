import { epicorConfig, isEpicorConfigured } from './config.js';

/**
 * Autentica un usuario contra el TokenResource.svc de Epicor SaaS/ICE.
 *
 * Confirmado en Postman (ya no es una suposición): es un POST, y las
 * credenciales van como headers PLANOS — no como "Authorization: Basic"—:
 *   - X-API-Key: <api key de la suscripción>
 *   - username: <usuario>
 *   - password: <contraseña>
 *
 * La respuesta trae:
 *   { "AccessToken": "...", "ExpiresIn": 60000, "TokenType": "Bearer" }
 *
 * @param {string} usuario
 * @param {string} password
 * @returns {Promise<{ token: string, nombre?: string, expiresIn?: number, raw: any }>}
 */
export async function loginConEpicor(usuario, password) {
  if (!isEpicorConfigured()) {
    throw new Error(
      'La API de Epicor no está configurada. Define VITE_EPICOR_TOKEN_URL y VITE_EPICOR_API_KEY en tu archivo .env (ver .env.example).'
    );
  }

  const response = await fetch(epicorConfig.tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'X-API-Key': epicorConfig.apiKey,
      username: usuario,
      password,
    },
  });

  if (!response.ok) {
    // 401/403 = usuario, contraseña o API key incorrectos.
    const detalle = await response.text().catch(() => '');
    throw new Error(`Epicor rechazó el inicio de sesión (${response.status}). ${detalle}`);
  }

  const data = await response.json();

  const token = data.AccessToken ?? data.Token ?? data.access_token ?? null;

  if (!token) {
    throw new Error('Epicor respondió correctamente pero no se encontró un token en la respuesta. Revisa el formato real de la respuesta en epicorAuth.js.');
  }

  return {
    token,
    nombre: usuario,
    expiresIn: data.ExpiresIn ?? null,
    raw: data,
  };
}
