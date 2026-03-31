import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import Card from '../components/ui/Card';
import { Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SelectAccount() {
  const { cuentas, setTenant } = useAuthStore();
  const navigate = useNavigate();

  const handleSelect = async (cuenta: { id: number; nombre: string }) => {
    try {
      const { data } = await authApi.selectAccount(cuenta.id);
      const resp = data.data || data;
      setTenant(cuenta.id, cuenta.nombre, resp.token);
      navigate('/');
    } catch {
      toast.error('Error al seleccionar cuenta');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Wallet size={32} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Seleccionar Cuenta</h1>
        </div>
        <div className="space-y-3">
          {cuentas.map((cuenta) => (
            <Card key={cuenta.id} onClick={() => handleSelect(cuenta)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-300 rounded-lg flex items-center justify-center font-bold">
                  {cuenta.nombre.charAt(0)}
                </div>
                <span className="font-medium text-gray-800 dark:text-gray-200">{cuenta.nombre}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
