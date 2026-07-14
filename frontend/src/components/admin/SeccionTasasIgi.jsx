import { useEffect, useState } from 'react';
import { useAdmin } from './AdminContext.jsx';
import { Button, Card, TextField } from '../ui/ui.jsx';

export function SeccionTasasIgi() {
  const { reglas, guardarTasas, guardando } = useAdmin();
  const [filas, setFilas] = useState([]);

  useEffect(() => {
    if (reglas) setFilas(reglas.tasasIgi.map((f) => ({ ...f, tasaIgi: f.tasaIgi * 100 })));
  }, [reglas]);

  const actualizarFila = (i, campo, valor) => {
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)));
  };

  const eliminarFila = (i) => setFilas((prev) => prev.filter((_, idx) => idx !== i));
  const agregarFila = () => setFilas((prev) => [...prev, { descripcion: '', fraccion: '', tasaIgi: 0 }]);

  const guardar = () => {
    const limpio = filas
      .filter((f) => f.descripcion.trim())
      .map((f) => ({ descripcion: f.descripcion.trim(), fraccion: f.fraccion, tasaIgi: Number(f.tasaIgi) / 100 }));
    guardarTasas(limpio);
  };

  if (!reglas) return null;

  return (
    <Card>
      <h3 className="admin-section__title">Tasas IGI</h3>
      <p className="admin-section__subtitle">
        Producto/mercancía → tasa de IGI sugerida (el usuario final siempre puede confirmarla o
        cambiarla al capturar el embarque).
      </p>

      <div className="admin-table">
        <div className="admin-table__header">
          <span>Descripción</span>
          <span>Fracción</span>
          <span>Tasa IGI (%)</span>
          <span></span>
        </div>
        {filas.map((f, i) => (
          <div className="admin-table__row" key={i}>
            <TextField value={f.descripcion} onChange={(e) => actualizarFila(i, 'descripcion', e.target.value)} />
            <TextField value={f.fraccion ?? ''} onChange={(e) => actualizarFila(i, 'fraccion', e.target.value)} />
            <TextField
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={f.tasaIgi}
              onChange={(e) => actualizarFila(i, 'tasaIgi', e.target.value)}
            />
            <Button variant="text" onClick={() => eliminarFila(i)}>
              Eliminar
            </Button>
          </div>
        ))}
      </div>

      <div className="admin-section__actions">
        <Button variant="outlined" onClick={agregarFila}>
          + Agregar producto
        </Button>
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar Tasas IGI'}
        </Button>
      </div>
    </Card>
  );
}
