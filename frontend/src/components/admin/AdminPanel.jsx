import { useState } from 'react';
import { AdminProvider, useAdmin } from './AdminContext.jsx';
import { SeccionTasasIgi } from './SeccionTasasIgi.jsx';
import { SeccionProveedorMercancia } from './SeccionProveedorMercancia.jsx';
import { SeccionFleteProveedor } from './SeccionFleteProveedor.jsx';
import { SeccionFleteImpo } from './SeccionFleteImpo.jsx';
import { SeccionBodega } from './SeccionBodega.jsx';
import { SeccionHonorariosAA } from './SeccionHonorariosAA.jsx';
import { SeccionImpuestos } from './SeccionImpuestos.jsx';
import { SeccionBitacora } from './SeccionBitacora.jsx';
import { SeccionRespaldo } from './SeccionRespaldo.jsx';
import { Button } from '../ui/ui.jsx';
import './admin.css';

const PESTANAS = [
  { id: 'tasas', label: 'Tasas IGI', Componente: SeccionTasasIgi },
  { id: 'honorarios', label: 'Honorarios A.A.', Componente: SeccionHonorariosAA },
  { id: 'impuestos', label: 'Impuestos', Componente: SeccionImpuestos },
  { id: 'prov-merc', label: 'Proveedor-Mercancía', Componente: SeccionProveedorMercancia },
  { id: 'flete-prov', label: 'Flete Proveedor', Componente: SeccionFleteProveedor },
  { id: 'flete-impo', label: 'Flete Impo', Componente: SeccionFleteImpo },
  { id: 'bodega', label: 'Bodega-Recinto', Componente: SeccionBodega },
  { id: 'bitacora', label: 'Bitácora', Componente: SeccionBitacora },
  { id: 'respaldo', label: 'Respaldo', Componente: SeccionRespaldo },
];

function AdminBody({ onVolver }) {
  const { cargando, error, avisoGuardado } = useAdmin();
  const [pestana, setPestana] = useState('tasas');
  const Activa = PESTANAS.find((p) => p.id === pestana).Componente;

  return (
    <div className="wizard-shell">
      <div className="wizard-header">
        <span className="wizard-header__brand">Reglas de negocio</span>
        <Button variant="text" onClick={onVolver}>
          ← Volver al cálculo
        </Button>
      </div>

      <div className="admin-tabs">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            className={`admin-tabs__tab ${pestana === p.id ? 'admin-tabs__tab--activa' : ''}`}
            onClick={() => setPestana(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {avisoGuardado && <div className="admin-aviso admin-aviso--exito">{avisoGuardado}</div>}
      {error && <div className="admin-aviso admin-aviso--error">{error}</div>}

      {cargando ? <p>Cargando reglas de negocio…</p> : <Activa />}
    </div>
  );
}

export function AdminPanel({ onVolver }) {
  return (
    <AdminProvider>
      <AdminBody onVolver={onVolver} />
    </AdminProvider>
  );
}
