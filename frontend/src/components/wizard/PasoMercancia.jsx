import { useEffect, useRef } from 'react';
import { useWizard } from './WizardContext.jsx';
import { Field, Select, TextField } from '../ui/ui.jsx';

export function PasoMercancia() {
  const { state, setField, productosDisponibles, catalogos } = useWizard();
  const sinProductos = state.proveedor && productosDisponibles.length === 0;

  const sugerida = state.producto
    ? catalogos?.tasasIgi.find((f) => f.descripcion === state.producto)?.tasaIgi ?? null
    : null;

  // Autofill al cambiar de producto: se sugiere la tasa del catálogo como
  // punto de partida, pero el campo queda editable (se revisa manualmente
  // si la mercancía en particular trae o no el impuesto).
  const productoAnterior = useRef(state.producto);
  useEffect(() => {
    if (state.producto !== productoAnterior.current) {
      productoAnterior.current = state.producto;
      setField('tasaIgiPorcentaje', sugerida !== null ? String(sugerida * 100) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.producto]);

  return (
    <div>
      <h2 className="wizard-step__title">Sección II · Información de mercancía</h2>
      <p className="wizard-step__subtitle">
        El producto se filtra según el proveedor - <strong>{state.proveedor}</strong>
      </p>

      <Field
        label="Producto / Mercancía"
        required
        hint={
          sinProductos
            ? 'Este proveedor todavía no tiene catálogo de productos cargado. Contacta a Ripipsa para agregarlo.'
            : undefined
        }
      >
        <Select
          placeholder={sinProductos ? 'Sin productos disponibles' : 'Selecciona un producto'}
          value={state.producto}
          onChange={(e) => setField('producto', e.target.value)}
          disabled={!state.proveedor || sinProductos}
        >
          {productosDisponibles.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Valor de mercancía (USD)" required>
        <TextField
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={state.valorMercancia}
          onChange={(e) => setField('valorMercancia', e.target.value)}
        />
      </Field>

      <Field label="Certificado de origen" required>
        <Select
          placeholder="Selecciona una opción"
          value={state.certificadoOrigen}
          onChange={(e) => setField('certificadoOrigen', e.target.value)}
        >
          <option value="SI">Sí</option>
          <option value="NO">No</option>
        </Select>
      </Field>

      <Field
        label="Tasa IGI (%)"
        required
        hint={
          state.producto
            ? sugerida !== null
              ? `Sugerida por catálogo para "${state.producto}": ${(sugerida * 100).toFixed(1)}%. Confírmala o cámbiala tras revisar la mercancía.`
              : 'No hay una tasa sugerida en el catálogo para este producto: captúrala manualmente tras revisar la mercancía.'
            : 'Se sugiere automáticamente al elegir el producto, pero siempre se puede editar.'
        }
      >
        <TextField
          type="number"
          min="0"
          max="100"
          step="0.1"
          placeholder="0.0"
          value={state.tasaIgiPorcentaje}
          onChange={(e) => setField('tasaIgiPorcentaje', e.target.value)}
        />
      </Field>
    </div>
  );
}
