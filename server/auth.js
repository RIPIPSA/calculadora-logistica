import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPERUSUARIOS_PATH = path.join(__dirname, 'data', 'superusuarios.json');

function leerSuperusuarios() {
  return JSON.parse(fs.readFileSync(SUPERUSUARIOS_PATH, 'utf-8')).map((u) => u.toLowerCase());
}

export function esSuperusuario(usuario) {
  if (!usuario) return false;
  return leerSuperusuarios().includes(String(usuario).toLowerCase());
}

export async function requireSesionEpicor(req, res, next) {
  const auth = req.header('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ error: 'Falta el token de sesión de Epicor (header Authorization: Bearer <token>).' });
  }

  const verifyUrl = process.env.EPICOR_VERIFY_URL;
  if (verifyUrl) {
    try {
      const r = await fetch(verifyUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) {
        return res.status(401).json({ error: 'Epicor rechazó el token de sesión (puede haber expirado).' });
      }
    } catch (err) {
      return res.status(502).json({ error: `No se pudo validar el token contra Epicor: ${err.message}` });
    }
  }

  req.epicorToken = token;
  next();
}

export function requireSuperusuario(req, res, next) {
  const usuario = req.header('x-ripipsa-user');
  if (!usuario) {
    return res.status(400).json({ error: 'Falta el header x-ripipsa-user.' });
  }
  if (!esSuperusuario(usuario)) {
    return res.status(403).json({ error: `El usuario "${usuario}" no tiene permiso de superusuario.` });
  }
  req.usuario = usuario;
  next();
}
