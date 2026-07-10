import { createContext, useContext, useMemo, useReducer } from 'react';
import { SUCURSALES, ADUANAS_POR_DESTINO } from '../../data/sucursales.js';
import { PROVEEDORES, PRODUCTOS_POR_PROVEEDOR } from '../../data/proveedores.js';
import { getAgenciaAduanal } from '../../data/agenciaAduanal.js';
import { getTasaIgi } from '../../data/fracciones.js';
import { calcularCostoLogistico } from '../../engine/calculoLogistico.js';

const initialState = {
  paso: 0,
  sucursal: '', // Sucursal que recibe la mercancía (se usa para la ruta de Flete de Importación)
  destino: '', // Destino: solo determina qué Aduanas se pueden elegir (INDIRECT($J$35) en el Excel)
  proveedor: '',
  aduana: '',
  producto: '',
  valorMercancia: '',
  certificadoOrigen: '',
  tasaIgiPorcentaje: '', // % capturado/confirmado manualmente (ver PasoMercancia)
  tipoPeso: 'numero', // 'numero' | 'especial'
  pesoNumero: '',
  pesoEspecial: '',
  cantidadBultos: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD': {
      const next = { ...state, [action.field]: action.value };
      // Al cambiar Destino, la Aduana ya no es necesariamente válida
      // (la lista de Aduanas depende de Destino, igual que en el Excel).
      if (action.field === 'destino') next.aduana = '';
      if (action.field === 'proveedor') next.producto = '';
      // Al cambiar de producto, se sugiere la Tasa IGI del catálogo, pero
      // queda como punto de partida editable: el usuario debe revisar
      // manualmente si esa mercancía en particular trae o no el impuesto.
      if (action.field === 'producto') {
        const sugerida = getTasaIgi(action.value);
        next.tasaIgiPorcentaje = sugerida !== null ? String(sugerida * 100) : '';
      }
      return next;
    }
    case 'GO_TO':
      return { ...state, paso: action.paso };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const WizardContext = createContext(null);

export const PASOS = ['General', 'Mercancía', 'Transporte', 'Resultado'];

export function WizardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });
  const goTo = (paso) => dispatch({ type: 'GO_TO', paso });
  const reset = () => dispatch({ type: 'RESET' });

  // La Aduana se filtra por DESTINO (no por Sucursal), igual que
  // INDIRECT($J$35) en el Excel.
  const aduanasDisponibles = state.destino ? ADUANAS_POR_DESTINO[state.destino] ?? [] : [];
  const productosDisponibles = state.proveedor ? PRODUCTOS_POR_PROVEEDOR[state.proveedor] ?? [] : [];
  const agencia = state.aduana ? getAgenciaAduanal(state.aduana) : null;

  // Peso ya tipado correctamente: string (DEDICADO/Embalaje...) en modo
  // "especial", o number en modo "numero". Se expone así para que ningún
  // componente (p. ej. el aviso de PasoTransporte) tenga que repetir esta
  // conversión y arriesgarse a que un número capturado como texto ("6000")
  // se confunda con un peso especial y dispare "DEDICADO" por error.
  const pesoLbs = state.tipoPeso === 'especial' ? state.pesoEspecial : Number(state.pesoNumero);
  const pesoLbsCapturado = state.tipoPeso === 'especial' ? state.pesoEspecial : state.pesoNumero;

  const pasoValido = useMemo(() => {
    switch (state.paso) {
      case 0:
        return Boolean(state.sucursal && state.destino && state.proveedor && state.aduana);
      case 1:
        return Boolean(
          state.producto &&
            state.valorMercancia &&
            Number(state.valorMercancia) > 0 &&
            state.certificadoOrigen &&
            state.tasaIgiPorcentaje !== '' &&
            Number(state.tasaIgiPorcentaje) >= 0
        );
      case 2:
        return Boolean(pesoLbsCapturado && state.cantidadBultos && Number(state.cantidadBultos) > 0);
      default:
        return true;
    }
  }, [state, pesoLbsCapturado]);

  const resultado = useMemo(() => {
    if (
      !(
        state.sucursal &&
        state.destino &&
        state.proveedor &&
        state.aduana &&
        state.producto &&
        state.valorMercancia &&
        state.certificadoOrigen &&
        state.tasaIgiPorcentaje !== '' &&
        pesoLbsCapturado &&
        state.cantidadBultos
      )
    ) {
      return null;
    }
    return calcularCostoLogistico({
      sucursal: state.sucursal,
      proveedor: state.proveedor,
      producto: state.producto,
      valorMercancia: Number(state.valorMercancia),
      certificadoOrigen: state.certificadoOrigen,
      tasaIgi: Number(state.tasaIgiPorcentaje) / 100,
      aduana: state.aduana,
      pesoLbs,
      cantidadBultos: Number(state.cantidadBultos),
    });
  }, [state, pesoLbs, pesoLbsCapturado]);

  const value = {
    state,
    setField,
    goTo,
    reset,
    pasoValido,
    aduanasDisponibles,
    productosDisponibles,
    agencia,
    pesoLbs,
    resultado,
    catalogos: { SUCURSALES, PROVEEDORES },
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard debe usarse dentro de <WizardProvider>');
  return ctx;
}
