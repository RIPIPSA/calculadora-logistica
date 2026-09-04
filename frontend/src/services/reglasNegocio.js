// Cliente del servicio de reglas de negocio (Express + SQLite).
//
// VITE_REGLAS_API_URL debe apuntar a donde corra ese servicio, ej.
// http://localhost:4000 en desarrollo.

const BASE_URL = import.meta.env.VITE_REGLAS_API_URL || 'http://localhost:4000';

export async function obtenerCatalogos() {
  const r = await fetch(`${BASE_URL}/api/catalogos`);
  if (!r.ok) throw new Error(`No se pudieron cargar los catálogos (HTTP ${r.status}).`);
  return r.json();
}

export async function consultarEsSuperusuario(usuario) {
  if (!usuario) return false;
  try {
    const r = await fetch(`${BASE_URL}/api/es-superusuario?usuario=${encodeURIComponent(usuario)}`);
    if (!r.ok) return false;
    return (await r.json()).esSuperusuario;
  } catch {
    // Si el servicio de reglas de negocio está caído, no debe bloquear el
    // login a la app entera — solo se pierde temporalmente el permiso de
    // superusuario (se puede reintentar más tarde, ver recargar() en
    // CatalogosContext / esta misma consulta en un futuro botón "reintentar").
    return false;
  }
}

function headersEscritura(epicorToken, usuario) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${epicorToken}`,
    'x-ripipsa-user': usuario,
  };
}

export async function guardarTasasIgi(tasasIgi, { epicorToken, usuario }) {
  const r = await fetch(`${BASE_URL}/api/reglas-negocio/tasas-igi`, {
    method: 'PUT',
    headers: headersEscritura(epicorToken, usuario),
    body: JSON.stringify(tasasIgi),
  });
  if (!r.ok) throw new Error((await r.json()).error || 'No se pudo guardar.');
  return r.json();
}

export async function guardarHonorariosAA(honorariosAA, { epicorToken, usuario }) {
  const r = await fetch(`${BASE_URL}/api/reglas-negocio/honorarios-aa`, {
    method: 'PUT',
    headers: headersEscritura(epicorToken, usuario),
    body: JSON.stringify(honorariosAA),
  });
  if (!r.ok) throw new Error((await r.json()).error || 'No se pudo guardar.');
  return r.json();
}

export async function guardarImpuestos(impuestos, { epicorToken, usuario }) {
  const r = await fetch(`${BASE_URL}/api/reglas-negocio/impuestos`, {
    method: 'PUT',
    headers: headersEscritura(epicorToken, usuario),
    body: JSON.stringify(impuestos),
  });
  if (!r.ok) throw new Error((await r.json()).error || 'No se pudo guardar.');
  return r.json();
}

export async function obtenerBitacora({ epicorToken, usuario }, limite = 200) {
  const r = await fetch(`${BASE_URL}/api/reglas-negocio/bitacora?limite=${limite}`, {
    headers: { Authorization: `Bearer ${epicorToken}`, 'x-ripipsa-user': usuario },
  });
  if (!r.ok) throw new Error((await r.json()).error || 'No se pudo leer la bitácora.');
  return r.json();
}

export function urlRespaldo() {
  return `${BASE_URL}/api/reglas-negocio/respaldo`;
}

export async function restaurarRespaldo(archivo, { epicorToken, usuario }) {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const r = await fetch(`${BASE_URL}/api/reglas-negocio/restaurar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${epicorToken}`, 'x-ripipsa-user': usuario },
    body: formData,
  });
  if (!r.ok) throw new Error((await r.json()).error || 'No se pudo restaurar.');
  return r.json();
}

// --- Catálogos editables agregados en la v2 del panel ---

export async function guardarProveedoresProductos(porProveedor, { epicorToken, usuario }) {
  const r = await fetch(`${BASE_URL}/api/reglas-negocio/proveedores-productos`, {
    method: 'PUT',
    headers: headersEscritura(epicorToken, usuario),
    body: JSON.stringify(porProveedor),
  });
  if (!r.ok) throw new Error((await r.json()).error || 'No se pudo guardar.');
  return r.json();
}

export async function guardarFleteProveedor(datos, { epicorToken, usuario }) {
  const r = await fetch(`${BASE_URL}/api/reglas-negocio/flete-proveedor`, {
    method: 'PUT',
    headers: headersEscritura(epicorToken, usuario),
    body: JSON.stringify(datos),
  });
  if (!r.ok) throw new Error((await r.json()).error || 'No se pudo guardar.');
  return r.json();
}

export async function guardarFleteImpo(porAduana, { epicorToken, usuario }) {
  const r = await fetch(`${BASE_URL}/api/reglas-negocio/flete-impo`, {
    method: 'PUT',
    headers: headersEscritura(epicorToken, usuario),
    body: JSON.stringify(porAduana),
  });
  if (!r.ok) throw new Error((await r.json()).error || 'No se pudo guardar.');
  return r.json();
}

export async function guardarBodega(porAduana, { epicorToken, usuario }) {
  const r = await fetch(`${BASE_URL}/api/reglas-negocio/bodega`, {
    method: 'PUT',
    headers: headersEscritura(epicorToken, usuario),
    body: JSON.stringify(porAduana),
  });
  if (!r.ok) throw new Error((await r.json()).error || 'No se pudo guardar.');
  return r.json();
}
