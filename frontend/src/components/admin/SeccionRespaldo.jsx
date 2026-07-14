import { useRef, useState } from 'react';
import { useAdmin } from './AdminContext.jsx';
import { Button, Card } from '../ui/ui.jsx';

export function SeccionRespaldo() {
  const { descargarRespaldo, restaurar, guardando } = useAdmin();
  const inputRef = useRef(null);
  const [confirmando, setConfirmando] = useState(false);
  const [archivoElegido, setArchivoElegido] = useState(null);

  const elegirArchivo = (e) => {
    setArchivoElegido(e.target.files?.[0] ?? null);
    setConfirmando(false);
  };

  const confirmarRestaurar = async () => {
    if (!archivoElegido) return;
    const ok = await restaurar(archivoElegido);
    if (ok) {
      setArchivoElegido(null);
      setConfirmando(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Card>
      <h3 className="admin-section__title">Respaldo y restauración</h3>
      <p className="admin-section__subtitle">
        Descarga el archivo completo de la base de reglas de negocio, o restaura uno anterior si
        algo salió mal en una migración.
      </p>

      <div className="admin-section__actions" style={{ justifyContent: 'flex-start' }}>
        <Button variant="outlined" onClick={descargarRespaldo}>
          Descargar respaldo (.db)
        </Button>
      </div>

      <div className="admin-respaldo__restaurar">
        <input ref={inputRef} type="file" accept=".db" onChange={elegirArchivo} />
        {archivoElegido && !confirmando && (
          <Button variant="outlined" onClick={() => setConfirmando(true)}>
            Restaurar "{archivoElegido.name}"
          </Button>
        )}
        {confirmando && (
          <div className="admin-respaldo__confirmacion">
            <p>
              Esto <strong>reemplaza todos los datos actuales</strong> (Tasas IGI, Honorarios,
              Impuestos y todos los catálogos) con lo que traiga ese archivo. Se guarda un
              respaldo del estado actual antes de sobreescribir, pero aun así confirma que es lo
              que quieres hacer.
            </p>
            <div className="admin-section__actions" style={{ justifyContent: 'flex-start' }}>
              <Button variant="outlined" onClick={() => setConfirmando(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmarRestaurar} disabled={guardando}>
                {guardando ? 'Restaurando…' : 'Sí, restaurar'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
