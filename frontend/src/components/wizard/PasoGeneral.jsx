import { useWizard } from './WizardContext.jsx';
import { Field, Select, Badge } from '../ui/ui.jsx';

export function PasoGeneral() {
  const { state, setField, aduanasDisponibles, agencia, catalogos } = useWizard();

  return (
    <div>
      <h2 className="wizard-step__title">Sección I · Información general</h2>
      <p className="wizard-step__subtitle">
        Sucursal y Destino son campos independientes: Destino determina qué aduanas se pueden
        elegir; Sucursal es la que recibe físicamente la mercancía y se usa para calcular el
        Flete de Importación.
      </p>

      <Field label="Sucursal" required hint="Sucursal que recibe la mercancía.">
        <Select
          placeholder="Selecciona una sucursal"
          value={state.sucursal}
          onChange={(e) => setField('sucursal', e.target.value)}
        >
          {catalogos.sucursales.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Proveedor" required>
        <Select
          placeholder="Selecciona un proveedor"
          value={state.proveedor}
          onChange={(e) => setField('proveedor', e.target.value)}
        >
          {catalogos.proveedores.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Destino" required hint="Determina qué aduanas están disponibles.">
        <Select
          placeholder="Selecciona un destino"
          value={state.destino}
          onChange={(e) => setField('destino', e.target.value)}
        >
          {catalogos.sucursales.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Aduana"
        required
        hint={!state.destino ? 'Elige primero el Destino.' : undefined}
      >
        <Select
          placeholder="Selecciona una aduana"
          value={state.aduana}
          onChange={(e) => setField('aduana', e.target.value)}
          disabled={!state.destino}
        >
          {aduanasDisponibles.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </Field>

      {agencia && (
        <div className="field-notice">
          Agencia aduanal asignada automáticamente: <Badge tone="primary">{agencia.agencia}</Badge> · Zona{' '}
          {agencia.zona}
        </div>
      )}
    </div>
  );
}
