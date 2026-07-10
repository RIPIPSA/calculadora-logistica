import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Card, Field, TextField } from '../ui/ui.jsx';
import { LogoRipipsa } from '../ui/LogoRipipsa.jsx';
import { isEpicorConfigured } from '../../services/config.js';
import './login.css';

export function Login() {
  const { login, cargando, error, modoPruebaDisponible, entrarEnModoPrueba } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!usuario || !password) return;
    login(usuario, password);
  };

  return (
    <div className="login-screen">
      <div className="login-screen__brand">
        <LogoRipipsa size={72} />
        <p className="login-screen__tagline">Cálculo de Costo Logístico</p>
      </div>

      <Card className="login-card">
        <h1 className="login-card__title">Iniciar sesión</h1>
        <p className="login-card__subtitle">Usa tu usuario y contraseña de Epicor.</p>

        {!isEpicorConfigured() && (
          <div className="login-card__notice">
            La conexión a Epicor todavía no está configurada (falta{' '}
            <code>VITE_EPICOR_TOKEN_URL</code> en el <code>.env</code>).
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Usuario" required>
            <TextField
              type="text"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="usuario.epicor"
              disabled={!isEpicorConfigured()}
            />
          </Field>
          <Field label="Contraseña" required>
            <TextField
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={!isEpicorConfigured()}
            />
          </Field>

          {error && <p className="login-card__error">{error}</p>}

          <Button type="submit" disabled={cargando || !isEpicorConfigured()} style={{ width: '100%' }}>
            {cargando ? 'Verificando…' : 'Entrar'}
          </Button>
        </form>

        {modoPruebaDisponible && (
          <div className="login-card__dev">
            <div className="login-card__dev-divider">
              <span>o, mientras conectan Epicor</span>
            </div>
            <Button
              type="button"
              variant="outlined"
              disabled={cargando}
              style={{ width: '100%' }}
              onClick={() => entrarEnModoPrueba(usuario)}
            >
              Entrar en modo de prueba (sin Epicor)
            </Button>
            <p className="login-card__dev-hint">
              Este botón solo aparece corriendo <code>npm run dev</code> en tu máquina — no existe
              en un build de producción, así que no hay riesgo de dejarlo expuesto a los usuarios
              finales.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
