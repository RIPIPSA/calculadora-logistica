import { db } from './db.js';

const insertCambio = db.prepare(`
  INSERT INTO bitacora_cambios (fecha, usuario, tabla, clave, campo, valor_anterior, valor_nuevo)
  VALUES (@fecha, @usuario, @tabla, @clave, @campo, @valor_anterior, @valor_nuevo)
`);

/** Registra un cambio si el valor realmente cambió (evita ruido en la bitácora). */
export function registrarCambio({ usuario, tabla, clave, campo, valorAnterior, valorNuevo }) {
  const antes = valorAnterior === undefined || valorAnterior === null ? null : String(valorAnterior);
  const despues = valorNuevo === undefined || valorNuevo === null ? null : String(valorNuevo);
  if (antes === despues) return;
  insertCambio.run({
    fecha: new Date().toISOString(),
    usuario,
    tabla,
    clave,
    campo,
    valor_anterior: antes,
    valor_nuevo: despues,
  });
}

export function obtenerBitacora(limite = 200) {
  return db.prepare('SELECT * FROM bitacora_cambios ORDER BY id DESC LIMIT ?').all(limite);
}
