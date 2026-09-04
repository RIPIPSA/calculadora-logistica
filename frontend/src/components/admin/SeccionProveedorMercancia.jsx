import { useEffect, useState } from 'react';
import { useAdmin } from './AdminContext.jsx';
import { Button, Card, Select, TextField } from '../ui/ui.jsx';

/**
 * Proveedor-Mercancía: qué productos ofrece cada proveedor.
 *
 * El producto se elige de una LISTA, nunca se escribe libre. La razón: el
 * texto tiene que coincidir carácter por carácter con la descripción del
 * catálogo de Tasas IGI, porque así es como la app sugiere la tasa al
 * capturar un embarque. Un espacio de más al final bastaría para que la
 * sugerencia dejara de funcionar, sin ningún mensaje de error visible.
 *
 * Por eso, para dar de alta un producto nuevo primero hay que crearlo en
 * la pestaña "Tasas IGI" y luego asignarlo aquí.
 */
export function SeccionProveedorMercancia() {
  const { reglas, guardarProvProd, guardando } = useAdmin();
  const [porProveedor, setPorProveedor] = useState({});
  const [nuevoProveedor, setNuevoProveedor] = useState('');
  const [seleccion, setSeleccion] = useState({}); // { [proveedor]: producto elegido en su dropdown }

  useEffect(() => {
    if (reglas?.productosPorProveedor) {
      setPorProveedor(JSON.parse(JSON.stringify(reglas.productosPorProveedor)));
    }
  }, [reglas]);

  if (!reglas) return null;

  const productosDisponibles = (reglas.tasasIgi ?? []).map((t) => t.descripcion).sort();

  const agregarProducto = (proveedor) => {
    const producto = seleccion[proveedor];
    if (!producto) return;
    if (porProveedor[proveedor]?.includes(producto)) return; // ya asignado
    setPorProveedor((prev) => ({ ...prev, [proveedor]: [...(prev[proveedor] ?? []), producto] }));
    setSeleccion((prev) => ({ ...prev, [proveedor]: '' }));
  };

  const quitarProducto = (proveedor, producto) => {
    setPorProveedor((prev) => ({
      ...prev,
      [proveedor]: prev[proveedor].filter((p) => p !== producto),
    }));
  };

  const agregarProveedor = () => {
    const nombre = nuevoProveedor.trim();
    if (!nombre || porProveedor[nombre]) return;
    setPorProveedor((prev) => ({ ...prev, [nombre]: [] }));
    setNuevoProveedor('');
  };

  const proveedores = Object.keys(porProveedor).sort();

  return (
    <Card>
      <h3 className="admin-section__title">Proveedor-Mercancía</h3>
      <p className="admin-section__subtitle">
        Qué productos ofrece cada proveedor. El producto se elige del catálogo de Tasas IGI: si
        necesitas uno que no está en la lista, créalo primero en la pestaña <strong>Tasas IGI</strong>{' '}
        y luego asígnalo aquí.
      </p>

      {proveedores.map((proveedor) => (
        <div className="admin-grupo" key={proveedor}>
          <h4 className="admin-grupo__titulo">{proveedor}</h4>

          {porProveedor[proveedor].length === 0 ? (
            <p className="admin-grupo__vacio">
              Sin productos asignados. El wizard deshabilitará el combo de producto para este
              proveedor.
            </p>
          ) : (
            <ul className="admin-chips">
              {porProveedor[proveedor].map((producto) => (
                <li className="admin-chip" key={producto}>
                  <span>{producto}</span>
                  <button
                    type="button"
                    className="admin-chip__quitar"
                    onClick={() => quitarProducto(proveedor, producto)}
                    aria-label={`Quitar ${producto}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="admin-agregar">
            <Select
              value={seleccion[proveedor] ?? ''}
              onChange={(e) => setSeleccion((prev) => ({ ...prev, [proveedor]: e.target.value }))}
              placeholder="Elige un producto del catálogo"
            >
              {productosDisponibles
                .filter((p) => !porProveedor[proveedor].includes(p))
                .map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
            </Select>
            <Button
              variant="outlined"
              onClick={() => agregarProducto(proveedor)}
              disabled={!seleccion[proveedor]}
            >
              + Agregar
            </Button>
          </div>
        </div>
      ))}

      <div className="admin-agregar admin-agregar--proveedor">
        <TextField
          placeholder="Nombre del nuevo proveedor"
          value={nuevoProveedor}
          onChange={(e) => setNuevoProveedor(e.target.value)}
        />
        <Button variant="outlined" onClick={agregarProveedor} disabled={!nuevoProveedor.trim()}>
          + Agregar proveedor
        </Button>
      </div>

      <div className="admin-section__actions">
        <Button onClick={() => guardarProvProd(porProveedor)} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar Proveedor-Mercancía'}
        </Button>
      </div>
    </Card>
  );
}
