import { createContext, useContext, useState, useCallback } from 'react';
import { loginConEpicor } from '../services/epicorAuth.js';
import { modoPruebaDisponible, loginDePrueba } from '../services/devAuth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null); // { nombre, token, modoPrueba? }
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (userId, password) => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await loginConEpicor(userId, password);
      setUsuario({ nombre: resultado.nombre, token: resultado.token });
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
      setUsuario({ nombre: resultado.nombre, token: resultado.token, modoPrueba: true });
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
