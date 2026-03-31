import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Wallet } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(username, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wallet size={32} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Wallet</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <Input
            label="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ingrese su usuario"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingrese su contraseña"
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            Ingresar
          </Button>
        </form>
      </div>
    </div>
  );
}
