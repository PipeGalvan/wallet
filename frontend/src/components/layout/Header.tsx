import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { authApi } from '../../api/auth';
import toast from 'react-hot-toast';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user, tenantName, cuentas, tenantId } = useAuth();
  const { setTenant } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSwitch = async (cuenta: { id: number; nombre: string }) => {
    if (cuenta.id === tenantId) {
      setDropdownOpen(false);
      return;
    }
    try {
      const { data } = await authApi.selectAccount(cuenta.id);
      const resp = data.data || data;
      setTenant(cuenta.id, cuenta.nombre, resp.token);
      setDropdownOpen(false);
      navigate('/');
    } catch {
      toast.error('Error al cambiar de cuenta');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden shrink-0"
        >
          <Menu size={20} />
        </button>

        {tenantName && (
          cuentas.length > 1 ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded-lg transition-colors text-sm text-gray-500 dark:text-gray-400 truncate"
              >
                <span className="truncate">Cuenta: <strong className="text-gray-700 dark:text-gray-300">{tenantName}</strong></span>
                <ChevronDown size={14} className={`shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50">
                  {cuentas.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSwitch(c)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className={`flex-1 ${c.id === tenantId ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {c.nombre}
                      </span>
                      {c.id === tenantId && <Check size={14} className="text-primary-600 dark:text-primary-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400 truncate">Cuenta: <strong className="text-gray-700 dark:text-gray-300">{tenantName}</strong></span>
          )
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={dark ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center text-sm font-bold">
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
