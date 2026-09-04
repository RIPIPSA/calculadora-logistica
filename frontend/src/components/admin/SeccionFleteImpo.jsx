import { useEffect, useState } from 'react';
import { useAdmin } from './AdminContext.jsx';
import { Button, Card, Select, TextField } from '../ui/ui.jsx';

// El motor de cálculo busca EXACTAMENTE estas claves. No son editables
// como texto libre a propósito: una clave distinta haría que el cálculo
// devuelva "PD" sin explicar por qué.
const TIPOS = ["FTL 53'", "RABON 20'", '3.5 T', 'CONSOLIDADO'];

/**
 * Costo 2 · Flete de Importación (Aduana → Sucursal).
 *
 * Estructura: aduana → destino → tipo de transporte → tarifa.
 * "Destino" aquí es la sucursal que recibe. Las aduanas marítimas
 * (Altamira, Manzanillo) usan el destino especial "Sucursales", que
 * aplica a cualquier sucursal.
 */
export function SeccionFleteImpo() {
  const { reglas, guardarFleteImp, guardando } = useAdmin();
  const [rutas, setRutas] = useState({});
  const [nuevaAduana, setNuevaAduana] = useState('');
  const [nuevoDestino, setNuevoDestino] = useState('');

  useEffect(() => {
    if (reglas?.rutasImpoAduanaSucursal) {
      setRutas(JSON.parse(JSON.stringify(reglas.rutasImpoAduanaSucursal)));
    }
  }, [reglas]);

  if (!reglas) return null;

  const aduanasDisponibles = Object.keys(reglas.agenciaPorAduana ?? {}).sort();
  const sucursalesDisponibles = [...(reglas.sucursales ?? []), 'Sucursales'];

  const actualizarTarifa = (aduana, destino, tipo, valor) => {
    setRutas((prev) => ({
      ...prev,
      [aduana]: { ...prev[aduana], [destino]: { ...prev[aduana][destino], [tipo]: valor } },
    }));
  };

  const eliminarRuta = (aduana, destino) => {
    setRutas((prev) => {
      const copiaAduana = { ...prev[aduana] };
      delete copiaAduana[destino];
      if (Object.keys(copiaAduana).length === 0) {
        const copia = { ...prev };
        delete copia[aduana];
        return copia;
      }
      return { ...prev, [aduana]: copiaAduana };
    });
  };

  const agregarRuta = () => {
    if (!nuevaAduana || !nuevoDestino) return;
    if (rutas[nuevaAduana]?.[nuevoDestino]) return; // ya existe
    setRutas((prev) => ({
      ...prev,
      [nuevaAduana]: {
        ...(prev[nuevaAduana] ?? {}),
        [nuevoDestino]: Object.fromEntries(TIPOS.map((t) => [t, 0])),
      },
    }));
    setNuevoDestino('');
  };

  const aduanas = Object.keys(rutas).sort();

  return (
    <Card>
      <h3 className="admin-section__title">Flete de Importación</h3>
      <p className="admin-section__subtitle">
        Tarifa (USD) de la aduana a la sucursal de destino, por tipo de transporte. Si una
        combinación no existe aquí, el cálculo la marcará como "PD" (pendiente de definir).
      </p>

      {aduanas.map((aduana) => (
        <div className="admin-grupo" key={aduana}>
          <h4 className="admin-grupo__titulo">{aduana}</h4>

          <div className="admin-table">
            <div className="admin-table__header admin-table--impo">
              <span>Destino</span>
              {TIPOS.map((t) => (
                <span key={t}>{t}</span>
              ))}
              <span></span>
            </div>
            {Object.keys(rutas[aduana])
              .sort()
              .map((destino) => (
                <div className="admin-table__row admin-table--impo" key={destino}>
                  <span className="admin-table__label">{destino}</span>
                  {TIPOS.map((tipo) => (
                    <TextField
                      key={tipo}
                      type="number"
                      step="0.01"
                      value={rutas[aduana][destino][tipo] ?? ''}
                      onChange={(e) => actualizarTarifa(aduana, destino, tipo, e.target.value)}
                    />
                  ))}
                  <Button variant="text" onClick={() => eliminarRuta(aduana, destino)}>
                    Eliminar
                  </Button>
                </div>
              ))}
          </div>
        </div>
      ))}

      <div className="admin-agregar">
        <Select value={nuevaAduana} onChange={(e) => setNuevaAduana(e.target.value)} placeholder="Aduana">
          {aduanasDisponibles.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
        <Select value={nuevoDestino} onChange={(e) => setNuevoDestino(e.target.value)} placeholder="Destino">
          {sucursalesDisponibles.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Button variant="outlined" onClick={agregarRuta} disabled={!nuevaAduana || !nuevoDestino}>
          + Agregar ruta
        </Button>
      </div>

      <div className="admin-section__actions">
        <Button onClick={() => guardarFleteImp(rutas)} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar Flete de Importación'}
        </Button>
      </div>
    </Card>
  );
}
