import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Wallet } from 'lucide-react';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return;
    }

    setLoading(true);
    await register(username, password);
    setLoading(false);
  };

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wallet size={32} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Wallet</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-center text-gray-800 dark:text-gray-100">
            Crear cuenta
          </h2>
          <Input
            label="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Elegí un nombre de usuario"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            minLength={6}
          />
          <div>
            <Input
              label="Confirmar contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetí tu contraseña"
              required
              minLength={6}
            />
            {passwordsMismatch && (
              <p className="mt-1 text-sm text-red-500">Las contraseñas no coinciden</p>
            )}
          </div>
          <Button
            type="submit"
            loading={loading}
            disabled={passwordsMismatch}
            className="w-full"
          >
            Registrarse
          </Button>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              Ingresá
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
