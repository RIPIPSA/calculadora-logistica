import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { CatalogosProvider, useCatalogos } from './context/CatalogosContext.jsx';
import { Login } from './components/login/Login.jsx';
import { Wizard } from './components/wizard/Wizard.jsx';
import { AdminPanel } from './components/admin/AdminPanel.jsx';
import { Button } from './components/ui/ui.jsx';

function PantallaCargaCatalogos({ children }) {
  const { catalogos, cargando, error, recargar } = useCatalogos();

  if (cargando) {
    return (
      <div className="pantalla-estado">
        <p>Cargando catálogos…</p>
      </div>
    );
  }

  if (error || !catalogos) {
    return (
      <div className="pantalla-estado">
        <p>
          No se pudieron cargar los catálogos del servicio de reglas de negocio.
          {error ? ` (${error})` : ''}
        </p>
        <p className="pantalla-estado__hint">
          Verifica que el servicio esté corriendo y que <code>VITE_REGLAS_API_URL</code> apunte a la
          URL correcta.
        </p>
        <Button onClick={recargar}>Reintentar</Button>
      </div>
    );
  }

  return children;
}

function AppGate() {
  const { usuario } = useAuth();
  const [vista, setVista] = useState('wizard'); // 'wizard' | 'admin'

  if (!usuario) return <Login />;
  if (vista === 'admin' && usuario.esSuperusuario) {
    return <AdminPanel onVolver={() => setVista('wizard')} />;
  }
  return <Wizard onAbrirAdmin={() => setVista('admin')} />;
}

export default function App() {
  return (
    <CatalogosProvider>
      <PantallaCargaCatalogos>
        <AuthProvider>
          <AppGate />
        </AuthProvider>
      </PantallaCargaCatalogos>
    </CatalogosProvider>
  );
}
