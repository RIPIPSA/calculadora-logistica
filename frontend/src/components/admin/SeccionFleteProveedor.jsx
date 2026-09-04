import { useEffect, useState } from 'react';
import { useAdmin } from './AdminContext.jsx';
import { Button, Card, Select, TextField } from '../ui/ui.jsx';

// Claves que el motor de cálculo busca EXACTAMENTE. Se muestran como
// columnas fijas, no como texto editable: inventar una clave distinta
// haría que el cálculo devuelva "PD" sin explicar por qué.
const TIPOS_DEDICADO = ["FTL 53'", "RABON 20'", '3.5 T'];
const FRANJAS = [
  { clave: 'minCharge', etiqueta: 'Cargo mínimo', ayuda: 'exactamente 100 lbs' },
  { clave: '100-299', etiqueta: '100–299 lbs', ayuda: 'USD por lb' },
  { clave: '300-499', etiqueta: '300–499 lbs', ayuda: 'USD por lb' },
  { clave: '500-999', etiqueta: '500–999 lbs', ayuda: 'USD por lb' },
  { clave: '1000-2000', etiqueta: '1,000–1,999 lbs', ayuda: 'USD por lb' },
  { clave: '2000+', etiqueta: '2,000–5,000 lbs', ayuda: 'USD por lb' },
];

/**
 * Costo 1 · Flete Proveedor. Cubre tres tablas relacionadas:
 *
 *  1. DEDICADO   — tarifa fija por proveedor + aduana + tipo de transporte.
 *  2. CONSOLIDADO— tarifa por libra según franja de peso. La aduana "*"
 *                  representa una tarifa plana sin importar la aduana
 *                  (así están configurados MiR y UR).
 *  3. UR por equipos — tarifa especial de UR según cuántos equipos lleva
 *                  el embarque, para embalajes URe / UR20.
 */
