import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Login } from './components/login/Login.jsx';
import { Wizard } from './components/wizard/Wizard.jsx';

function AppGate() {
  const { usuario } = useAuth();
  return usuario ? <Wizard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}
