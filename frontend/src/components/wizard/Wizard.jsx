import { WizardProvider, useWizard, PASOS } from './WizardContext.jsx';
import { Stepper } from './Stepper.jsx';
import { PasoGeneral } from './PasoGeneral.jsx';
import { PasoMercancia } from './PasoMercancia.jsx';
import { PasoTransporte } from './PasoTransporte.jsx';
import { PasoResultado } from './PasoResultado.jsx';
import { Card, Button, Badge } from '../ui/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogoRipipsa } from '../ui/LogoRipipsa.jsx';
import './ui/wizard.css';

const PASO_COMPONENTES = [PasoGeneral, PasoMercancia, PasoTransporte, PasoResultado];

function WizardBody() {
  const { state, goTo, pasoValido } = useWizard();
  const { usuario, logout } = useAuth();
  const PasoActivo = PASO_COMPONENTES[state.paso];
  const esUltimoPaso = state.paso === PASOS.length - 1;

  return (
    <div className="wizard-shell">
      <div className="wizard-header">
        <span className="wizard-header__brand">
          <LogoRipipsa size={28} />
          <span>Costo Logístico</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {usuario?.modoPrueba && <Badge tone="warning">Modo de prueba · sin Epicor</Badge>}
          {usuario && (
            <Button variant="text" onClick={logout}>
              Salir ({usuario.nombre})
            </Button>
          )}
        </div>
      </div>

      <Stepper />

      <Card>
        <PasoActivo />

        {!esUltimoPaso && (
          <div className="wizard-step__actions">
            <Button variant="outlined" onClick={() => goTo(state.paso - 1)} disabled={state.paso === 0}>
              Anterior
            </Button>
            <Button onClick={() => goTo(state.paso + 1)} disabled={!pasoValido}>
              Siguiente
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export function Wizard() {
  return (
    <WizardProvider>
      <WizardBody />
    </WizardProvider>
  );
}
