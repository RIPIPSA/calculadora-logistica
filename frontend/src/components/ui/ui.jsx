import './ui.css';

export function Button({ variant = 'filled', children, disabled, ...props }) {
  return (
    <button className={`ui-button ui-button--${variant}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`ui-card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function Field({ label, hint, error, children, required }) {
  return (
    <label className="ui-field">
      <span className="ui-field__label">
        {label}
        {required && <span className="ui-field__required"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="ui-field__error">{error}</span>
      ) : hint ? (
        <span className="ui-field__hint">{hint}</span>
      ) : null}
    </label>
  );
}

export function TextField({ error, ...props }) {
  return <input className={`ui-input ${error ? 'ui-input--error' : ''}`} {...props} />;
}

export function Select({ error, children, placeholder, ...props }) {
  return (
    <select className={`ui-input ui-select ${error ? 'ui-input--error' : ''}`} {...props}>
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>;
}
