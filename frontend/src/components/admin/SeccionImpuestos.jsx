import { useEffect, useState } from 'react';
import { useAdmin } from './AdminContext.jsx';
import { Button, Card, Field, TextField } from '../ui/ui.jsx';

export function SeccionImpuestos() {
  const { reglas, guardarImp, guardando } = useAdmin();
  const [valores, setValores] = useState(null);

  useEffect(() => {
    if (reglas) {
      setValores({
        tasaDtaVariablePct: reglas.impuestos.tasaDtaVariable * 100,
        feeFijoDta: reglas.impuestos.feeFijoDta,
        flatConCertificado: reglas.impuestos.flatConCertificado,
      });
    }
  }, [reglas]);

  if (!valores) return null;

  const guardar = () =>
    guardarImp({
      tasaDtaVariable: Number(valores.tasaDtaVariablePct) / 100,
      feeFijoDta: Number(valores.feeFijoDta),
      flatConCertificado: Number(valores.flatConCertificado),
    });

  return (
    <Card>
      <h3 className="admin-section__title">Impuestos (DTA)</h3>
      <p className="admin-section__subtitle">
        Sin certificado de origen: <code>% variable × Valor Aduana + fijo (+ IGI)</code>. Con
        certificado de origen: cuota fija (exento de IGI).
      </p>

      <Field label="% variable de DTA (sin certificado)">
        <TextField
          type="number"
          step="0.001"
          value={valores.tasaDtaVariablePct}
          onChange={(e) => setValores((v) => ({ ...v, tasaDtaVariablePct: e.target.value }))}
        />
      </Field>
      <Field label="Fijo de DTA, sin certificado (USD)">
        <TextField
          type="number"
          step="0.01"
          value={valores.feeFijoDta}
          onChange={(e) => setValores((v) => ({ ...v, feeFijoDta: e.target.value }))}
        />
      </Field>
      <Field label="Cuota fija con certificado de origen (USD)">
        <TextField
          type="number"
          step="0.01"
          value={valores.flatConCertificado}
          onChange={(e) => setValores((v) => ({ ...v, flatConCertificado: e.target.value }))}
        />
      </Field>

      <div className="admin-section__actions">
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar Impuestos'}
        </Button>
      </div>
    </Card>
  );
}
