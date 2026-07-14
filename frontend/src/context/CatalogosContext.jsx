import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { obtenerCatalogos } from '../services/reglasNegocio.js';

const CatalogosContext = createContext(null);

export function CatalogosProvider({ children }) {
  const [catalogos, setCatalogos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerCatalogos();
      setCatalogos(datos);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los catálogos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <CatalogosContext.Provider value={{ catalogos, cargando, error, recargar: cargar }}>
      {children}
    </CatalogosContext.Provider>
  );
}

export function useCatalogos() {
  const ctx = useContext(CatalogosContext);
  if (!ctx) throw new Error('useCatalogos debe usarse dentro de <CatalogosProvider>');
  return ctx;
}
