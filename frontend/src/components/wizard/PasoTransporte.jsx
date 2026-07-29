import { useWizard } from './WizardContext.jsx';
import { Field, Select, TextField, Button } from '../ui/ui.jsx';
import { calcularTipoEmbarque } from '../../engine/calculoLogistico.js';

export function PasoTransporte() {
  const { state, setField, pesoLbs, catalogos } = useWizard();
  const tipoEmbarque =
    (state.tipoPeso === 'especial' ? state.pesoEspecial : state.pesoNumero) && state.cantidadBultos
      ? calcularTipoEmbarque(pesoLbs, state.cantidadBultos, catalogos.opcionesEspecialesPeso)
      : null;

  return (
    <div>
      <h2 className="wizard-step__title">Sección III · Información de transporte</h2>
      <p className="wizard-step__subtitle">
        Captura el peso del embarque. Si ya sabes que es un embarque dedicado o va en un embalaje
        especial de MiR/UR, elige esa opción en vez de un peso.
      </p>

      <div className="peso-toggle">
        <Button
          type="button"
          variant={state.tipoPeso === 'numero' ? 'filled' : 'outlined'}
          onClick={() => setField('tipoPeso', 'numero')}
        >
          Peso en libras
        </Button>
        <Button
          type="button"
          variant={state.tipoPeso === 'especial' ? 'filled' : 'outlined'}
          onClick={() => setField('tipoPeso', 'especial')}
        >
          Dedicado / Embalaje especial
        </Button>
      </div>

      {state.tipoPeso === 'numero' ? (
        <Field label="Peso (lbs)" required>
          <TextField
            type="number"
            min="0"
            placeholder="0"
            value={state.pesoNumero}
            onChange={(e) => setField('pesoNumero', e.target.value)}
          />
        </Field>
      ) : (
        <Field label="Tipo de embarque especial" required>
          <Select
            placeholder="Selecciona una opción"
            value={state.pesoEspecial}
            onChange={(e) => setField('pesoEspecial', e.target.value)}
          >
            {catalogos.opcionesEspecialesPeso.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Cantidad de bultos" required>
        <TextField
          type="number"
          min="1"
          step="1"
          placeholder="Ejem. 1"
          value={state.cantidadBultos}
          onChange={(e) => setField('cantidadBultos', e.target.value)}
        />
      </Field>

      {tipoEmbarque && (
        <div className="field-notice">
          Con estos datos, el embarque se clasifica como <strong>{tipoEmbarque}</strong>.
        </div>
      )}
    </div>
  );
}
