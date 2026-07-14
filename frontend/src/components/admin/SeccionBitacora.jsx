import { useEffect, useState } from 'react';
import { useAdmin } from './AdminContext.jsx';
import { Button, Card } from '../ui/ui.jsx';

export function SeccionBitacora() {
  const { cargarBitacora } = useAdmin();
  const [filas, setFilas] = useState(null);
  const [error, setError] = useState(null);

  const cargar = async () => {
    setError(null);
    try {
      setFilas(await cargarBitacora(100));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <Card>
      <div className="admin-section__header-row">
        <h3 className="admin-section__title">Bitácora de cambios</h3>
        <Button variant="text" onClick={cargar}>
          Actualizar
        </Button>
      </div>

      {error && <p className="login-card__error">{error}</p>}

      {filas === null ? (
        <p>Cargando…</p>
      ) : filas.length === 0 ? (
        <p className="admin-section__subtitle">Todavía no hay cambios registrados.</p>
      ) : (
        <div className="admin-bitacora">
          {filas.map((f) => (
            <div className="admin-bitacora__row" key={f.id}>
              <span className="admin-bitacora__fecha">{new Date(f.fecha).toLocaleString('es-MX')}</span>
              <span>
                <strong>{f.usuario}</strong> cambió <strong>{f.tabla}</strong> / {f.clave} · {f.campo}
              </span>
              <span className="admin-bitacora__diff">
                {f.valor_anterior ?? '—'} → {f.valor_nuevo ?? '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
