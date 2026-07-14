import { PASOS, useWizard } from './WizardContext.jsx';
import './wizard.css';

export function Stepper() {
  const { state, goTo } = useWizard();

  return (
    <ol className="stepper" aria-label="Progreso del cálculo">
      {PASOS.map((nombre, i) => {
        const estado = i === state.paso ? 'actual' : i < state.paso ? 'hecho' : 'pendiente';
        return (
          <li key={nombre} className={`stepper__item stepper__item--${estado}`}>
            <button
              type="button"
              className="stepper__dot"
              onClick={() => i < state.paso && goTo(i)}
              disabled={i > state.paso}
              aria-current={estado === 'actual' ? 'step' : undefined}
            >
              {estado === 'hecho' ? '✓' : i + 1}
            </button>
            <span className="stepper__label">{nombre}</span>
          </li>
        );
      })}
    </ol>
  );
}