export function SeccionFleteProveedor() {
  const { reglas, guardarFleteProv, guardando } = useAdmin();
  const [dedicado, setDedicado] = useState({});
  const [consolidado, setConsolidado] = useState({});
  const [urPorEquipos, setUrPorEquipos] = useState([]);
  const [nuevoDed, setNuevoDed] = useState({ proveedor: '', aduana: '' });
  const [nuevoCons, setNuevoCons] = useState({ proveedor: '', aduana: '' });

  useEffect(() => {
    if (!reglas) return;
    setDedicado(JSON.parse(JSON.stringify(reglas.rutasDedicadoProveedor ?? {})));
    setConsolidado(JSON.parse(JSON.stringify(reglas.rutasConsolidadoProveedor ?? {})));
    setUrPorEquipos(JSON.parse(JSON.stringify(reglas.urTarifaPorEquipos ?? [])));
  }, [reglas]);

  if (!reglas) return null;

  const proveedores = (reglas.proveedores ?? []).slice().sort();
  const aduanas = Object.keys(reglas.agenciaPorAduana ?? {}).sort();

  // --- DEDICADO ---
  const setTarifaDed = (prov, aduana, tipo, valor) =>
    setDedicado((p) => ({
      ...p,
      [prov]: { ...p[prov], [aduana]: { ...p[prov][aduana], [tipo]: valor } },
    }));

  const quitarDed = (prov, aduana) =>
    setDedicado((p) => {
      const delProv = { ...p[prov] };
      delete delProv[aduana];
      if (!Object.keys(delProv).length) {
        const copia = { ...p };
        delete copia[prov];
        return copia;
      }
      return { ...p, [prov]: delProv };
    });

  const agregarDed = () => {
    const { proveedor, aduana } = nuevoDed;
    if (!proveedor || !aduana || dedicado[proveedor]?.[aduana]) return;
    setDedicado((p) => ({
      ...p,
      [proveedor]: { ...(p[proveedor] ?? {}), [aduana]: Object.fromEntries(TIPOS_DEDICADO.map((t) => [t, 0])) },
    }));
    setNuevoDed({ proveedor: '', aduana: '' });
  };

  // --- CONSOLIDADO ---
  const setValorCons = (prov, aduana, franja, valor) =>
    setConsolidado((p) => ({
      ...p,
      [prov]: { ...p[prov], [aduana]: { ...p[prov][aduana], [franja]: valor } },
    }));

  const quitarCons = (prov, aduana) =>
    setConsolidado((p) => {
      const delProv = { ...p[prov] };
      delete delProv[aduana];
      if (!Object.keys(delProv).length) {
        const copia = { ...p };
        delete copia[prov];
        return copia;
      }
      return { ...p, [prov]: delProv };
    });

  const agregarCons = () => {
    const { proveedor, aduana } = nuevoCons;
    if (!proveedor || !aduana || consolidado[proveedor]?.[aduana]) return;
    const fila =
      aduana === '*'
        ? { flat: 0 }
        : Object.fromEntries(FRANJAS.map((f) => [f.clave, 0]));
    setConsolidado((p) => ({ ...p, [proveedor]: { ...(p[proveedor] ?? {}), [aduana]: fila } }));
    setNuevoCons({ proveedor: '', aduana: '' });
  };

  // --- UR por equipos ---
  const setUr = (i, campo, valor) =>
    setUrPorEquipos((p) => p.map((f, idx) => (idx === i ? { ...f, [campo]: valor } : f)));
  const quitarUr = (i) => setUrPorEquipos((p) => p.filter((_, idx) => idx !== i));
  const agregarUr = () =>
    setUrPorEquipos((p) => [...p, { equipos: (p.at(-1)?.equipos ?? 0) + 1, FTL: 0, RABON: 0 }]);

  const guardar = () => guardarFleteProv({ dedicado, consolidado, urPorEquipos });

  return (
    <Card>
      <h3 className="admin-section__title">Flete Proveedor</h3>
      <p className="admin-section__subtitle">
        Tarifa del proveedor a la aduana de cruce. Se compone de tres tablas: embarques
        dedicados, embarques consolidados, y la tarifa especial de UR por cantidad de equipos.
      </p>

      {/* ---------- DEDICADO ---------- */}
      <h4 className="admin-bloque__titulo">1 · Embarques DEDICADOS</h4>
      <p className="admin-section__subtitle">Tarifa fija (USD) por camión, según tipo de transporte.</p>

      {Object.keys(dedicado)
        .sort()
        .map((prov) => (
          <div className="admin-grupo" key={prov}>
            <h4 className="admin-grupo__titulo">{prov}</h4>
            <div className="admin-table">
              <div className="admin-table__header admin-table--ded">
                <span>Aduana</span>
                {TIPOS_DEDICADO.map((t) => (
                  <span key={t}>{t}</span>
                ))}
                <span></span>
              </div>
              {Object.keys(dedicado[prov])
                .sort()
                .map((aduana) => (
                  <div className="admin-table__row admin-table--ded" key={aduana}>
                    <span className="admin-table__label">{aduana}</span>
                    {TIPOS_DEDICADO.map((tipo) => (
                      <TextField
                        key={tipo}
                        type="number"
                        step="0.01"
                        value={dedicado[prov][aduana][tipo] ?? ''}
                        onChange={(e) => setTarifaDed(prov, aduana, tipo, e.target.value)}
                      />
                    ))}
                    <Button variant="text" onClick={() => quitarDed(prov, aduana)}>
                      Eliminar
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        ))}

      <div className="admin-agregar">
        <Select
          value={nuevoDed.proveedor}
          onChange={(e) => setNuevoDed((p) => ({ ...p, proveedor: e.target.value }))}
          placeholder="Proveedor"
        >
          {proveedores.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Select
          value={nuevoDed.aduana}
          onChange={(e) => setNuevoDed((p) => ({ ...p, aduana: e.target.value }))}
          placeholder="Aduana"
        >
          {aduanas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
        <Button variant="outlined" onClick={agregarDed} disabled={!nuevoDed.proveedor || !nuevoDed.aduana}>
          + Agregar
        </Button>
      </div>

      {/* ---------- CONSOLIDADO ---------- */}
      <h4 className="admin-bloque__titulo">2 · Embarques CONSOLIDADOS</h4>
      <p className="admin-section__subtitle">
        Tarifa en USD por libra según la franja de peso, salvo el cargo mínimo que es un monto
        fijo. La aduana <code>*</code> significa "tarifa plana sin importar la aduana" (así están
        configurados MiR y UR).
      </p>

      {Object.keys(consolidado)
        .sort()
        .map((prov) => (
          <div className="admin-grupo" key={prov}>
            <h4 className="admin-grupo__titulo">{prov}</h4>
            {Object.keys(consolidado[prov])
              .sort()
              .map((aduana) => (
                <div className="admin-subgrupo" key={aduana}>
                  <div className="admin-subgrupo__header">
                    <strong>{aduana === '*' ? 'Tarifa plana (cualquier aduana)' : aduana}</strong>
                    <Button variant="text" onClick={() => quitarCons(prov, aduana)}>
                      Eliminar
                    </Button>
                  </div>
                  <div className="admin-franjas">
                    {aduana === '*' ? (
                      <label>
                        Tarifa plana (USD)
                        <TextField
                          type="number"
                          step="0.01"
                          value={consolidado[prov][aduana].flat ?? ''}
                          onChange={(e) => setValorCons(prov, aduana, 'flat', e.target.value)}
                        />
                      </label>
                    ) : (
                      FRANJAS.map((f) => (
                        <label key={f.clave}>
                          {f.etiqueta}
                          <small>{f.ayuda}</small>
                          <TextField
                            type="number"
                            step="0.0001"
                            value={consolidado[prov][aduana][f.clave] ?? ''}
                            onChange={(e) => setValorCons(prov, aduana, f.clave, e.target.value)}
                          />
                        </label>
                      ))
                    )}
                  </div>
                </div>
              ))}
          </div>
        ))}

      <div className="admin-agregar">
        <Select
          value={nuevoCons.proveedor}
          onChange={(e) => setNuevoCons((p) => ({ ...p, proveedor: e.target.value }))}
          placeholder="Proveedor"
        >
          {proveedores.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Select
          value={nuevoCons.aduana}
          onChange={(e) => setNuevoCons((p) => ({ ...p, aduana: e.target.value }))}
          placeholder="Aduana"
        >
          <option value="*">Tarifa plana (cualquier aduana)</option>
          {aduanas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
        <Button variant="outlined" onClick={agregarCons} disabled={!nuevoCons.proveedor || !nuevoCons.aduana}>
          + Agregar
        </Button>
      </div>

      {/* ---------- UR POR EQUIPOS ---------- */}
      <h4 className="admin-bloque__titulo">3 · UR · tarifa por cantidad de equipos</h4>
      <p className="admin-section__subtitle">
        Aplica solo a UR con embalaje URe o UR20: la tarifa depende de cuántos equipos lleva el
        embarque (la "cantidad de bultos" capturada en el wizard).
      </p>

      <div className="admin-table">
        <div className="admin-table__header admin-table--ur">
          <span>Equipos</span>
          <span>FTL 53&apos;</span>
          <span>RABON 20&apos;</span>
          <span></span>
        </div>
        {urPorEquipos.map((fila, i) => (
          <div className="admin-table__row admin-table--ur" key={i}>
            <TextField
              type="number"
              min="1"
              value={fila.equipos}
              onChange={(e) => setUr(i, 'equipos', e.target.value)}
            />
            <TextField type="number" step="0.01" value={fila.FTL} onChange={(e) => setUr(i, 'FTL', e.target.value)} />
            <TextField
              type="number"
              step="0.01"
              value={fila.RABON}
              onChange={(e) => setUr(i, 'RABON', e.target.value)}
            />
            <Button variant="text" onClick={() => quitarUr(i)}>
              Eliminar
            </Button>
          </div>
        ))}
      </div>

      <div className="admin-agregar">
        <Button variant="outlined" onClick={agregarUr}>
          + Agregar fila
        </Button>
      </div>

      <div className="admin-section__actions">
        <Button onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar Flete Proveedor'}
        </Button>
      </div>
    </Card>
  );
}
