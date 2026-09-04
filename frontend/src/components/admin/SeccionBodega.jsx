import { useEffect, useState } from 'react';
import { useAdmin } from './AdminContext.jsx';
import { Button, Card, TextField } from '../ui/ui.jsx';

/**
 * Costo 3 · Bodega y Recinto.
 *
 * Por aduana hay 3 tarifas según la franja de peso del embarque:
 *   min   → peso < 1,000 lbs
 *   medio → 1,000 a 1,999 lbs
 *   alto  → 2,000 lbs o más
 *
 * Los cortes de peso (1000 / 2000) están en el motor de cálculo, no en la
 * base de datos: aquí solo se editan los montos.
 */
export function SeccionBodega() {
  const { reglas, guardarBod, guardando } = useAdmin();
  const [porAduana, setPorAduana] = useState({});

  useEffect(() => {
    if (reglas?.tarifaBodegaPorAduana) {
      setPorAduana(JSON.parse(JSON.stringify(reglas.tarifaBodegaPorAduana)));
    }
  }, [reglas]);

  const actualizar = (aduana, campo, valor) => {
    setPorAduana((prev) => ({ ...prev, [aduana]: { ...prev[aduana], [campo]: valor } }));
  };

  if (!reglas) return null;
  const aduanas = Object.keys(porAduana).sort();

  return (
    <Card>
      <h3 className="admin-section__title">Bodega y Recinto</h3>
      <p className="admin-section__subtitle">
        Tarifa de almacenaje por aduana (USD), según el peso del embarque. Los cortes de peso
        (1,000 y 2,000 lbs) son parte del motor de cálculo y no se editan aquí.
      </p>

      <div className="admin-table">
        <div className="admin-table__header admin-table--bodega">
          <span>Aduana</span>
          <span>Menos de 1,000 lbs</span>
          <span>1,000 – 1,999 lbs</span>
          <span>2,000 lbs o más</span>
        </div>
        {aduanas.map((aduana) => (
          <div className="admin-table__row admin-table--bodega" key={aduana}>
            <span className="admin-table__label">{aduana}</span>
            <TextField
              type="number"
              step="0.01"
              value={porAduana[aduana].min}
              onChange={(e) => actualizar(aduana, 'min', e.target.value)}
            />
            <TextField
              type="number"
              step="0.01"
              value={porAduana[aduana].medio}
              onChange={(e) => actualizar(aduana, 'medio', e.target.value)}
            />
            <TextField
              type="number"
              step="0.01"
              value={porAduana[aduana].alto}
              onChange={(e) => actualizar(aduana, 'alto', e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="admin-section__actions">
        <Button onClick={() => guardarBod(porAduana)} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar Bodega y Recinto'}
        </Button>
      </div>
    </Card>
  );
}
