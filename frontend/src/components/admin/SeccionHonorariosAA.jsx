import { useEffect, useState } from 'react';
import { useAdmin } from './AdminContext.jsx';
import { Button, Card, TextField, Badge } from '../ui/ui.jsx';

export function SeccionHonorariosAA() {
  const { reglas, guardarHonorarios, guardando } = useAdmin();
  const [porAduana, setPorAduana] = useState({});

  useEffect(() => {
    if (reglas) setPorAduana(JSON.parse(JSON.stringify(reglas.honorariosAA)));
  }, [reglas]);

  const actualizarLineal = (aduana, campo, valor) => {
    setPorAduana((prev) => ({ ...prev, [aduana]: { ...prev[aduana], [campo]: Number(valor) } }));
  };

  const actualizarPctExcedente = (aduana, valor) => {
    setPorAduana((prev) => ({ ...prev, [aduana]: { ...prev[aduana], pctExcedente: Number(valor) } }));
  };

  const actualizarTramoMonto = (aduana, i, valor) => {
    setPorAduana((prev) => {
      const tramos = prev[aduana].tramos.map((t, idx) => (idx === i ? { ...t, monto: Number(valor) } : t));
      return { ...prev, [aduana]: { ...prev[aduana], tramos } };
    });
  };

  const guardar = () => guardarHonorarios(porAduana);

  if (!reglas) return null;

  const aduanas = Object.keys(porAduana).sort();

  return (
    <Card>
      <h3 className="admin-section__title">Honorarios de Agencia Aduanal</h3>
      <p className="admin-section__subtitle">
        Por aduana. Las de tipo <Badge tone="neutral">lineal</Badge> son{' '}
        <code>% del valor de mercancía + fijo</code>; las de tipo{' '}
        <Badge tone="neutral">tramos</Badge> usan un monto fijo según el valor, y un % sobre el
        excedente arriba del último tramo.
      </p>

      <div className="admin-honorarios-grid">
        {aduanas.map((aduana) => {
          const params = porAduana[aduana];
          return (
            <div className="admin-honorarios-card" key={aduana}>
              <div className="admin-honorarios-card__header">
                <strong>{aduana}</strong>
                <Badge tone="neutral">{params.tipo}</Badge>
              </div>

              {params.tipo === 'lineal' ? (
                <div className="admin-honorarios-card__fields">
                  <label>
                    % del valor
                    <TextField
                      type="number"
                      step="0.0001"
                      value={params.pct}
                      onChange={(e) => actualizarLineal(aduana, 'pct', e.target.value)}
                    />
                  </label>
                  <label>
                    Fijo (USD)
                    <TextField
                      type="number"
                      step="0.01"
                      value={params.fijo}
                      onChange={(e) => actualizarLineal(aduana, 'fijo', e.target.value)}
                    />
                  </label>
                </div>
              ) : (
                <div className="admin-honorarios-card__fields">
                  {params.tramos.map((t, i) => (
                    <label key={i}>
                      Hasta ${t.hasta.toLocaleString()}
                      <TextField
                        type="number"
                        step="0.01"
                        value={t.monto}
                        onChange={(e) => actualizarTramoMonto(aduana, i, e.target.value)}
                      />
                    </label>
                  ))}
                  <label>
                    % excedente arriba de ${params.tramos.at(-1).hasta.toLocaleString()}
                    <TextField
                      type="number"
                      step="0.0001"
                      value={params.pctExcedente}
                      onChange={(e) => actualizarPctExcedente(aduana, e.target.value)}
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="admin-section__actions">
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar Honorarios A.A.'}
        </Button>
      </div>
    </Card>
  );
}
