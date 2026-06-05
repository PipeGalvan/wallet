import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';

export function useAuth() {
  const navigate = useNavigate();
  const { token, user, cuentas, tenantId, tenantName, setAuth, setTenant, logout } = useAuthStore();

  const login = async (username: string, password: string) => {
    try {
      const { data } = await authApi.login({ username, password });
      const responseData = data.data || data;
      setAuth(responseData.token, responseData.user, responseData.cuentas);

      if (responseData.cuentas.length === 1) {
        await selectAccount(responseData.cuentas[0].id, responseData.cuentas[0].nombre, responseData.token);
      } else {
        navigate('/select-account');
      }
    } catch (err: any) {
      toast.error('Usuario o contraseña incorrectos');
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const { data } = await authApi.register({ username, password });
      const responseData = data.data || data;
      setAuth(responseData.token, responseData.user, responseData.cuentas);

      if (responseData.cuentas.length === 1) {
        await selectAccount(responseData.cuentas[0].id, responseData.cuentas[0].nombre, responseData.token);
      } else {
        navigate('/select-account');
      }
    } catch (err: any) {
      toast.error(
        err.response?.status === 409
          ? 'El nombre de usuario ya existe'
          : 'Error al crear la cuenta',
      );
    }
  };

  const selectAccount = async (propietarioId: number, nombre?: string, _existingToken?: string) => {
    try {
      const { data } = await authApi.selectAccount(propietarioId);
      const responseData = data.data || data;
      setTenant(propietarioId, nombre || responseData.propietario?.nombre || '', responseData.token);
      navigate('/');
    } catch (err: any) {
      toast.error('Error al seleccionar cuenta');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return {
    token,
    user,
    cuentas,
    tenantId,
    tenantName,
    isAuthenticated: !!token,
    hasTenant: !!tenantId,
    login,
    register,
    selectAccount,
    logout: handleLogout,
  };
}
