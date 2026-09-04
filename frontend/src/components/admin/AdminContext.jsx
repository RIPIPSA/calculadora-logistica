import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCatalogos } from '../../context/CatalogosContext.jsx';
import {
  obtenerCatalogos,
  guardarTasasIgi,
  guardarHonorariosAA,
  guardarImpuestos,
  obtenerBitacora,
  urlRespaldo,
  restaurarRespaldo,
  guardarProveedoresProductos,
  guardarFleteProveedor,
  guardarFleteImpo,
  guardarBodega,
} from '../../services/reglasNegocio.js';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const { usuario } = useAuth();
  const { recargar: recargarCatalogos } = useCatalogos();

  // `reglas` guarda ahora el catálogo COMPLETO: las 3 tablas editables
  // originales más las 4 que se agregaron al panel (proveedor-mercancía,
  // flete proveedor, flete impo y bodega).
  const [reglas, setReglas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [avisoGuardado, setAvisoGuardado] = useState(null);

  const credenciales = { epicorToken: usuario?.token, usuario: usuario?.nombre };

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerCatalogos();
      setReglas(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function ejecutarGuardado(fn, mensajeExito) {
    setGuardando(true);
    setAvisoGuardado(null);
    setError(null);
    try {
      await fn();
      await cargar(); // refresca con lo que quedó realmente guardado
      await recargarCatalogos(); // el resto de la app (wizard) también usa datos frescos
      setAvisoGuardado(mensajeExito);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setGuardando(false);
    }
  }

  const guardarTasas = (tasasIgi) => ejecutarGuardado(() => guardarTasasIgi(tasasIgi, credenciales), 'Tasas IGI guardadas.');
  const guardarHonorarios = (honorariosAA) =>
    ejecutarGuardado(() => guardarHonorariosAA(honorariosAA, credenciales), 'Honorarios A.A. guardados.');
  const guardarImp = (impuestos) => ejecutarGuardado(() => guardarImpuestos(impuestos, credenciales), 'Impuestos guardados.');

  const guardarProvProd = (porProveedor) =>
    ejecutarGuardado(() => guardarProveedoresProductos(porProveedor, credenciales), 'Proveedor-Mercancía guardado.');
  const guardarFleteProv = (datos) =>
    ejecutarGuardado(() => guardarFleteProveedor(datos, credenciales), 'Flete Proveedor guardado.');
  const guardarFleteImp = (porAduana) =>
    ejecutarGuardado(() => guardarFleteImpo(porAduana, credenciales), 'Flete Importación guardado.');
  const guardarBod = (porAduana) =>
    ejecutarGuardado(() => guardarBodega(porAduana, credenciales), 'Bodega y Recinto guardado.');

  const cargarBitacora = useCallback(
    (limite) => obtenerBitacora({ epicorToken: usuario?.token, usuario: usuario?.nombre }, limite),
    [usuario]
  );

  const descargarRespaldo = useCallback(async () => {
    const r = await fetch(urlRespaldo(), {
      headers: { Authorization: `Bearer ${credenciales.epicorToken}`, 'x-ripipsa-user': credenciales.usuario },
    });
    if (!r.ok) throw new Error('No se pudo descargar el respaldo.');
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ripipsa-reglas-negocio-${new Date().toISOString().slice(0, 10)}.db`;
    a.click();
    URL.revokeObjectURL(url);
  }, [usuario]);

  const restaurar = async (archivo) => {
    setGuardando(true);
    setError(null);
    setAvisoGuardado(null);
    try {
      await restaurarRespaldo(archivo, credenciales);
      setAvisoGuardado('Base restaurada. El servicio se reinició para tomar el archivo nuevo.');
      setTimeout(() => {
        cargar();
        recargarCatalogos();
      }, 1500); // pequeño margen para que el servidor termine de reiniciar
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const value = {
    reglas,
    cargando,
    error,
    guardando,
    avisoGuardado,
    guardarTasas,
    guardarHonorarios,
    guardarImp,
    guardarProvProd,
    guardarFleteProv,
    guardarFleteImp,
    guardarBod,
    cargarBitacora,
    descargarRespaldo,
    restaurar,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin debe usarse dentro de <AdminProvider>');
  return ctx;
}
