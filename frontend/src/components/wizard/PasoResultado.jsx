import { useWizard } from './WizardContext.jsx';
import { Button } from '../ui/ui.jsx';

const formatoUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function PasoResultado() {
  const { state, resultado, reset } = useWizard();

  if (!resultado) {
    return <p>Faltan datos por capturar en los pasos anteriores.</p>;
  }

  const { resumen, huboPD, agencia, tasaIgi } = resultado;

  return (
    <div>
      <h2 className="wizard-step__title">Sección VI · Resumen de costo logístico</h2>
      <p className="wizard-step__subtitle">
        {state.proveedor} → {state.aduana} → {state.sucursal} (destino: {state.destino})
      </p>

      <div className="resumen-meta">
        <div>
          <strong>{state.producto}</strong>
          Producto
        </div>
        <div>
          <strong>{agencia?.agencia ?? '—'}</strong>
          Agencia aduanal
        </div>
        <div>
          <strong>{tasaIgi !== null ? `${(tasaIgi * 100).toFixed(1)}%` : '—'}</strong>
          Tasa IGI
        </div>
        <div>
          <strong>{formatoUSD.format(Number(state.valorMercancia) || 0)}</strong>
          Valor de mercancía
        </div>
      </div>

      {huboPD && (
        <div className="resumen-pd">
          Alguna de las tarifas para esta combinación de proveedor/aduana/producto todavía no
          está cargada en el catálogo ("PD" = pendiente de definir). Los montos que sí se
          pudieron calcular se muestran abajo; contacta a Ripipsa para completar la tarifa
          faltante.
        </div>
      )}

      <ul className="resumen-list">
        <li className="resumen-list__row">
          <span>Flete Proveedor (Costo 1)</span>
          <span>{formatoUSD.format(resumen.fleteProveedor)}</span>
        </li>
        <li className="resumen-list__row">
          <span>Flete de Importación (Costo 2)</span>
          <span>{formatoUSD.format(resumen.fleteImportacion)}</span>
        </li>
        <li className="resumen-list__row">
          <span>Bodega y Recinto (Costo 3)</span>
          <span>{formatoUSD.format(resumen.bodegaYRecinto)}</span>
        </li>
        <li className="resumen-list__row">
          <span>Honorarios A.A. (Costo 4)</span>
          <span>{formatoUSD.format(resumen.honorariosAA)}</span>
        </li>
        <li className="resumen-list__row">
          <span>Impuestos - DTA + IGI (Costo 5)</span>
          <span>{formatoUSD.format(resumen.impuestos)}</span>
        </li>
        <li className="resumen-list__row resumen-list__row--total">
          <span>Costo logístico total</span>
          <span>{formatoUSD.format(resumen.costoLogisticoTotal)}</span>
        </li>
      </ul>

      <Button variant="outlined" onClick={reset}>
        Calcular otro embarque
      </Button>
    </div>
  );
}
