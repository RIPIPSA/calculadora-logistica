import { createContext, useContext, useState, useCallback } from 'react';
import { loginConEpicor } from '../services/epicorAuth.js';
import { modoPruebaDisponible, loginDePrueba } from '../services/devAuth.js';
import { consultarEsSuperusuario } from '../services/reglasNegocio.js';
import { obtenerNombreCompleto } from '../services/epicorUserInfo.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // usuario = { nombre (username, para permisos), nombreCompleto (para mostrar
  // en UI/PDF — null mientras no se resuelva el API Key de OData con
  // Epicor), token, modoPrueba?, esSuperusuario }
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (userId, password) => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await loginConEpicor(userId, password);
      const [esSuperusuario, nombreCompleto] = await Promise.all([
        consultarEsSuperusuario(resultado.nombre),
        obtenerNombreCompleto(resultado.nombre, resultado.token),
      ]);
      setUsuario({ nombre: resultado.nombre, nombreCompleto, token: resultado.token, esSuperusuario });
      return true;
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
      return false;
    } finally {
      setCargando(false);
    }
  }, []);

  const entrarEnModoPrueba = useCallback(async (nombre) => {
    if (!modoPruebaDisponible()) return false;
    setCargando(true);
    setError(null);
    try {
      const resultado = await loginDePrueba(nombre);
      const esSuperusuario = await consultarEsSuperusuario(resultado.nombre);
      setUsuario({ nombre: resultado.nombre, nombreCompleto: null, token: resultado.token, modoPrueba: true, esSuperusuario });
      return true;
    } finally {
      setCargando(false);
    }
  }, []);

  const logout = useCallback(() => setUsuario(null), []);

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, error, login, logout, entrarEnModoPrueba, modoPruebaDisponible: modoPruebaDisponible() }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
