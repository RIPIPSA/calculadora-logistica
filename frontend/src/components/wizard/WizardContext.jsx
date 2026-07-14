import { createContext, useContext, useMemo, useReducer } from 'react';
import { useCatalogos } from '../../context/CatalogosContext.jsx';
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
      if (action.field === 'destino') next.aduana = '';
      if (action.field === 'proveedor') next.producto = '';
      if (action.field === 'producto') {
        // La Tasa IGI sugerida se resuelve en el componente (necesita el
        // catálogo de tasasIgi, que aquí en el reducer no tenemos a la
        // mano); PasoMercancia.jsx hace ese autofill al cambiar de producto.
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
  const { catalogos } = useCatalogos();

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });
  const goTo = (paso) => dispatch({ type: 'GO_TO', paso });
  const reset = () => dispatch({ type: 'RESET' });

  const aduanasDisponibles = state.destino ? catalogos?.aduanasPorDestino[state.destino] ?? [] : [];
  const productosDisponibles = state.proveedor ? catalogos?.productosPorProveedor[state.proveedor] ?? [] : [];
  const agencia = state.aduana ? catalogos?.agenciaPorAduana[state.aduana] ?? null : null;

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
    if (!catalogos) return null;
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
    return calcularCostoLogistico(
      {
        sucursal: state.sucursal,
        proveedor: state.proveedor,
        producto: state.producto,
        valorMercancia: Number(state.valorMercancia),
        certificadoOrigen: state.certificadoOrigen,
        tasaIgi: Number(state.tasaIgiPorcentaje) / 100,
        aduana: state.aduana,
        pesoLbs,
        cantidadBultos: Number(state.cantidadBultos),
      },
      catalogos
    );
  }, [state, pesoLbs, pesoLbsCapturado, catalogos]);

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
    catalogos,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard debe usarse dentro de <WizardProvider>');
  return ctx;
}
